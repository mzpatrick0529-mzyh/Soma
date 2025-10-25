/**
 * Phase 3.8: Context-Aware API Routes
 * 上下文感知对话API端点
 */

import express, { type Request, type Response } from 'express';
import { getDatabase } from '../db/index.js';
import { ContextAwareInferenceEngine } from '../services/contextAwareInferenceEngine.js';

const router = express.Router();
const db = getDatabase();
const inferenceEngine = new ContextAwareInferenceEngine(db);

/**
 * POST /context-aware/chat
 * 上下文感知对话生成
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const {
      userId = 'default',
      conversationId,
      message,
      targetPerson,
      metadata,
    } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: conversationId, message',
      });
    }

    const response = await inferenceEngine.infer({
      userId,
      conversationId,
      userMessage: message,
      targetPerson,
      metadata,
    });

    res.json({
      success: true,
      data: {
        response: response.response,
        confidence: response.confidence,
        styleConsistency: response.styleConsistency,
        factConsistency: response.factConsistency,
        context: response.context,
        persona: response.persona,
        memory: response.memory,
      },
    });
  } catch (error: any) {
    console.error('Context-aware chat error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message,
    });
  }
});

/**
 * GET /context-aware/context
 * 获取当前对话上下文
 */
router.get('/context/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId = 'default' } = req.query;

    const { ContextDetector } = await import('../services/contextDetector.js');
    const { ConversationMemory } = await import('../services/conversationMemory.js');
    
    const contextDetector = new ContextDetector(db);
    const memory = new ConversationMemory(db);

    const memorySnapshot = await memory.getMemorySnapshot(
      userId as string,
      conversationId
    );

    // 从最近的消息提取上下文
    const recentMessage = memorySnapshot.shortTerm[memorySnapshot.shortTerm.length - 1];
    const context = recentMessage?.contextSnapshot || null;

    res.json({
      success: true,
      data: {
        context,
        memory: memorySnapshot,
      },
    });
  } catch (error: any) {
    console.error('Get context error:', error);
    res.status(500).json({
      error: 'Failed to get context',
      details: error.message,
    });
  }
});

/**
 * GET /context-aware/memory/:conversationId
 * 获取对话记忆快照
 */
router.get('/memory/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId = 'default', targetPerson } = req.query;

    const { ConversationMemory } = await import('../services/conversationMemory.js');
    const memory = new ConversationMemory(db);

    const snapshot = await memory.getMemorySnapshot(
      userId as string,
      conversationId,
      targetPerson as string | undefined
    );

    res.json({
      success: true,
      data: snapshot,
    });
  } catch (error: any) {
    console.error('Get memory error:', error);
    res.status(500).json({
      error: 'Failed to get memory',
      details: error.message,
    });
  }
});

/**
 * POST /context-aware/style-check
 * 检查文本风格一致性
 */
router.post('/style-check', async (req: Request, res: Response) => {
  try {
    const { text, targetStyle } = req.body;

    if (!text || !targetStyle) {
      return res.status(400).json({
        error: 'Missing required fields: text, targetStyle',
      });
    }

    const { StyleCalibrator } = await import('../services/styleCalibrator.js');
    const calibrator = new StyleCalibrator();

    const result = calibrator.calibrateStyle(text, targetStyle);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Style check error:', error);
    res.status(500).json({
      error: 'Failed to check style',
      details: error.message,
    });
  }
});

/**
 * POST /context-aware/fact-check
 * 检查事实一致性
 */
router.post('/fact-check', async (req: Request, res: Response) => {
  try {
    const { userId = 'default', text, context } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text',
      });
    }

    const { FactChecker } = await import('../services/factChecker.js');
    const checker = new FactChecker(db);

    const result = await checker.checkFactConsistency(userId, text, context);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Fact check error:', error);
    res.status(500).json({
      error: 'Failed to check facts',
      details: error.message,
    });
  }
});

/**
 * DELETE /context-aware/memory/:conversationId
 * 清理对话记忆
 */
router.delete('/memory/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId = 'default', olderThanDays } = req.query;

    const { ConversationMemory } = await import('../services/conversationMemory.js');
    const memory = new ConversationMemory(db);

    const daysToKeep = olderThanDays ? parseInt(olderThanDays as string) : 90;
    const deletedCount = await memory.cleanOldConversations(userId as string, daysToKeep);

    res.json({
      success: true,
      data: {
        deletedCount,
        daysKept: daysToKeep,
      },
    });
  } catch (error: any) {
    console.error('Clean memory error:', error);
    res.status(500).json({
      error: 'Failed to clean memory',
      details: error.message,
    });
  }
});

/**
 * GET /context-aware/stats
 * 获取上下文感知系统统计信息
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId = 'default' } = req.query;

    // 统计对话数量
    const conversationCount = db
      .prepare(
        `
      SELECT COUNT(DISTINCT conversation_id) as count 
      FROM conversation_memory 
      WHERE user_id = ?
    `
      )
      .get(userId)  as { count: number };

    // 统计总轮次
    const turnCount = db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM conversation_memory 
      WHERE user_id = ?
    `
      )
      .get(userId) as { count: number };

    // 统计关系数量
    const relationshipCount = db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM relationship_profiles 
      WHERE user_id = ?
    `
      )
      .get(userId) as { count: number };

    res.json({
      success: true,
      data: {
        userId,
        totalConversations: conversationCount.count,
        totalTurns: turnCount.count,
        totalRelationships: relationshipCount.count,
        averageTurnsPerConversation:
          conversationCount.count > 0
            ? (turnCount.count / conversationCount.count).toFixed(2)
            : 0,
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      details: error.message,
    });
  }
});

export default router;
