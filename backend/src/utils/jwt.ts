import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { AuthUser } from '../types';

export function generateAccessToken(payload: AuthUser): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as any
  });
}

export function generateRefreshToken(userId: string): { token: string; tokenHash: string; expiresAt: Date } {
  const token = jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any
  });
  const tokenHash = hashToken(token);
  // Default 7 days from now
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function verifyAccessToken(token: string): AuthUser {
  return jwt.verify(token, config.jwt.accessSecret) as AuthUser;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
