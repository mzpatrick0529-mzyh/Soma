/**
 * 训练样本增强与多任务训练集成接口
 * 提供TypeScript调用Python训练脚本的桥接
 */

import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { getDB } from '../db/index.js';

const router = express.Router();

/**
 * POST /api/self-agent/training/augment-samples
 * 触发样本增强
 */
router.post('/augment-samples', async (req: Request, res: Response) => {
  try {
    const { userId, multiplier = 3.0 } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log(`\n🔄 Starting sample augmentation for user: ${userId}`);
    console.log(`   Target multiplier: ${multiplier}x`);
    
    const pythonScript = path.join(process.cwd(), 'src/ml/sample_augmenter.py');
    const dbPath = process.env.SELF_AGENT_DB || './self_agent.db';
    
    const augmentProcess = spawn('python3', [
      pythonScript,
      '--user-id', userId,
      '--db-path', dbPath,
      '--multiplier', multiplier.toString()
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    let output = '';
    let errorOutput = '';
    
    augmentProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`[Augmentation] ${text.trim()}`);
    });
    
    augmentProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(`[Augmentation Error] ${text.trim()}`);
    });
    
    augmentProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Sample augmentation completed for user ${userId}`);
        
        // 查询增强后的统计
        const db = getDB();
        const stats = db.prepare(`
          SELECT 
            augmentation_type,
            COUNT(*) as count
          FROM enhanced_training_samples
          WHERE user_id = ?
          GROUP BY augmentation_type
        `).all(userId) as any[];
        
        const distribution = stats.reduce((acc: any, row: any) => {
          acc[row.augmentation_type] = row.count;
          return acc;
        }, {});
        
        res.json({
          success: true,
          userId,
          multiplier,
          distribution,
          totalSamples: stats.reduce((sum: number, row: any) => sum + row.count, 0),
          output: output.split('\n').slice(-10).join('\n')  // 最后10行
        });
      } else {
        console.error(`❌ Sample augmentation failed for user ${userId}`);
        res.status(500).json({
          error: 'Sample augmentation failed',
          exitCode: code,
          output: errorOutput || output
        });
      }
    });
    
  } catch (error: any) {
    console.error('Sample augmentation error:', error);
    res.status(500).json({
      error: 'Failed to start sample augmentation',
      message: error.message
    });
  }
});

/**
 * GET /api/self-agent/training/augmentation-stats/:userId
 * 获取增强统计信息
 */
router.get('/augmentation-stats/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const db = getDB();
    
    // 按类型统计
    const typeStats = db.prepare(`
      SELECT 
        augmentation_type,
        COUNT(*) as count,
        AVG(quality_score) as avg_quality
      FROM enhanced_training_samples
      WHERE user_id = ?
      GROUP BY augmentation_type
      ORDER BY count DESC
    `).all(userId) as any[];
    
    // 质量分布
    const qualityStats = db.prepare(`
      SELECT 
        CASE 
          WHEN quality_score < 0.3 THEN 'low'
          WHEN quality_score < 0.7 THEN 'medium'
          ELSE 'high'
        END as quality_level,
        COUNT(*) as count
      FROM enhanced_training_samples
      WHERE user_id = ?
      GROUP BY quality_level
    `).all(userId) as any[];
    
    // 总计
    const total = db.prepare(`
      SELECT COUNT(*) as count
      FROM enhanced_training_samples
      WHERE user_id = ?
    `).get(userId) as any;
    
    res.json({
      success: true,
      userId,
      typeDistribution: typeStats,
      qualityDistribution: qualityStats,
      totalSamples: total?.count || 0
    });
    
  } catch (error: any) {
    console.error('Get augmentation stats error:', error);
    res.status(500).json({
      error: 'Failed to get augmentation stats',
      message: error.message
    });
  }
});

/**
 * POST /api/self-agent/training/train-multitask
 * 触发多任务训练
 */
router.post('/train-multitask', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      epochs = 3,
      batchSize = 4,
      useAugmented = true,
      genLossWeight = 1.0,
      styleLossWeight = 0.3,
      relationLossWeight = 0.2,
      contrastiveLossWeight = 0.1
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const db = getDB();
    
    // 检查样本数量
    const table = useAugmented ? 'enhanced_training_samples' : 'personality_training_samples';
    const sampleCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM ${table}
      WHERE user_id = ? AND used_for_training = 0
    `).get(userId) as any;
    
    if (!sampleCount || sampleCount.count < 50) {
      return res.status(400).json({
        error: 'Insufficient samples',
        current: sampleCount?.count || 0,
        required: 50,
        suggestion: 'Run sample augmentation first'
      });
    }
    
    console.log(`\n🚀 Starting multi-task training for user: ${userId}`);
    console.log(`   Epochs: ${epochs}, Batch Size: ${batchSize}`);
    console.log(`   Using augmented data: ${useAugmented}`);
    console.log(`   Loss weights: Gen=${genLossWeight}, Style=${styleLossWeight}, Rel=${relationLossWeight}, Contra=${contrastiveLossWeight}`);
    
    const trainingId = `multitask-${userId}-${Date.now()}`;
    
    // 创建训练任务记录
    db.prepare(`
      INSERT INTO training_jobs (id, user_id, status, started_at)
      VALUES (?, ?, 'running', ?)
    `).run(trainingId, userId, Date.now());
    
    const pythonScript = path.join(process.cwd(), 'src/ml/multitask_trainer.py');
    const dbPath = process.env.SELF_AGENT_DB || './self_agent.db';
    
    const trainingProcess = spawn('python3', [
      pythonScript,
      '--user-id', userId,
      '--db-path', dbPath,
      '--epochs', epochs.toString(),
      '--batch-size', batchSize.toString(),
      '--gen-loss-weight', genLossWeight.toString(),
      '--style-loss-weight', styleLossWeight.toString(),
      '--relation-loss-weight', relationLossWeight.toString(),
      '--contrastive-loss-weight', contrastiveLossWeight.toString(),
      ...(useAugmented ? ['--use-augmented'] : [])
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    let trainingOutput = '';
    
    trainingProcess.stdout.on('data', (data) => {
      const text = data.toString();
      trainingOutput += text;
      console.log(`[Training ${userId}] ${text.trim()}`);
    });
    
    trainingProcess.stderr.on('data', (data) => {
      const text = data.toString();
      console.error(`[Training ${userId}] ERROR: ${text.trim()}`);
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
        
        // 标记样本为已使用
        db.prepare(`
          UPDATE ${table}
          SET used_for_training = 1
          WHERE user_id = ? AND used_for_training = 0
        `).run(userId);
        
        console.log(`\n✅ Multi-task training completed successfully for user ${userId}`);
      } else {
        // 训练失败
        db.prepare(`
          UPDATE training_jobs
          SET status = 'failed', finished_at = ?, error_message = ?
          WHERE id = ?
        `).run(finishedAt, trainingOutput, trainingId);
        
        console.error(`\n❌ Multi-task training failed for user ${userId}`);
      }
    });
    
    // 立即返回响应
    res.json({
      success: true,
      trainingId,
      status: 'started',
      sampleCount: sampleCount.count,
      config: {
        epochs,
        batchSize,
        useAugmented,
        lossWeights: {
          generation: genLossWeight,
          style: styleLossWeight,
          relationship: relationLossWeight,
          contrastive: contrastiveLossWeight
        }
      },
      message: '多任务训练已开始，将在后台运行'
    });
    
  } catch (error: any) {
    console.error('Multi-task training error:', error);
    res.status(500).json({
      error: 'Failed to start multi-task training',
      message: error.message
    });
  }
});

/**
 * GET /api/self-agent/training/model-comparison/:userId
 * 对比原始训练和多任务训练的模型
 */
router.get('/model-comparison/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const db = getDB();
    
    // 获取所有模型
    const models = db.prepare(`
      SELECT 
        model_version,
        model_type,
        training_loss,
        training_samples_count,
        created_at,
        is_active
      FROM personality_models
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as any[];
    
    if (models.length === 0) {
      return res.status(404).json({
        error: 'No models found for this user'
      });
    }
    
    // 对比最新的两个模型
    const comparison = {
      latest: models[0],
      previous: models[1] || null,
      improvement: null as any
    };
    
    if (models.length >= 2) {
      const lossImprovement = ((models[1].training_loss - models[0].training_loss) / models[1].training_loss * 100).toFixed(2);
      
      comparison.improvement = {
        lossReduction: `${lossImprovement}%`,
        samplesIncrease: models[0].training_samples_count - models[1].training_samples_count
      };
    }
    
    res.json({
      success: true,
      userId,
      totalModels: models.length,
      comparison,
      allModels: models
    });
    
  } catch (error: any) {
    console.error('Model comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare models',
      message: error.message
    });
  }
});

export default router;
