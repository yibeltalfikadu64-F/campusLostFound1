import { ClaimStatus, ItemStatus, Role, NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../errors/AppError';
import { notificationService } from './notification.service';
import { AuthUser } from '../types';

export class ClaimService {
  async submitClaim(
    claimantId: string,
    itemId: string,
    data: {
      proofDescription: string;
      verificationAnswers?: string;
      proofImageUrl?: string;
      lostDate?: string;
      lostLocation?: string;
    }
  ) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { reporter: true }
    });

    if (!item || item.deletedAt) {
      throw new NotFoundError('Item not found');
    }

    if (item.reporterId === claimantId) {
      throw new BadRequestError('You cannot submit a claim against an item you reported yourself');
    }

    if (item.status === ItemStatus.RETURNED || item.status === ItemStatus.CLOSED) {
      throw new BadRequestError('This item has already been returned or closed');
    }

    // Check if claimant already has a pending or approved claim on this item
    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId,
        claimantId,
        status: { in: [ClaimStatus.PENDING, ClaimStatus.APPROVED, ClaimStatus.HANDOVER_SCHEDULED] }
      }
    });

    if (existingClaim) {
      throw new ConflictError('You already have an active claim under review for this item');
    }

    const claim = await prisma.$transaction(async (tx) => {
      const newClaim = await tx.claim.create({
        data: {
          itemId,
          claimantId,
          proofDescription: data.proofDescription.trim(),
          verificationAnswers: data.verificationAnswers?.trim() || null,
          proofImageUrl: data.proofImageUrl || null,
          lostDate: data.lostDate ? new Date(data.lostDate) : null,
          lostLocation: data.lostLocation?.trim() || null,
          status: ClaimStatus.PENDING
        },
        include: {
          item: {
            select: { id: true, title: true, type: true }
          },
          claimant: {
            select: { id: true, fullName: true, phone: true }
          }
        }
      });

      // Update item status to CLAIM_PENDING if it was OPEN
      if (item.status === ItemStatus.OPEN) {
        await tx.item.update({
          where: { id: itemId },
          data: { status: ItemStatus.CLAIM_PENDING }
        });

        await tx.statusHistory.create({
          data: {
            itemId,
            claimId: newClaim.id,
            oldStatus: ItemStatus.OPEN,
            newStatus: ItemStatus.CLAIM_PENDING,
            changedBy: claimantId,
            reason: 'Claim submitted by student / claimant'
          }
        });
      }

      return newClaim;
    });

    // Notify item reporter that a claim was submitted
    await notificationService.createNotification({
      userId: item.reporterId,
      title: 'New Ownership Claim Submitted',
      body: `A claim was submitted for your report "${item.title}". Campus security is reviewing the evidence.`,
      type: NotificationType.CLAIM_SUBMITTED,
      relatedItemId: item.id,
      relatedClaimId: claim.id
    });

    return claim;
  }

  async getClaimById(claimId: string, user: AuthUser) {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        item: {
          include: {
            category: true,
            location: true,
            images: true,
            reporter: {
              select: { id: true, fullName: true, phone: true, department: true }
            }
          }
        },
        claimant: {
          select: { id: true, fullName: true, email: true, phone: true, department: true, universityId: true }
        },
        statusHistories: true
      }
    });

    if (!claim) {
      throw new NotFoundError('Claim not found');
    }

    const isClaimant = claim.claimantId === user.id;
    const isReporter = claim.item.reporterId === user.id;
    const isStaff = user.role === Role.ADMIN || user.role === Role.SECURITY_OFFICER;

    if (!isClaimant && !isReporter && !isStaff) {
      throw new ForbiddenError('You do not have permission to view this claim');
    }

    return claim;
  }

  async getMyClaims(claimantId: string) {
    return prisma.claim.findMany({
      where: { claimantId },
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

  async approveClaim(claimId: string, reviewer: AuthUser, reviewNote?: string) {
    // Only Security Officer or Admin can approve claims
    if (reviewer.role !== Role.ADMIN && reviewer.role !== Role.SECURITY_OFFICER) {
      throw new ForbiddenError('Only security officers and administrators can approve ownership claims');
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true }
    });

    if (!claim) {
      throw new NotFoundError('Claim not found');
    }

    if (claim.claimantId === reviewer.id) {
      throw new ForbiddenError('A reviewer cannot approve their own claim');
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestError(`Cannot approve claim in '${claim.status}' state`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Approve this claim
      const approvedClaim = await tx.claim.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.APPROVED,
          reviewedBy: reviewer.fullName,
          reviewNote: reviewNote || 'Ownership evidence verified by campus security.'
        }
      });

      // 2. Update item status to APPROVED
      await tx.item.update({
        where: { id: claim.itemId },
        data: { status: ItemStatus.APPROVED }
      });

      // 3. Reject/cancel any other pending claims on this item
      await tx.claim.updateMany({
        where: {
          itemId: claim.itemId,
          id: { not: claimId },
          status: ClaimStatus.PENDING
        },
        data: {
          status: ClaimStatus.REJECTED,
          reviewedBy: reviewer.fullName,
          reviewNote: 'Another claim with verified ownership was approved for this item.'
        }
      });

      // 4. Record status history
      await tx.statusHistory.create({
        data: {
          itemId: claim.itemId,
          claimId: claim.id,
          oldStatus: claim.item.status,
          newStatus: ItemStatus.APPROVED,
          changedBy: reviewer.id,
          reason: `Claim approved by ${reviewer.fullName}`
        }
      });

      return approvedClaim;
    });

    // Notify claimant
    await notificationService.createNotification({
      userId: claim.claimantId,
      title: 'Claim Approved!',
      body: `Your claim for "${claim.item.title}" has been approved! Handover will be arranged soon.`,
      type: NotificationType.CLAIM_APPROVED,
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id
    });

    // Notify reporter / finder
    await notificationService.createNotification({
      userId: claim.item.reporterId,
      title: 'Claim Approved for Your Reported Item',
      body: `Campus security verified ownership for "${claim.item.title}". Handover is being scheduled.`,
      type: NotificationType.CLAIM_APPROVED,
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id
    });

    return result;
  }

  async rejectClaim(claimId: string, reviewer: AuthUser, reason: string) {
    if (reviewer.role !== Role.ADMIN && reviewer.role !== Role.SECURITY_OFFICER) {
      throw new ForbiddenError('Only security officers and administrators can reject ownership claims');
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true }
    });

    if (!claim) {
      throw new NotFoundError('Claim not found');
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestError(`Cannot reject claim in '${claim.status}' state`);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update claim status
      const rejectedClaim = await tx.claim.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.REJECTED,
          reviewedBy: reviewer.fullName,
          reviewNote: reason || 'Evidence provided was insufficient to prove ownership.'
        }
      });

      // 2. Check if there are other pending claims for this item
      const remainingPending = await tx.claim.count({
        where: {
          itemId: claim.itemId,
          id: { not: claimId },
          status: ClaimStatus.PENDING
        }
      });

      // If no other pending claims, revert item status back to OPEN
      if (remainingPending === 0) {
        await tx.item.update({
          where: { id: claim.itemId },
          data: { status: ItemStatus.OPEN }
        });

        await tx.statusHistory.create({
          data: {
            itemId: claim.itemId,
            claimId: claim.id,
            oldStatus: ItemStatus.CLAIM_PENDING,
            newStatus: ItemStatus.OPEN,
            changedBy: reviewer.id,
            reason: `Claim rejected. Item returned to OPEN status.`
          }
        });
      }

      return rejectedClaim;
    });

    // Notify claimant
    await notificationService.createNotification({
      userId: claim.claimantId,
      title: 'Claim Update: Insufficient Evidence',
      body: `Your claim for "${claim.item.title}" was not approved: ${reason || 'Details did not match'}.`,
      type: NotificationType.CLAIM_REJECTED,
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id
    });

    return result;
  }

  async scheduleHandover(claimId: string, user: AuthUser, data: { handoverLocation: string; handoverAt: string; note?: string }) {
    if (user.role !== Role.ADMIN && user.role !== Role.SECURITY_OFFICER) {
      throw new ForbiddenError('Only campus security administrators can schedule official handovers');
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true }
    });

    if (!claim) {
      throw new NotFoundError('Claim not found');
    }

    if (claim.status !== ClaimStatus.APPROVED && claim.status !== ClaimStatus.HANDOVER_SCHEDULED) {
      throw new BadRequestError('Handover can only be scheduled for approved claims');
    }

    const handoverAt = new Date(data.handoverAt);

    const updated = await prisma.$transaction(async (tx) => {
      const claimUpdate = await tx.claim.update({
        where: { id: claimId },
        data: {
          handoverLocation: data.handoverLocation.trim(),
          handoverAt,
          status: ClaimStatus.HANDOVER_SCHEDULED,
          reviewNote: data.note ? `${claim.reviewNote || ''} [Handover note: ${data.note.trim()}]` : claim.reviewNote
        }
      });

      await tx.statusHistory.create({
        data: {
          itemId: claim.itemId,
          claimId: claim.id,
          oldStatus: claim.status,
          newStatus: ClaimStatus.HANDOVER_SCHEDULED,
          changedBy: user.id,
          reason: `Handover scheduled at ${data.handoverLocation} on ${handoverAt.toLocaleString()}`
        }
      });

      return claimUpdate;
    });

    // Notify claimant
    await notificationService.createNotification({
      userId: claim.claimantId,
      title: 'Handover Appointment Scheduled',
      body: `Please collect your item "${claim.item.title}" at ${data.handoverLocation} on ${handoverAt.toLocaleString()}. Bring your Student ID!`,
      type: NotificationType.HANDOVER_SCHEDULED,
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id
    });

    return updated;
  }

  async confirmReturn(claimId: string, user: AuthUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.SECURITY_OFFICER) {
      throw new ForbiddenError('Only security officers and administrators can confirm final item return');
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true }
    });

    if (!claim) {
      throw new NotFoundError('Claim not found');
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark claim as RETURNED
      const updatedClaim = await tx.claim.update({
        where: { id: claimId },
        data: {
          status: ClaimStatus.RETURNED,
          returnedAt: now
        }
      });

      // 2. Mark item as RETURNED
      await tx.item.update({
        where: { id: claim.itemId },
        data: {
          status: ItemStatus.RETURNED
        }
      });

      // 3. Record status history
      await tx.statusHistory.create({
        data: {
          itemId: claim.itemId,
          claimId: claim.id,
          oldStatus: claim.item.status,
          newStatus: ItemStatus.RETURNED,
          changedBy: user.id,
          reason: `Handover completed and verified returned by ${user.fullName}`
        }
      });

      return updatedClaim;
    });

    // Notify both claimant and finder
    await notificationService.createNotification({
      userId: claim.claimantId,
      title: 'Item Return Complete',
      body: `Your item "${claim.item.title}" has been successfully handed over to you. Thank you!`,
      type: NotificationType.ITEM_RETURNED,
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id
    });

    await notificationService.createNotification({
      userId: claim.item.reporterId,
      title: 'Item Successfully Returned to Owner',
      body: `The item "${claim.item.title}" you reported has been securely returned to its verified owner.`,
      type: NotificationType.ITEM_RETURNED,
      relatedItemId: claim.itemId,
      relatedClaimId: claim.id
    });

    return result;
  }
}

export const claimService = new ClaimService();
