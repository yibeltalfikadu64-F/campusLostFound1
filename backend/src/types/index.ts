import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email?: string | null;
  universityId?: string | null;
  role: Role;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
