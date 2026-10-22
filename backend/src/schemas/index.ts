import { z } from 'zod';
import { Role, ItemType, ItemStatus, StorageArrangement } from '@prisma/client';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  universityId: z.string().min(3, 'University ID must be at least 3 characters').max(50).optional().or(z.literal('')),
  phone: z.string().min(9, 'Phone number must be at least 9 characters').max(20),
  department: z.string().max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
}).refine((data) => !!data.email || !!data.universityId, {
  message: 'Either email or university ID must be provided',
  path: ['email']
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or University ID is required'),
  password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token is required')
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(9).max(20).optional(),
  department: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const pushTokenSchema = z.object({
  pushToken: z.string().min(5, 'Valid push token required')
});

export const createItemSchema = z.object({
  type: z.nativeEnum(ItemType, { errorMap: () => ({ message: 'Type must be LOST or FOUND' }) }),
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  categoryId: z.string().uuid('Valid Category ID is required'),
  locationId: z.string().uuid('Valid Location ID is required'),
  dateEvent: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) <= new Date(Date.now() + 60000), {
    message: 'Event date must be a valid date and cannot be in the future'
  }),
  color: z.string().max(50).optional(),
  brand: z.string().max(50).optional(),
  hiddenDetail: z.string().max(500).optional(),
  keptAt: z.nativeEnum(StorageArrangement).optional().default(StorageArrangement.WITH_FINDER),
  contactPreference: z.enum(['IN_APP', 'PHONE', 'EMAIL']).optional().default('IN_APP'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  imageUrls: z.array(z.string().url()).max(3, 'A maximum of 3 images is allowed').optional()
});

export const updateItemSchema = createItemSchema.partial();

export const updateItemStatusSchema = z.object({
  status: z.nativeEnum(ItemStatus),
  reason: z.string().max(300).optional()
});

export const queryItemsSchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
  type: z.nativeEnum(ItemType).optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dateEvent', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

export const createClaimSchema = z.object({
  proofDescription: z.string().min(15, 'Proof description must be at least 15 characters').max(2000),
  verificationAnswers: z.string().max(2000).optional(),
  proofImageUrl: z.string().url().optional(),
  lostDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Invalid lost date' }),
  lostLocation: z.string().max(200).optional()
});

export const reviewClaimSchema = z.object({
  reviewNote: z.string().max(1000).optional()
});

export const scheduleHandoverSchema = z.object({
  handoverLocation: z.string().min(3, 'Handover location is required').max(200),
  handoverAt: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), {
    message: 'Handover date must be a valid future date'
  }),
  note: z.string().max(500).optional()
});

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).default('cube-outline'),
  isActive: z.boolean().optional()
});

export const locationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional()
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.nativeEnum(Role).optional()
});
