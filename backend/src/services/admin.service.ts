import { Role, ItemStatus, ClaimStatus, ItemType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { AuthUser } from '../types';

export class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalItems,
      lostCount,
      foundCount,
      returnedCount,
      openCount,
      claimPendingCount,
      totalClaims,
      pendingClaims,
      approvedClaims,
      recentItems,
      recentClaims
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.item.count({ where: { deletedAt: null } }),
      prisma.item.count({ where: { type: ItemType.LOST, deletedAt: null } }),
      prisma.item.count({ where: { type: ItemType.FOUND, deletedAt: null } }),
      prisma.item.count({ where: { status: ItemStatus.RETURNED, deletedAt: null } }),
      prisma.item.count({ where: { status: ItemStatus.OPEN, deletedAt: null } }),
      prisma.item.count({ where: { status: ItemStatus.CLAIM_PENDING, deletedAt: null } }),
      prisma.claim.count(),
      prisma.claim.count({ where: { status: ClaimStatus.PENDING } }),
      prisma.claim.count({ where: { status: ClaimStatus.APPROVED } }),
      prisma.item.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: true, location: true, reporter: { select: { fullName: true } } }
      }),
      prisma.claim.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { item: { select: { title: true, type: true } }, claimant: { select: { fullName: true } } }
      })
    ]);

    const recoveryRate = totalItems > 0 ? Number(((returnedCount / totalItems) * 100).toFixed(1)) : 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers
      },
      items: {
        total: totalItems,
        lost: lostCount,
        found: foundCount,
        returned: returnedCount,
        open: openCount,
        claimPending: claimPendingCount,
        recoveryRatePercentage: recoveryRate
      },
      claims: {
        total: totalClaims,
        pending: pendingClaims,
        approved: approvedClaims
      },
      recentItems,
      recentClaims
    };
  }

  async listUsers(query: { page?: number; limit?: number; role?: Role; search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { universityId: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          universityId: true,
          phone: true,
          role: true,
          department: true,
          isActive: true,
          createdAt: true,
          _count: { select: { items: true, claims: true } }
        }
      })
    ]);

    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserStatus(targetUserId: string, adminUser: AuthUser, data: { isActive?: boolean; role?: Role }) {
    if (targetUserId === adminUser.id && data.isActive === false) {
      throw new BadRequestError('Administrators cannot deactivate their own accounts');
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.role ? { role: data.role } : {})
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE_USER_STATUS',
        targetType: 'User',
        targetId: targetUserId,
        details: JSON.stringify({ changes: data, updatedUser: updated.fullName })
      }
    });

    return updated;
  }

  async listAdminClaims(query: { page?: number; limit?: number; status?: ClaimStatus }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [total, claims] = await Promise.all([
      prisma.claim.count({ where }),
      prisma.claim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          item: {
            include: { category: true, location: true, images: true }
          },
          claimant: {
            select: { id: true, fullName: true, email: true, phone: true, department: true, universityId: true }
          }
        }
      })
    ]);

    return {
      claims,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async moderateItem(itemId: string, adminUser: AuthUser, data: { status?: ItemStatus; reason: string }) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundError('Item not found');
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...(data.status ? { status: data.status } : {})
      }
    });

    await prisma.statusHistory.create({
      data: {
        itemId,
        oldStatus: item.status,
        newStatus: data.status || item.status,
        changedBy: adminUser.id,
        reason: `[ADMIN MODERATION] ${data.reason}`
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'MODERATE_ITEM',
        targetType: 'Item',
        targetId: itemId,
        details: JSON.stringify({ previousStatus: item.status, newStatus: data.status, reason: data.reason })
      }
    });

    return updated;
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } }
        }
      })
    ]);

    return {
      logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const adminService = new AdminService();
