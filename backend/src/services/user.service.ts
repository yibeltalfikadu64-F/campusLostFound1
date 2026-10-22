import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError } from '../errors/AppError';
import { hashPassword, comparePassword } from '../utils/password';

export class UserService {
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        universityId: true,
        phone: true,
        department: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string; department?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
        ...(data.department !== undefined ? { department: data.department?.trim() || null } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {})
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        universityId: true,
        phone: true,
        department: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return user;
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const matches = await comparePassword(currentPass, user.passwordHash);
    if (!matches) {
      throw new BadRequestError('Current password does not match');
    }

    const newHash = await hashPassword(newPass);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    // Revoke existing refresh tokens on password change
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });

    return { message: 'Password updated successfully' };
  }

  async updatePushToken(userId: string, pushToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { pushToken }
    });
    return { message: 'Push token updated successfully' };
  }

  async getMyItems(userId: string) {
    return prisma.item.findMany({
      where: { reporterId: userId, deletedAt: null },
      include: {
        category: true,
        location: true,
        images: true,
        _count: { select: { claims: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMyClaims(userId: string) {
    return prisma.claim.findMany({
      where: { claimantId: userId },
      include: {
        item: {
          include: {
            category: true,
            location: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const userService = new UserService();
