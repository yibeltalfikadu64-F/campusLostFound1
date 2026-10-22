import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadRequestError, UnauthorizedError, ConflictError } from '../errors/AppError';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } from '../utils/jwt';
import { AuthUser } from '../types';

export class AuthService {
  async register(data: {
    fullName: string;
    email?: string;
    universityId?: string;
    phone: string;
    department?: string;
    password: string;
  }) {
    const email = data.email ? data.email.trim().toLowerCase() : null;
    const universityId = data.universityId ? data.universityId.trim().toUpperCase() : null;

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new ConflictError('A user with this email address already exists');
      }
    }

    if (universityId) {
      const existingId = await prisma.user.findUnique({ where: { universityId } });
      if (existingId) {
        throw new ConflictError('A user with this university ID already exists');
      }
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName.trim(),
        email,
        universityId,
        phone: data.phone.trim(),
        department: data.department?.trim() || null,
        passwordHash,
        role: Role.USER, // Regular registration never creates privileged roles
        isActive: true
      }
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      universityId: user.universityId,
      fullName: user.fullName,
      role: user.role
    };

    const accessToken = generateAccessToken(authUser);
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async login(identifier: string, password: string) {
    const cleanIdentifier = identifier.trim();

    // Check by email or university ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { universityId: cleanIdentifier.toUpperCase() }
        ]
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact campus security administrator.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      universityId: user.universityId,
      fullName: user.fullName,
      role: user.role
    };

    const accessToken = generateAccessToken(authUser);
    const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return {
      user: authUser,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const oldTokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldTokenHash },
      include: { user: true }
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      // Possible token reuse attempt: revoke all tokens for this user
      if (storedToken) {
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { isRevoked: true }
        });
      }
      throw new UnauthorizedError('Refresh token is invalid or has already been used');
    }

    const user = storedToken.user;
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Revoke old refresh token (Token Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true }
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      universityId: user.universityId,
      fullName: user.fullName,
      role: user.role
    };

    const newAccessToken = generateAccessToken(authUser);
    const { token: newRefreshToken, tokenHash: newTokenHash, expiresAt } = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt
      }
    });

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    try {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true }
      });
    } catch {
      // Ignore errors on logout
    }
  }
}

export const authService = new AuthService();
