import { prisma } from '../config/prisma';
import { ConflictError, NotFoundError } from '../errors/AppError';

export class CategoryService {
  async listCategories(includeInactive = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { items: true } }
      }
    });
  }

  async createCategory(data: { name: string; description?: string; icon?: string; isActive?: boolean }) {
    const existing = await prisma.category.findUnique({
      where: { name: data.name.trim() }
    });
    if (existing) {
      throw new ConflictError('A category with this name already exists');
    }

    return prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        icon: data.icon || 'cube-outline',
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async updateCategory(id: string, data: { name?: string; description?: string; icon?: string; isActive?: boolean }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (data.name && data.name.trim() !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: data.name.trim() }
      });
      if (existing) {
        throw new ConflictError('A category with this name already exists');
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() } : {}),
        ...(data.icon ? { icon: data.icon } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
      }
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } }
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // If items exist, soft-deactivate instead of hard deleting to preserve historical data integrity
    if (category._count.items > 0) {
      return prisma.category.update({
        where: { id },
        data: { isActive: false }
      });
    }

    return prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
