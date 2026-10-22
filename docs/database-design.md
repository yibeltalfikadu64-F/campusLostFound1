# Database Design: Injibara Campus Lost & Found

## 1. Relational Schema Summary
The database is built on PostgreSQL using Prisma ORM. UUID primary keys are used across all tables to avoid sequential enumeration vulnerabilities.

---

## 2. Entity Definitions

### 2.1 User
Represents students, campus staff, and security administrators.
- `id` (UUID, Primary Key)
- `fullName` (String, max 100)
- `email` (String, Unique, Nullable)
- `universityId` (String, Unique, Nullable - e.g. UGR/14022/14)
- `phone` (String, max 20)
- `passwordHash` (String, bcrypt salt 10)
- `role` (Enum: `USER`, `ADMIN`, `SECURITY_OFFICER`, default `USER`)
- `department` (String, Nullable)
- `avatarUrl` (String, Nullable)
- `isActive` (Boolean, default `true`)
- `pushToken` (String, Nullable)
- `createdAt`, `updatedAt` (Timestamp)

**Indexes:** `[role]`, `[isActive]`, `[email]`, `[universityId]`.

### 2.2 Category
Categorizes items for search and discovery.
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (String, Nullable)
- `icon` (String, default `cube-outline`)
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt` (Timestamp)

### 2.3 Location
Official Injibara University campus buildings and gates.
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `description` (String, Nullable)
- `latitude` (Float, Nullable)
- `longitude` (Float, Nullable)
- `isActive` (Boolean, default `true`)
- `createdAt`, `updatedAt` (Timestamp)

### 2.4 Item
Reported lost or found items.
- `id` (UUID, Primary Key)
- `reporterId` (UUID, Foreign Key → `User.id`)
- `type` (Enum: `LOST`, `FOUND`)
- `categoryId` (UUID, Foreign Key → `Category.id`)
- `locationId` (UUID, Foreign Key → `Location.id`)
- `title` (String, max 150)
- `description` (String, max 2000)
- `color` (String, Nullable)
- `brand` (String, Nullable)
- `hiddenDetail` (String, Nullable - private verification clue, excluded from public endpoints)
- `dateEvent` (Timestamp)
- `latitude`, `longitude` (Float, Nullable)
- `contactPreference` (String, default `IN_APP`)
- `keptAt` (Enum: `WITH_FINDER`, `SECURITY_OFFICE`, `STUDENT_SERVICES`)
- `status` (Enum: `OPEN`, `CLAIM_PENDING`, `APPROVED`, `RETURNED`, `CLOSED`, `REJECTED`, `EXPIRED`)
- `expiresAt` (Timestamp, Nullable)
- `createdAt`, `updatedAt` (Timestamp)
- `deletedAt` (Timestamp, Nullable - soft deletion)

**Indexes:** `[status, type, categoryId, createdAt]`, `[locationId]`, `[reporterId]`.

### 2.5 ItemImage
Photos attached to items (up to 3 per item).
- `id` (UUID, Primary Key)
- `itemId` (UUID, Foreign Key → `Item.id` ON DELETE CASCADE)
- `imageUrl` (String)
- `createdAt` (Timestamp)

### 2.6 Claim
Ownership claims filed by students against found items.
- `id` (UUID, Primary Key)
- `itemId` (UUID, Foreign Key → `Item.id` ON DELETE CASCADE)
- `claimantId` (UUID, Foreign Key → `User.id`)
- `proofDescription` (String, max 2000)
- `verificationAnswers` (String, Nullable)
- `proofImageUrl` (String, Nullable)
- `lostDate` (Timestamp, Nullable)
- `lostLocation` (String, Nullable)
- `status` (Enum: `PENDING`, `APPROVED`, `REJECTED`, `HANDOVER_SCHEDULED`, `RETURNED`, `CANCELLED`)
- `reviewNote` (String, Nullable)
- `reviewedBy` (String, Nullable)
- `handoverLocation` (String, Nullable)
- `handoverAt` (Timestamp, Nullable)
- `returnedAt` (Timestamp, Nullable)
- `createdAt`, `updatedAt` (Timestamp)

**Indexes:** `[itemId, status]`, `[claimantId]`.

### 2.7 StatusHistory
Audit trail of status transitions for items and claims.
- `id` (UUID, Primary Key)
- `itemId` (UUID, Foreign Key → `Item.id` ON DELETE CASCADE)
- `claimId` (UUID, Nullable, Foreign Key → `Claim.id` ON DELETE SET NULL)
- `oldStatus` (String)
- `newStatus` (String)
- `changedBy` (UUID, Foreign Key → `User.id`)
- `reason` (String, Nullable)
- `createdAt` (Timestamp)

### 2.8 Notification
In-app and push notification records.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → `User.id` ON DELETE CASCADE)
- `title` (String)
- `body` (String)
- `type` (Enum: `CLAIM_SUBMITTED`, `CLAIM_APPROVED`, `CLAIM_REJECTED`, `HANDOVER_SCHEDULED`, `ITEM_RETURNED`, `MATCH_FOUND`, `ITEM_MODERATED`, `SYSTEM`)
- `relatedItemId` (UUID, Nullable)
- `relatedClaimId` (UUID, Nullable)
- `isRead` (Boolean, default `false`)
- `createdAt` (Timestamp)

### 2.9 RefreshToken
Hashed rotating refresh tokens for JWT authentication.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → `User.id` ON DELETE CASCADE)
- `tokenHash` (String, Unique)
- `device` (String, Nullable)
- `expiresAt` (Timestamp)
- `isRevoked` (Boolean, default `false`)
- `createdAt`, `updatedAt` (Timestamp)

### 2.10 AuditLog
Administrative action audit trail.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → `User.id`)
- `action` (String)
- `targetType` (String)
- `targetId` (String)
- `details` (String, JSON)
- `ipAddress` (String, Nullable)
- `createdAt` (Timestamp)
