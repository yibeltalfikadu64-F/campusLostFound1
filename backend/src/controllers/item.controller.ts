import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { itemService } from '../services/item.service';
import { claimService } from '../services/claim.service';
import { sendSuccess } from '../utils/response';

export class ItemController {
  async createItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await itemService.createItem(req.user!.id, req.body);
      return sendSuccess(res, item, 'Item reported successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async listItems(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.listItems(req.query as any);
      return sendSuccess(res, result.items, 'Items retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getItemById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const item = await itemService.getItemById(req.params.id, req.user);
      return sendSuccess(res, item, 'Item details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const updated = await itemService.updateItem(req.params.id, req.user!, req.body);
      return sendSuccess(res, updated, 'Item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await itemService.deleteItem(req.params.id, req.user!);
      return sendSuccess(res, result, 'Item deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const updated = await itemService.updateItemStatus(req.params.id, req.user!, status, reason);
      return sendSuccess(res, updated, 'Item status updated');
    } catch (error) {
      next(error);
    }
  }

  async getItemHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await itemService.getItemHistory(req.params.id);
      return sendSuccess(res, history, 'Item status history retrieved');
    } catch (error) {
      next(error);
    }
  }

  async submitItemClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const claim = await claimService.submitClaim(req.user!.id, req.params.id, req.body);
      return sendSuccess(res, claim, 'Claim submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getItemClaims(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const claims = await itemService.getItemClaims(req.params.id, req.user!);
      return sendSuccess(res, claims, 'Item claims retrieved');
    } catch (error) {
      next(error);
    }
  }

  async uploadImages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const urls = files.map((file) => {
        const relativePath = `/uploads/${file.filename}`;
        return relativePath;
      });
      return sendSuccess(res, { imageUrls: urls }, 'Images uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const itemController = new ItemController();
