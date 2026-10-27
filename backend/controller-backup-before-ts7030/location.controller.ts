import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/location.service';
import { sendSuccess } from '../utils/response';

export class LocationController {
  async listLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const locations = await locationService.listLocations(includeInactive);
      return sendSuccess(res, locations, 'Locations retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationService.createLocation(req.body);
      return sendSuccess(res, location, 'Location created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await locationService.updateLocation(req.params.id, req.body);
      return sendSuccess(res, updated, 'Location updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await locationService.deleteLocation(req.params.id);
      return sendSuccess(res, result, 'Location deleted or deactivated');
    } catch (error) {
      next(error);
    }
  }
}

export const locationController = new LocationController();
