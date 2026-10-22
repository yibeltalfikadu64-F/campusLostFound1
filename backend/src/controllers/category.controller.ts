import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess } from '../utils/response';

export class CategoryController {
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoryService.listCategories(includeInactive);
      return sendSuccess(res, categories, 'Categories retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.createCategory(req.body);
      return sendSuccess(res, category, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await categoryService.updateCategory(req.params.id, req.body);
      return sendSuccess(res, updated, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      return sendSuccess(res, result, 'Category deleted or deactivated');
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
