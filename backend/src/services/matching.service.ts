import { ItemType, ItemStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

export class MatchingService {
  /**
   * Scans for potential matching items across LOST and FOUND reports.
   * If an item is LOST, checks for recently reported FOUND items with matching category & keywords.
   * If an item is FOUND, checks for active LOST items with matching category & keywords.
   */
  async findMatchesForNewItem(newItemId: string) {
    try {
      const item = await prisma.item.findUnique({
        where: { id: newItemId },
        include: { reporter: true, category: true, location: true }
      });

      if (!item || item.status !== ItemStatus.OPEN) return;

      const targetType = item.type === ItemType.LOST ? ItemType.FOUND : ItemType.LOST;

      // Extract significant keywords (longer than 3 chars)
      const keywords = `${item.title} ${item.brand || ''} ${item.color || ''}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      if (keywords.length === 0) return;

      // Look for candidate items in the same category
      const candidates = await prisma.item.findMany({
        where: {
          type: targetType,
          categoryId: item.categoryId,
          status: ItemStatus.OPEN,
          id: { not: item.id },
          deletedAt: null
        },
        include: { reporter: true }
      });

      for (const candidate of candidates) {
        const candidateText = `${candidate.title} ${candidate.description} ${candidate.brand || ''} ${candidate.color || ''}`.toLowerCase();
        const matchCount = keywords.filter((k) => candidateText.includes(k)).length;

        // If at least one keyword matches
        if (matchCount >= 1) {
          logger.info(`[Match Found] Item #${item.id} (${item.type}) matches #${candidate.id} (${candidate.type})`);

          // Notify the new item's reporter
          await notificationService.createNotification({
            userId: item.reporterId,
            title: 'Potential Match Found on Campus!',
            body: `A ${candidate.type.toLowerCase()} item "${candidate.title}" might match your report "${item.title}". Check item details!`,
            type: NotificationType.MATCH_FOUND,
            relatedItemId: candidate.id
          });

          // Notify the candidate's reporter
          await notificationService.createNotification({
            userId: candidate.reporterId,
            title: 'Potential Match Found on Campus!',
            body: `A newly reported ${item.type.toLowerCase()} item "${item.title}" might match your report "${candidate.title}".`,
            type: NotificationType.MATCH_FOUND,
            relatedItemId: item.id
          });
        }
      }
    } catch (error) {
      logger.error('Error during item matching:', error);
    }
  }
}

export const matchingService = new MatchingService();
