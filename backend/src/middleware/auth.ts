import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';

export async function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError('Token is invalid or has expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        universityId: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    req.user = {
      id: user.id,
      email: user.email,
      universityId: user.universityId,
      fullName: user.fullName,
      role: user.role
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Operation requires one of roles: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
}
