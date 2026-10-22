import { Prisma, Role, ItemType, ItemStatus, StorageArrangement } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../errors/AppError';
import { matchingService } from './matching.service';
import { AuthUser } from '../types';

export class ItemService {
  async createItem(
    reporterId: string,
    data: {
      type: ItemType;
      title: string;
      description: string;
      categoryId: string;
      locationId: string;
      dateEvent: string;
      color?: string;
      brand?: string;
      hiddenDetail?: string;
      keptAt?: StorageArrangement;
      contactPreference?: string;
      latitude?: number;
      longitude?: number;
      imageUrls?: string[];
    }
  ) {
    // Validate category & location exist
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestError('Invalid or inactive category');
    }

    const location = await prisma.location.findUnique({ where: { id: data.locationId } });
    if (!location || !location.isActive) {
      throw new BadRequestError('Invalid or inactive location');
    }

    const dateEvent = new Date(data.dateEvent);

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          reporterId,
          type: data.type,
          title: data.title.trim(),
          description: data.description.trim(),
          categoryId: data.categoryId,
          locationId: data.locationId,
          dateEvent,
          color: data.color?.trim() || null,
          brand: data.brand?.trim() || null,
          hiddenDetail: data.hiddenDetail?.trim() || null,
          keptAt: data.keptAt || StorageArrangement.WITH_FINDER,
          contactPreference: data.contactPreference || 'IN_APP',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          status: ItemStatus.OPEN,
          images: data.imageUrls && data.imageUrls.length > 0 ? {
            create: data.imageUrls.slice(0, 3).map((url) => ({ imageUrl: url }))
          } : undefined
        },
        include: {
          images: true,
          category: true,
          location: true,
          reporter: {
            select: { id: true, fullName: true, department: true, avatarUrl: true }
          }
        }
      });

      // Record initial status history
      await tx.statusHistory.create({
        data: {
          itemId: created.id,
          oldStatus: 'NONE',
          newStatus: ItemStatus.OPEN,
          changedBy: reporterId,
          reason: 'Initial item report creation'
        }
      });

      return created;
    });

    // Run matching asynchronously
    setImmediate(() => {
      matchingService.findMatchesForNewItem(item.id).catch(() => {});
    });

    return item;
  }

  async listItems(query: {
    page?: number;
    limit?: number;
    type?: ItemType;
    categoryId?: string;
    locationId?: string;
    status?: ItemStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'dateEvent' | 'title';
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {
      deletedAt: null
    };

    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.locationId) where.locationId = query.locationId;
    if (query.status) {
      where.status = query.status;
    } else {
      // Default: exclude RETURNED and CLOSED from generic open feeds unless requested
      where.status = { notIn: [ItemStatus.CLOSED] };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { color: { contains: term, mode: 'insensitive' } }
      ];
    }

    if (query.startDate || query.endDate) {
      where.dateEvent = {};
      if (query.startDate) where.dateEvent.gte = new Date(query.startDate);
      if (query.endDate) where.dateEvent.lte = new Date(query.endDate);
    }

    const orderBy: Prisma.ItemOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.sortOrder || 'desc'
    };

    const [total, items] = await Promise.all([
      prisma.item.count({ where }),
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          reporterId: true,
          type: true,
          title: true,
          description: true,
          color: true,
          brand: true,
          dateEvent: true,
          latitude: true,
          longitude: true,
          contactPreference: true,
          keptAt: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true, icon: true } },
          location: { select: { id: true, name: true, latitude: true, longitude: true } },
          images: { select: { id: true, imageUrl: true } },
          reporter: {
            select: { id: true, fullName: true, department: true, avatarUrl: true }
          },
          _count: { select: { claims: true } }
          // Note: hiddenDetail is explicitly excluded
        }
      })
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getItemById(itemId: string, currentUser?: AuthUser) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        location: true,
        images: true,
        reporter: {
          select: { id: true, fullName: true, department: true, avatarUrl: true }
        },
        _count: { select: { claims: true } }
      }
    });

    if (!item || item.deletedAt) {
      throw new NotFoundError('Item not found or has been removed');
    }

    const canSeeHiddenDetail = currentUser && (
      currentUser.id === item.reporterId ||
      currentUser.role === Role.ADMIN ||
      currentUser.role === Role.SECURITY_OFFICER
    );

    // If not authorized to see hidden verification detail, strip it
    if (!canSeeHiddenDetail) {
      const { hiddenDetail, ...safeItem } = item;
      return safeItem;
    }

    return item;
  }

  async updateItem(itemId: string, user: AuthUser, data: any) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.deletedAt) {
      throw new NotFoundError('Item not found');
    }

    const isOwner = item.reporterId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.SECURITY_OFFICER;

    if (!isOwner && !isStaff) {
      throw new ForbiddenError('You are not authorized to update this item');
    }

    if (item.status === ItemStatus.RETURNED || item.status === ItemStatus.CLOSED) {
      throw new BadRequestError('Cannot update an item that has already been returned or closed');
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(data.title ? { title: data.title.trim() } : {}),
        ...(data.description ? { description: data.description.trim() } : {}),
        ...(data.categoryId ? { categoryId: data.categoryId } : {}),
        ...(data.locationId ? { locationId: data.locationId } : {}),
        ...(data.color !== undefined ? { color: data.color?.trim() || null } : {}),
        ...(data.brand !== undefined ? { brand: data.brand?.trim() || null } : {}),
        ...(data.hiddenDetail !== undefined ? { hiddenDetail: data.hiddenDetail?.trim() || null } : {}),
        ...(data.keptAt ? { keptAt: data.keptAt } : {}),
        ...(data.contactPreference ? { contactPreference: data.contactPreference } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {})
      },
      include: {
        category: true,
        location: true,
        images: true
      }
    });

    return updated;
  }

  async deleteItem(itemId: string, user: AuthUser) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.deletedAt) {
      throw new NotFoundError('Item not found');
    }

    const isOwner = item.reporterId === user.id;
    const isAdmin = user.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You are not authorized to delete this item');
    }

    // Soft delete to maintain claim history
    await prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: new Date(), status: ItemStatus.CLOSED }
    });

    await prisma.statusHistory.create({
      data: {
        itemId,
        oldStatus: item.status,
        newStatus: ItemStatus.CLOSED,
        changedBy: user.id,
        reason: 'Item deleted / archived by user or administrator'
      }
    });

    return { message: 'Item deleted successfully' };
  }

  async updateItemStatus(itemId: string, user: AuthUser, status: ItemStatus, reason?: string) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.deletedAt) {
      throw new NotFoundError('Item not found');
    }

    const isOwner = item.reporterId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.SECURITY_OFFICER;

    if (!isOwner && !isStaff) {
      throw new ForbiddenError('Not authorized to update item status');
    }

    const oldStatus = item.status;
    const updated = await prisma.$transaction(async (tx) => {
      const itemUpdate = await tx.item.update({
        where: { id: itemId },
        data: { status }
      });

      await tx.statusHistory.create({
        data: {
          itemId,
          oldStatus,
          newStatus: status,
          changedBy: user.id,
          reason: reason || 'Manual status transition'
        }
      });

      return itemUpdate;
    });

    return updated;
  }

  async getItemHistory(itemId: string) {
    return prisma.statusHistory.findMany({
      where: { itemId },
      include: {
        changer: {
          select: { id: true, fullName: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getItemClaims(itemId: string, user: AuthUser) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.deletedAt) {
      throw new NotFoundError('Item not found');
    }

    const isOwner = item.reporterId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.SECURITY_OFFICER;

    if (!isOwner && !isStaff) {
      throw new ForbiddenError('Only the reporter and campus security can view claims for this item');
    }

    return prisma.claim.findMany({
      where: { itemId },
      include: {
        claimant: {
          select: { id: true, fullName: true, email: true, phone: true, department: true, universityId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const itemService = new ItemService();
