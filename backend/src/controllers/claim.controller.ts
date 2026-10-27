import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { claimService } from '../services/claim.service';
import { sendSuccess } from '../utils/response';

export class ClaimController {
  async getMyClaims(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const claims = await claimService.getMyClaims(req.user!.id);
      return sendSuccess(res, claims, 'User claims retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async getClaimById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const claim = await claimService.getClaimById(req.params.id, req.user!);
      return sendSuccess(res, claim, 'Claim details retrieved');
    } catch (error) {
      return next(error);
    }
  }

  async approveClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reviewNote } = req.body;
      const result = await claimService.approveClaim(req.params.id, req.user!, reviewNote);
      return sendSuccess(res, result, 'Claim approved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async rejectClaim(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { reviewNote } = req.body;
      const result = await claimService.rejectClaim(req.params.id, req.user!, reviewNote);
      return sendSuccess(res, result, 'Claim rejected');
    } catch (error) {
      return next(error);
    }
  }

  async scheduleHandover(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await claimService.scheduleHandover(req.params.id, req.user!, req.body);
      return sendSuccess(res, result, 'Handover scheduled successfully');
    } catch (error) {
      return next(error);
    }
  }

  async confirmReturn(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await claimService.confirmReturn(req.params.id, req.user!);
      return sendSuccess(res, result, 'Item confirmed returned and case closed');
    } catch (error) {
      return next(error);
    }
  }
}

export const claimController = new ClaimController();

