/**
 * 🤖 User-Specific Model Training API Routes
 * API route - user-specific model training
 */

import { Router, Request, Response } from 'express';
import {
  trainUserSpecificModel,
  getUserModelInfo,
  shouldRetrainUserModel,
  deleteUserModel,
  getAllUserModelsStats,
} from '../services/userModelTraining';

export function createUserModelRoutes(): Router {
  const router = Router();

  /**
   * POST /api/user-model/train
   * Train user-specific model
   */
  router.post('/train', async (req: Request, res: Response) => {
    try {
      const { userId, forceRetrain = false } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log(`[API] Training user model for ${userId}, forceRetrain: ${forceRetrain}`);

      const result = await trainUserSpecificModel(userId, forceRetrain);

      if (!result.success) {
        return res.status(500).json({
          error: result.message,
          metadata: result.metadata,
        });
      }

      res.json({
        success: true,
        message: result.message,
        modelId: result.modelId,
        metadata: result.metadata,
      });
    } catch (error: any) {
      console.error('[API] Training error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/user-model/info/:userId
   * Get user model information
   */
  router.get('/info/:userId', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const modelInfo = getUserModelInfo(userId);

      if (!modelInfo) {
        return res.status(404).json({
          error: 'User model not found',
          suggestion: 'Please train a model first by calling POST /api/user-model/train',
        });
      }

      res.json({
        success: true,
        model: modelInfo,
      });
    } catch (error: any) {
      console.error('[API] Get model info error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/user-model/should-retrain/:userId
   * Check if retraining is needed
   */
  router.get('/should-retrain/:userId', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const shouldRetrain = shouldRetrainUserModel(userId);

      res.json({
        success: true,
        shouldRetrain,
        message: shouldRetrain
          ? 'Model retraining recommended due to new data'
          : 'Model is up to date',
      });
    } catch (error: any) {
      console.error('[API] Should retrain check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/user-model/:userId
   * Delete user model (GDPR compliant)
   */
  router.delete('/:userId', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const deleted = deleteUserModel(userId);

      if (!deleted) {
        return res.status(404).json({
          error: 'User model not found',
        });
      }

      res.json({
        success: true,
        message: 'User model deleted successfully',
      });
    } catch (error: any) {
      console.error('[API] Delete model error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/user-model/stats/all
   * Get all user model statistics (admin function)
   */
  router.get('/stats/all', (req: Request, res: Response) => {
    try {
      const stats = getAllUserModelsStats();

      res.json({
        success: true,
        totalModels: stats.length,
        models: stats,
      });
    } catch (error: any) {
      console.error('[API] Get all stats error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
