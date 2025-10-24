/**
 * Memory V2.0 API Routes
 * RESTful API for AI-Native Memory Architecture
 * 
 * @version 2.0.0
 */

import { Router } from 'express';
import { memoryV2Service } from '../services/memoryV2Service.js';

const router = Router();

// ============================================
// L0: 原始记忆 API
// ============================================

/**
 * POST /api/memory/v2/:userId/l0/store
 * 存储新的原始记忆
 */
router.post('/:userId/l0/store', async (req, res) => {
  try {
    const { userId } = req.params;
    const { content, source, conversationId, metadata } = req.body;

    if (!content || !source) {
      return res.status(400).json({
        error: 'Missing required fields: content, source'
      });
    }

    const memoryId = await memoryV2Service.storeMemory(
      userId,
      content,
      source,
      conversationId,
      metadata
    );

    res.json({
      success: true,
      memoryId,
      message: 'Memory stored successfully'
    });
  } catch (error: any) {
    console.error('Store memory error:', error);
    res.status(500).json({
      error: 'Failed to store memory',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/v2/:userId/l0/retrieve
 * 检索原始记忆
 */
router.get('/:userId/l0/retrieve', async (req, res) => {
  try {
    const { userId } = req.params;
    const { query, limit = '20' } = req.query;

    const memories = await memoryV2Service.retrieveL0Memories(
      userId,
      query as string || '',
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      count: memories.length,
      memories
    });
  } catch (error: any) {
    console.error('Retrieve memories error:', error);
    res.status(500).json({
      error: 'Failed to retrieve memories',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/v2/:userId/l0/search
 * 全文搜索记忆
 */
router.get('/:userId/l0/search', async (req, res) => {
  try {
    const { userId } = req.params;
    const { q, limit = '20' } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Missing required parameter: q (query)'
      });
    }

    const memories = await memoryV2Service.searchMemories(
      userId,
      q as string,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      query: q,
      count: memories.length,
      memories
    });
  } catch (error: any) {
    console.error('Search memories error:', error);
    res.status(500).json({
      error: 'Failed to search memories',
      details: error.message
    });
  }
});

// ============================================
// L1: Theme聚类 API
// ============================================

/**
 * POST /api/memory/v2/:userId/l1/cluster
 * 运行聚类分析
 */
router.post('/:userId/l1/cluster', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await memoryV2Service.runClustering(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Clustering error:', error);
    res.status(500).json({
      error: 'Failed to run clustering',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/v2/:userId/l1/clusters
 * 获取用户的Theme聚类
 */
router.get('/:userId/l1/clusters', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '10' } = req.query;

    const clusters = await memoryV2Service.getClusters(
      userId,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      count: clusters.length,
      clusters
    });
  } catch (error: any) {
    console.error('Get clusters error:', error);
    res.status(500).json({
      error: 'Failed to get clusters',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/v2/:userId/l1/clusters/:clusterId/shades
 * 获取聚类的代表性记忆
 */
router.get('/:userId/l1/clusters/:clusterId/shades', async (req, res) => {
  try {
    const { clusterId } = req.params;
    const { limit = '5' } = req.query;

    const shades = await memoryV2Service.getClusterShades(
      clusterId,
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      clusterId,
      count: shades.length,
      shades
    });
  } catch (error: any) {
    console.error('Get cluster shades error:', error);
    res.status(500).json({
      error: 'Failed to get cluster shades',
      details: error.message
    });
  }
});

// ============================================
// L2: 传记 API
// ============================================

/**
 * POST /api/memory/v2/:userId/l2/generate
 * 生成用户传记
 */
router.post('/:userId/l2/generate', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await memoryV2Service.generateBiography(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Biography generation error:', error);
    res.status(500).json({
      error: 'Failed to generate biography',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/v2/:userId/l2/biography
 * 获取用户传记
 */
router.get('/:userId/l2/biography', async (req, res) => {
  try {
    const { userId } = req.params;

    const biography = await memoryV2Service.getBiography(userId);

    if (!biography) {
      return res.status(404).json({
        error: 'Biography not found',
        message: 'Please generate biography first'
      });
    }

    res.json({
      success: true,
      biography
    });
  } catch (error: any) {
    console.error('Get biography error:', error);
    res.status(500).json({
      error: 'Failed to get biography',
      details: error.message
    });
  }
});

// ============================================
// Me-Alignment生成 API
// ============================================

/**
 * POST /api/memory/v2/:userId/generate
 * 生成个性化回复
 */
router.post('/:userId/generate', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      currentInput,
      conversationHistory = [],
      partnerId,
      partnerName,
      scene
    } = req.body;

    if (!currentInput) {
      return res.status(400).json({
        error: 'Missing required field: currentInput'
      });
    }

    const context = {
      userId,
      currentInput,
      conversationHistory,
      partnerId,
      partnerName,
      timestamp: new Date(),
      scene
    };

    const result = await memoryV2Service.generateResponse(context);

    res.json({
      success: true,
      response: result.response,
      alignmentScore: result.alignmentScore,
      generationTime: result.generationTime,
      retrievedMemoriesCount: result.retrievedMemoriesCount
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
});

/**
 * POST /api/memory/v2/:userId/feedback
 * 记录用户反馈 (RLHF)
 */
router.post('/:userId/feedback', async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      response,
      context,
      rating,
      feedbackText,
      correction
    } = req.body;

    if (!response || !context) {
      return res.status(400).json({
        error: 'Missing required fields: response, context'
      });
    }

    await memoryV2Service.recordFeedback(
      userId,
      response,
      context,
      rating,
      feedbackText,
      correction
    );

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error: any) {
    console.error('Record feedback error:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      details: error.message
    });
  }
});

// ============================================
// 完整管线 API
// ============================================

/**
 * POST /api/memory/v2/:userId/build-hierarchy
 * 构建完整记忆层次 (L0 → L1 → L2)
 */
router.post('/:userId/build-hierarchy', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await memoryV2Service.buildMemoryHierarchy(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Build hierarchy error:', error);
    res.status(500).json({
      error: 'Failed to build memory hierarchy',
      details: error.message
    });
  }
});

// ============================================
// 统计and监控 API
// ============================================

/**
 * GET /api/memory/v2/:userId/stats
 * 获取记忆统计
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await memoryV2Service.getMemoryStats(userId);

    res.json({
      success: true,
      userId,
      stats
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get memory stats',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/v2/health
 * 健康检查
 */
router.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    architecture: 'AI-Native Memory (HMM + Me-Alignment)',
    features: [
      'L0: Raw Memory Storage',
      'L1: Topic Clustering (HDBSCAN + UMAP)',
      'L2: Biography Generation',
      'Me-Alignment Generation',
      'RLHF Feedback Collection'
    ]
  });
});

export default router;
