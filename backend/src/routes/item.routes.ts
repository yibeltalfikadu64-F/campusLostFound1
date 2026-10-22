import { Router } from 'express';
import { itemController } from '../controllers/item.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { createItemSchema, updateItemSchema, updateItemStatusSchema, queryItemsSchema, createClaimSchema } from '../schemas';
import { uploadImages } from '../middleware/upload';

const router = Router();

// Upload item images (Max 3)
router.post('/upload', requireAuth, uploadImages.array('images', 3), (req, res, next) => {
  itemController.uploadImages(req, res, next);
});

// List and search items
router.get('/', validateQuery(queryItemsSchema), (req, res, next) => itemController.listItems(req, res, next));

// Report new lost/found item
router.post('/', requireAuth, validateBody(createItemSchema), (req, res, next) => itemController.createItem(req, res, next));

// Item details (authenticated so we can check if caller is owner/admin for hidden details)
router.get('/:id', (req, res, next) => {
  // Try optional authentication header if present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return requireAuth(req, res, () => itemController.getItemById(req, res, next));
  }
  return itemController.getItemById(req, res, next);
});

// Update item
router.patch('/:id', requireAuth, validateBody(updateItemSchema), (req, res, next) => itemController.updateItem(req, res, next));

// Delete item
router.delete('/:id', requireAuth, (req, res, next) => itemController.deleteItem(req, res, next));

// Update item status
router.patch('/:id/status', requireAuth, validateBody(updateItemStatusSchema), (req, res, next) => itemController.updateStatus(req, res, next));

// Item status history
router.get('/:id/history', (req, res, next) => itemController.getItemHistory(req, res, next));

// Submit a claim on an item
router.post('/:id/claims', requireAuth, validateBody(createClaimSchema), (req, res, next) => itemController.submitItemClaim(req, res, next));

// Get claims on this item (reporter or security only)
router.get('/:id/claims', requireAuth, (req, res, next) => itemController.getItemClaims(req, res, next));

export default router;
