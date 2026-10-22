-- Injibara University Campus Lost & Found Schema Initialization
-- Compatible with PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SECURITY_OFFICER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ItemType" AS ENUM ('LOST', 'FOUND');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ItemStatus" AS ENUM ('OPEN', 'CLAIM_PENDING', 'APPROVED', 'RETURNED', 'CLOSED', 'REJECTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HANDOVER_SCHEDULED', 'RETURNED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StorageArrangement" AS ENUM ('WITH_FINDER', 'SECURITY_OFFICE', 'STUDENT_SERVICES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'HANDOVER_SCHEDULED', 'ITEM_RETURNED', 'MATCH_FOUND', 'ITEM_MODERATED', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) UNIQUE,
    "universityId" VARCHAR(50) UNIQUE,
    "phone" VARCHAR(20) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" DEFAULT 'USER' NOT NULL,
    "department" VARCHAR(100),
    "avatarUrl" TEXT,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "pushToken" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Category" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50) DEFAULT 'cube-outline' NOT NULL,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Location" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Item" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "reporterId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "type" "ItemType" NOT NULL,
    "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
    "locationId" UUID NOT NULL REFERENCES "Location"("id") ON DELETE RESTRICT,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "color" VARCHAR(50),
    "brand" VARCHAR(50),
    "hiddenDetail" TEXT,
    "dateEvent" TIMESTAMP WITH TIME ZONE NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactPreference" VARCHAR(20) DEFAULT 'IN_APP' NOT NULL,
    "keptAt" "StorageArrangement" DEFAULT 'WITH_FINDER' NOT NULL,
    "status" "ItemStatus" DEFAULT 'OPEN' NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "idx_item_search" ON "Item"("status", "type", "categoryId", "createdAt");

CREATE TABLE IF NOT EXISTS "ItemImage" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "itemId" UUID NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Claim" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "itemId" UUID NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
    "claimantId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "proofDescription" TEXT NOT NULL,
    "verificationAnswers" TEXT,
    "proofImageUrl" TEXT,
    "lostDate" TIMESTAMP WITH TIME ZONE,
    "lostLocation" VARCHAR(200),
    "status" "ClaimStatus" DEFAULT 'PENDING' NOT NULL,
    "reviewNote" TEXT,
    "reviewedBy" VARCHAR(100),
    "handoverLocation" VARCHAR(200),
    "handoverAt" TIMESTAMP WITH TIME ZONE,
    "returnedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "StatusHistory" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "itemId" UUID NOT NULL REFERENCES "Item"("id") ON DELETE CASCADE,
    "claimId" UUID REFERENCES "Claim"("id") ON DELETE SET NULL,
    "oldStatus" VARCHAR(50) NOT NULL,
    "newStatus" VARCHAR(50) NOT NULL,
    "changedBy" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "reason" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "type" "NotificationType" DEFAULT 'SYSTEM' NOT NULL,
    "relatedItemId" VARCHAR(100),
    "relatedClaimId" VARCHAR(100),
    "isRead" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "tokenHash" VARCHAR(64) UNIQUE NOT NULL,
    "device" VARCHAR(100),
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isRevoked" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "action" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(50) NOT NULL,
    "targetId" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "ipAddress" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
