import { prisma } from '../config/prisma';
import { ConflictError, NotFoundError } from '../errors/AppError';

export class LocationService {
  async listLocations(includeInactive = false) {
    return prisma.location.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { items: true } }
      }
    });
  }

  async createLocation(data: { name: string; description?: string; latitude?: number; longitude?: number; isActive?: boolean }) {
    const existing = await prisma.location.findUnique({
      where: { name: data.name.trim() }
    });
    if (existing) {
      throw new ConflictError('A location with this name already exists');
    }

    return prisma.location.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async updateLocation(id: string, data: { name?: string; description?: string; latitude?: number; longitude?: number; isActive?: boolean }) {
    const location = await prisma.location.findUnique({ where: { id } });
    if (!location) {
      throw new NotFoundError('Location not found');
    }

    if (data.name && data.name.trim() !== location.name) {
      const existing = await prisma.location.findUnique({
        where: { name: data.name.trim() }
      });
      if (existing) {
        throw new ConflictError('A location with this name already exists');
      }
    }

    return prisma.location.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.description !== undefined ? { description: data.description?.trim() } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {})
      }
    });
  }

  async deleteLocation(id: string) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } }
    });

    if (!location) {
      throw new NotFoundError('Location not found');
    }

    if (location._count.items > 0) {
      return prisma.location.update({
        where: { id },
        data: { isActive: false }
      });
    }

    return prisma.location.delete({ where: { id } });
  }
}

export const locationService = new LocationService();
