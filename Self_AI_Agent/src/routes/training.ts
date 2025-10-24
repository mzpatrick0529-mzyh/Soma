/**
 * Training API Routes
 * 人格模型训练相关的 API 端点
 */

import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { getDB } from '../db/index.js';
import { generateTrainingSamples, getTrainingSampleStats } from '../services/trainingSampleGenerator.js';
import path from 'path';

export const trainingRouter = express.Router();

/**
 * POST /api/self-agent/training/generate-samples
 * 生成训练样本
 */
trainingRouter.post('/generate-samples', async (req: Request, res: Response) => {
  try {
    const { userId, source = 'all', minQuality, maxSamples } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`\n📊 Generating training samples for user: ${userId}`);

    const samplesCreated = await generateTrainingSamples(
      userId,
      source as 'instagram' | 'google' | 'wechat' | 'all',
      { minQuality, maxSamples }
    );

    const stats = getTrainingSampleStats(userId);

    res.json({
      success: true,
      samplesCreated,
      stats
    });
  } catch (error: any) {
    console.error('Failed to generate training samples:', error);
    res.status(500).json({
      error: 'Failed to generate training samples',
      message: error.message
    });
  }
});

/**
 * GET /api/self-agent/training/stats/:userId
 * 获取训练样本统计
 */
trainingRouter.get('/stats/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const stats = getTrainingSampleStats(userId);

    res.json({
      success: true,
      ...stats
    });
  } catch (error: any) {
    console.error('Failed to get training stats:', error);
    res.status(500).json({
      error: 'Failed to get training stats',
      message: error.message
    });
  }
});

/**
 * POST /api/self-agent/training/trigger
 * 触发模型训练
 */
trainingRouter.post('/trigger', async (req: Request, res: Response) => {
  try {
    const { userId, epochs = 3, batchSize = 4, minSamples = 50 } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDB();

    // 检查训练样本数量
    const stats = getTrainingSampleStats(userId);

    if (stats.unused < minSamples) {
      return res.status(400).json({
        error: 'Insufficient training samples',
        required: minSamples,
        current: stats.unused,
        message: `需要至少 ${minSamples} 条训练样本，当前只有 ${stats.unused} 条`
      });
    }

    // 检查是否已有训练任务在运行
    const existingJob = (db.prepare(`
      SELECT * FROM training_jobs
      WHERE user_id = ? AND status = 'running'
      LIMIT 1
    `).get(userId) as any);

    if (existingJob) {
      return res.status(409).json({
        error: 'Training already in progress',
        jobId: existingJob.id
      });
    }

    const trainingId = `training-${userId}-${Date.now()}`;

    // 创建训练任务记录
    db.prepare(`
      INSERT INTO training_jobs (id, user_id, status, started_at)
      VALUES (?, ?, ?, ?)
    `).run(trainingId, userId, 'running', Date.now());

    // 启动 Python 训练进程
    const pythonScript = path.join(process.cwd(), 'src/ml/personality_trainer.py');

    console.log(`\n🚀 Starting training for user: ${userId}`);
    console.log(`   Training ID: ${trainingId}`);
    console.log(`   Samples: ${stats.unused}`);
    console.log(`   Epochs: ${epochs}`);
    console.log(`   Batch size: ${batchSize}`);

    const trainingProcess = spawn('python3', [
      pythonScript,
      '--user-id', userId,
      '--epochs', epochs.toString(),
      '--batch-size', batchSize.toString(),
      '--min-samples', minSamples.toString()
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let trainingOutput = '';

    trainingProcess.stdout.on('data', (data) => {
      const output = data.toString();
      trainingOutput += output;
      console.log(`[Training ${userId}]: ${output.trim()}`);
    });

    trainingProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[Training ${userId}] ERROR: ${error.trim()}`);
    });

    trainingProcess.on('close', (code) => {
      const finishedAt = Date.now();

      if (code === 0) {
        // 训练成功
        db.prepare(`
          UPDATE training_jobs
          SET status = 'completed', finished_at = ?
          WHERE id = ?
        `).run(finishedAt, trainingId);

        // 标记训练样本为已使用
        db.prepare(`
          UPDATE personality_training_samples
          SET used_for_training = 1
          WHERE user_id = ? AND used_for_training = 0
        `).run(userId);

        console.log(`\n✅ Training completed successfully for user ${userId}`);
        console.log(`   Training ID: ${trainingId}`);
        console.log(`   Duration: ${((finishedAt - Date.parse(trainingId.split('-')[2])) / 1000).toFixed(2)}s`);
      } else {
        // Training failed
        db.prepare(`
          UPDATE training_jobs
          SET status = 'failed', finished_at = ?, error_message = ?
          WHERE id = ?
        `).run(finishedAt, trainingOutput, trainingId);

        console.error(`\n❌ Training failed for user ${userId}`);
        console.error(`   Exit code: ${code}`);
      }
    });

    // 立即返回响应（训练在后台进行）
    res.json({
      success: true,
      trainingId,
      status: 'started',
      sampleCount: stats.unused,
      estimatedDurationMinutes: Math.ceil(stats.unused / 20),
      message: '训练已开始，将在后台运行'
    });
  } catch (error: any) {
    console.error('Failed to trigger training:', error);
    res.status(500).json({
      error: 'Failed to trigger training',
      message: error.message
    });
  }
});

/**
 * GET /api/self-agent/training/status/:userId
 * 查询训练状态
 */
trainingRouter.get('/status/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDB();

    // 获取最近的训练任务
    const job = (db.prepare(`
      SELECT * FROM training_jobs
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(userId) as any);

    if (!job) {
      return res.json({
        status: 'never_trained',
        message: '该用户从未训练过模型'
      });
    }

    // 获取已训练的模型信息
    const model = (db.prepare(`
      SELECT * FROM personality_models
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId) as any);

    res.json({
      job: {
        id: job.id,
        status: job.status,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        errorMessage: job.error_message
      },
      model: model ? {
        version: model.model_version,
        type: model.model_type,
        samplesCount: model.training_samples_count,
        trainingLoss: model.training_loss,
        createdAt: model.created_at
      } : null
    });
  } catch (error: any) {
    console.error('Failed to get training status:', error);
    res.status(500).json({
      error: 'Failed to get training status',
      message: error.message
    });
  }
});

/**
 * DELETE /api/self-agent/training/reset/:userId
 * 重置训练数据（用于测试）
 */
trainingRouter.delete('/reset/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDB();

    // 删除训练样本
    db.prepare(`
      DELETE FROM personality_training_samples
      WHERE user_id = ?
    `).run(userId);

    // 删除训练任务
    db.prepare(`
      DELETE FROM training_jobs
      WHERE user_id = ?
    `).run(userId);

    // 删除模型记录
    db.prepare(`
      DELETE FROM personality_models
      WHERE user_id = ?
    `).run(userId);

    console.log(`✅ Reset training data for user: ${userId}`);

    res.json({
      success: true,
      message: '训练数据已重置'
    });
  } catch (error: any) {
    console.error('Failed to reset training data:', error);
    res.status(500).json({
      error: 'Failed to reset training data',
      message: error.message
    });
  }
});

export default trainingRouter;
