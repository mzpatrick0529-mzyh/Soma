/**
 * 人格系统 API 路由
 */

import { Router, Request, Response } from 'express';
import { PersonalityInferenceEngine } from '../services/personalityInferenceEngine';
import { 
  GetPersonalityRequest,
  GenerateResponseRequest,
  SubmitFeedbackRequest,
  TriggerTrainingRequest,
  ExtractFeaturesRequest
} from '../types/personality';

export function createPersonalityRoutes(db: any, geminiApiKey: string): Router {
  const router = Router();
  const inferenceEngine = new PersonalityInferenceEngine(db, geminiApiKey);

  /**
   * GET /api/personality/:userId
   * 获取用户人格向量
   */
  router.get('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const personality = await (inferenceEngine as any).loadPersonalityVector(userId);
      
      if (!personality) {
        return res.status(404).json({
          success: false,
          error: 'Personality vector not found',
          message: '该用户尚未提取人格特征，请先运行特征提取'
        });
      }

      // 转换Map为Object用于JSON序列化
      const response = {
        success: true,
        personality: {
          ...personality,
          values: {
            ...personality.values,
            priorities: Object.fromEntries(personality.values.priorities)
          },
          social: {
            ...personality.social,
            relationshipMap: Object.fromEntries(personality.social.relationshipMap),
            topicPreferences: Object.fromEntries(personality.social.topicPreferences)
          }
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Get personality error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/personality/generate
   * 生成个性化回复
   */
  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const requestData: GenerateResponseRequest = req.body;
      
      if (!requestData.userId || !requestData.message || !requestData.sender) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, message, sender'
        });
      }

      const context = {
        message: requestData.message,
        sender: requestData.sender,
        conversationHistory: requestData.conversationHistory || [],
        currentTime: new Date()
      };

      const result = await inferenceEngine.generatePersonalizedResponse(
        requestData.userId,
        context
      );

      res.json({
        success: true,
        response: result.response,
        metadata: {
          confidence: result.confidence,
          inferenceTime: result.metadata.inferenceTimeMs,
          strategy: result.metadata.strategyUsed,
          reasoning: result.reasoning
        }
      });
    } catch (error: any) {
      console.error('Generate response error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/personality/feedback
   * 提交用户反馈（用于RLHF）
   */
  router.post('/feedback', async (req: Request, res: Response) => {
    try {
      const feedback: SubmitFeedbackRequest = req.body;
      
      if (!feedback.userId || !feedback.agentResponse || !feedback.rating) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, agentResponse, rating'
        });
      }

      // Save反馈到数据库
      const stmt = db.prepare(`
        INSERT INTO personality_feedback (
          user_id, conversation_id, agent_response,
          rating, feedback_type, feedback_text, suggested_response,
          context_snapshot, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const contextSnapshot = JSON.stringify({
        feedbackType: feedback.feedbackType,
        timestamp: new Date().toISOString()
      });

      stmt.run(
        feedback.userId,
        feedback.conversationId || null,
        feedback.agentResponse,
        feedback.rating,
        feedback.feedbackType,
        feedback.feedbackText || null,
        feedback.suggestedResponse || null,
        contextSnapshot
      );

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        nextAction: feedback.rating < 3 
          ? 'Your feedback will help improve the personality model'
          : 'Thank you for the positive feedback!'
      });
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/personality/:userId/relationships
   * 获取用户的关系图谱
   */
  router.get('/:userId/relationships', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const relationships = db.prepare(`
        SELECT 
          person_identifier,
          person_name,
          relationship_type,
          intimacy_level,
          interaction_frequency,
          emotional_tone,
          total_interactions,
          last_interaction_at
        FROM user_relationships
        WHERE user_id = ?
        ORDER BY intimacy_level DESC, total_interactions DESC
        LIMIT 50
      `).all(userId);

      res.json({
        success: true,
        relationships: relationships,
        totalCount: relationships.length
      });
    } catch (error: any) {
      console.error('Get relationships error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/personality/:userId/values
   * 获取用户价值观系统
   */
  router.get('/:userId/values', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const values = db.prepare(`
        SELECT 
          priority_key,
          priority_value,
          confidence_score,
          evidence_count
        FROM user_value_systems
        WHERE user_id = ?
        ORDER BY priority_value DESC
      `).all(userId);

      res.json({
        success: true,
        values: values,
        topPriorities: values.slice(0, 5).map((v: any) => v.priority_key)
      });
    } catch (error: any) {
      console.error('Get values error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/personality/extract
   * 触发特征提取任务
   */
  router.post('/extract', async (req: Request, res: Response) => {
    try {
      const extractRequest: ExtractFeaturesRequest = req.body;
      
      if (!extractRequest.userId || !extractRequest.jobType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, jobType'
        });
      }

      // 创建提取任务
      const stmt = db.prepare(`
        INSERT INTO personality_extraction_jobs (
          user_id, job_type, status, input_data_range, created_at
        ) VALUES (?, ?, 'pending', ?, datetime('now'))
      `);

      const result = stmt.run(
        extractRequest.userId,
        extractRequest.jobType,
        JSON.stringify(extractRequest.dataRange || {})
      );

      const jobId = result.lastInsertRowid;

      res.json({
        success: true,
        jobId: jobId.toString(),
        status: 'pending',
        message: 'Feature extraction job created. Run the Python script to process.',
        command: `python src/ml/run_extraction.py --job-id ${jobId}`
      });
    } catch (error: any) {
      console.error('Extract features error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/personality/jobs/:jobId
   * 查询提取任务状态
   */
  router.get('/jobs/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      const job = db.prepare(`
        SELECT * FROM personality_extraction_jobs WHERE id = ?
      `).get(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        job: {
          id: job.id,
          userId: job.user_id,
          jobType: job.job_type,
          status: job.status,
          createdAt: job.created_at,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          errorMessage: job.error_message,
          outputFeatures: job.output_features ? JSON.parse(job.output_features) : null
        }
      });
    } catch (error: any) {
      console.error('Get job status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/personality/:userId/stats
   * 获取人格统计信息
   */
  router.get('/:userId/stats', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // 获取统计数据
      const personalityStats = db.prepare(`
        SELECT 
          version,
          training_samples_count,
          last_trained_at,
          created_at,
          updated_at
        FROM user_personality_vectors
        WHERE user_id = ?
      `).get(userId);

      const relationshipCount = db.prepare(`
        SELECT COUNT(*) as count FROM user_relationships WHERE user_id = ?
      `).get(userId);

      const feedbackStats = db.prepare(`
        SELECT 
          COUNT(*) as total_feedback,
          AVG(rating) as avg_rating,
          SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_count,
          SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negative_count
        FROM personality_feedback
        WHERE user_id = ?
      `).get(userId);

      res.json({
        success: true,
        stats: {
          personality: personalityStats,
          relationships: relationshipCount?.count || 0,
          feedback: feedbackStats || {
            total_feedback: 0,
            avg_rating: 0,
            positive_count: 0,
            negative_count: 0
          }
        }
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/personality/:userId
   * 删除用户人格数据（隐私保护）
   */
  router.delete('/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { confirm } = req.body;

      if (confirm !== 'DELETE_ALL_PERSONALITY_DATA') {
        return res.status(400).json({
          success: false,
          error: 'Confirmation required. Set confirm="DELETE_ALL_PERSONALITY_DATA"'
        });
      }

      // 删除所有人格相关数据
      db.prepare('DELETE FROM user_personality_vectors WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_value_systems WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_relationships WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM personality_training_samples WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM personality_feedback WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM personality_extraction_jobs WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM personality_embeddings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM personality_model_versions WHERE user_id = ?').run(userId);

      res.json({
        success: true,
        message: 'All personality data deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete personality error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
