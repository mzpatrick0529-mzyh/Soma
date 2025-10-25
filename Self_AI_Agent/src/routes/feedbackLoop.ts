/**
 * Feedback Loop API Routes
 * 
 * Phase 4 API: 反馈循环和在线学习路由
 */

import { Router } from 'express';
import { getDb } from '../db';
import { FeedbackCollector } from '../services/feedbackCollector';
import { RewardModel } from '../services/rewardModel';
import { OnlineLearner } from '../services/onlineLearner';
import { DriftDetector } from '../services/driftDetector';
import { ABTestingFramework } from '../services/abTestingFramework';
import { TuringTestHarness } from '../services/turingTestHarness';

const router = Router();

// 环境变量
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ============= Feedback Collection =============

/**
 * POST /feedback/explicit
 * 收集显式反馈(点赞/点踩/评分)
 */
router.post('/feedback/explicit', async (req, res) => {
  try {
    const { conversationId, messageId, userId, feedbackType, rating, reason } = req.body;

    if (!conversationId || !messageId || !userId || !feedbackType) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const db = getDb();
    const collector = new FeedbackCollector(db);

    collector.collectExplicitFeedback({
      conversationId,
      messageId,
      userId,
      feedbackType,
      rating,
      reason,
      timestamp: Date.now()
    });

    res.json({ 
      success: true,
      message: 'Explicit feedback collected' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /feedback/implicit
 * 收集隐式反馈(编辑/重新生成)
 */
router.post('/feedback/implicit', async (req, res) => {
  try {
    const { conversationId, messageId, userId, actionType, originalResponse, editedResponse, contextBefore } = req.body;

    if (!conversationId || !messageId || !userId || !actionType || !originalResponse) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    const db = getDb();
    const collector = new FeedbackCollector(db);

    collector.collectImplicitFeedback({
      conversationId,
      messageId,
      userId,
      actionType,
      originalResponse,
      editedResponse,
      contextBefore: contextBefore || [],
      timestamp: Date.now()
    });

    res.json({ 
      success: true,
      message: 'Implicit feedback collected' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /feedback/generate-pairs
 * 从反馈生成偏好对
 */
router.post('/feedback/generate-pairs', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDb();
    const collector = new FeedbackCollector(db);

    const explicitPairs = collector.generatePreferencePairsFromExplicit(userId, 'all');
    const implicitPairs = collector.generatePreferencePairsFromImplicit(userId);

    res.json({
      success: true,
      explicitPairs,
      implicitPairs,
      total: explicitPairs + implicitPairs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback/stats/:userId
 * 获取反馈统计
 */
router.get('/feedback/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = getDb();
    const collector = new FeedbackCollector(db);

    const stats = collector.getFeedbackStats(userId);

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= Reward Model =============

/**
 * POST /reward/train
 * 训练奖励模型
 */
router.post('/reward/train', async (req, res) => {
  try {
    const { userId, minStrength } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDb();
    const collector = new FeedbackCollector(db);
    const rewardModel = new RewardModel(db, { apiKey: GEMINI_API_KEY });

    // 导出训练数据
    const preferencePairs = collector.exportTrainingDataset(userId, minStrength || 0.5);

    if (preferencePairs.length === 0) {
      return res.status(400).json({ 
        error: 'No preference pairs available for training' 
      });
    }

    // 训练
    const result = await rewardModel.train(preferencePairs);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /reward/score
 * 评分单个响应
 */
router.post('/reward/score', async (req, res) => {
  try {
    const { userId, prompt, response, context } = req.body;

    if (!userId || !prompt || !response) {
      return res.status(400).json({ 
        error: 'userId, prompt, and response are required' 
      });
    }

    const db = getDb();
    const rewardModel = new RewardModel(db, { apiKey: GEMINI_API_KEY });

    const score = await rewardModel.scoreResponse(userId, prompt, response, context || []);

    res.json(score);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /reward/history/:userId
 * 获取评分历史
 */
router.get('/reward/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const db = getDb();
    const rewardModel = new RewardModel(db, { apiKey: GEMINI_API_KEY });

    const history = rewardModel.getScoreHistory(userId, limit);

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= Online Learning =============

/**
 * POST /online-learning/process-feedback
 * 处理新反馈并触发增量更新
 */
router.post('/online-learning/process-feedback', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDb();
    const collector = new FeedbackCollector(db);
    const rewardModel = new RewardModel(db, { apiKey: GEMINI_API_KEY });
    const learner = new OnlineLearner(db);

    // 获取最新反馈
    const preferencePairs = collector.exportTrainingDataset(userId, 0.5);
    const rewardScores = rewardModel.getScoreHistory(userId, 20);

    // 处理反馈
    const update = await learner.processNewFeedback(userId, preferencePairs, rewardScores);

    if (update) {
      res.json({
        success: true,
        update,
        message: 'Incremental update completed'
      });
    } else {
      res.json({
        success: true,
        message: 'No update needed yet'
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /online-learning/stats/:userId
 * 获取在线学习统计
 */
router.get('/online-learning/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = getDb();
    const learner = new OnlineLearner(db);

    const stats = learner.getLearningStats(userId);

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= Drift Detection =============

/**
 * POST /drift/detect
 * 执行漂移检测
 */
router.post('/drift/detect', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDb();
    const detector = new DriftDetector(db);

    const alerts = await detector.detectDrift(userId);

    res.json({
      success: true,
      alerts,
      hasAlerts: alerts.length > 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /drift/history/:userId
 * 获取漂移历史
 */
router.get('/drift/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const db = getDb();
    const detector = new DriftDetector(db);

    const history = detector.getDriftHistory(userId, limit);

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= A/B Testing =============

/**
 * POST /ab-testing/create
 * 创建A/B测试实验
 */
router.post('/ab-testing/create', async (req, res) => {
  try {
    const { userId, variantA, variantB, trafficSplit } = req.body;

    if (!userId || !variantA || !variantB) {
      return res.status(400).json({ 
        error: 'userId, variantA, and variantB are required' 
      });
    }

    const db = getDb();
    const framework = new ABTestingFramework(db);

    const experiment = framework.createExperiment(userId, variantA, variantB, trafficSplit || 0.5);

    res.json(experiment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /ab-testing/record-sample
 * 记录A/B测试样本
 */
router.post('/ab-testing/record-sample', async (req, res) => {
  try {
    const { experimentId, variant, prompt, response, score } = req.body;

    if (!experimentId || !variant || !prompt || !response || score === undefined) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    const db = getDb();
    const framework = new ABTestingFramework(db);

    framework.recordSample(experimentId, variant, prompt, response, score);

    res.json({ 
      success: true,
      message: 'Sample recorded' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /ab-testing/metrics/:experimentId
 * 获取A/B测试指标
 */
router.get('/ab-testing/metrics/:experimentId', async (req, res) => {
  try {
    const { experimentId } = req.params;

    const db = getDb();
    const framework = new ABTestingFramework(db);

    const metrics = framework.getMetrics(experimentId);

    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============= Turing Test =============

/**
 * POST /turing-test/create
 * 创建图灵测试
 */
router.post('/turing-test/create', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDb();
    const harness = new TuringTestHarness(db);

    const test = harness.createTest(userId);

    res.json(test);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /turing-test/record-trial
 * 记录图灵测试trial
 */
router.post('/turing-test/record-trial', async (req, res) => {
  try {
    const { testId, prompt, aiResponse, judgeGuess, confidence, humanResponse } = req.body;

    if (!testId || !prompt || !aiResponse || !judgeGuess || confidence === undefined) {
      return res.status(400).json({ 
        error: 'testId, prompt, aiResponse, judgeGuess, and confidence are required' 
      });
    }

    const db = getDb();
    const harness = new TuringTestHarness(db);

    const trial = harness.recordTrial(
      testId,
      prompt,
      aiResponse,
      judgeGuess,
      confidence,
      humanResponse
    );

    res.json(trial);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /turing-test/results/:testId
 * 获取图灵测试结果
 */
router.get('/turing-test/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const db = getDb();
    const harness = new TuringTestHarness(db);

    const results = harness.getTestResults(testId);

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /turing-test/report/:testId
 * 生成图灵测试报告
 */
router.get('/turing-test/report/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const db = getDb();
    const harness = new TuringTestHarness(db);

    const report = harness.generateReport(testId);

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /turing-test/history/:userId
 * 获取图灵测试历史
 */
router.get('/turing-test/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const db = getDb();
    const harness = new TuringTestHarness(db);

    const history = harness.getTestHistory(userId, limit);

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
