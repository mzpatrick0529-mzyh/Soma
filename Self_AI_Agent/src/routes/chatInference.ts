/**
 * Self Agent Chat Inference Routes
 * 人格模型推理 API - 用于生成个性化回复
 */

import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import { getDB } from '../db/index.js';
import { retrieveRelevant } from '../pipeline/rag.js';
import path from 'path';

export const chatInferenceRouter = express.Router();

/**
 * POST /api/self-agent/chat/inference
 * 使用训练好的人格模型生成回复
 */
chatInferenceRouter.post('/inference', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      message,
      conversationHistory = [],
      useRAG = true,
      temperature = 0.8,
      maxTokens = 150
    } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: 'userId and message are required'
      });
    }

    const db = getDB();

    // 1. 检查用户是否有训练好的模型
    const model = (db.prepare(`
      SELECT model_path, model_version, created_at
      FROM personality_models
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId) as any);

    if (!model) {
      return res.status(404).json({
        error: 'No trained model found',
        message: '用户还没有训练人格模型，请先导入数据并训练',
        suggestion: 'POST /api/self-agent/training/trigger'
      });
    }

    console.log(`\n🤖 Generating response for user: ${userId}`);
    console.log(`   Model: ${model.model_path}`);
    console.log(`   Message: ${message.substring(0, 50)}...`);

    // 2. 使用 RAG 检索相关记忆（如果启用）
    let relevantMemories: string[] = [];
    
    if (useRAG) {
      try {
        const ragResults = await retrieveRelevant(userId, message, { topK: 3 });
        relevantMemories = ragResults.map(r => r.text);
        console.log(`   Retrieved ${relevantMemories.length} relevant memories`);
      } catch (ragError) {
        console.warn('   RAG retrieval failed:', ragError);
        // 继续执行，只是没有记忆增强
      }
    }

    // 3. 调用 Python 推理脚本
    const pythonScript = path.join(process.cwd(), 'src/ml/personality_inference.py');
    
    // 构建输入数据
    const inputData = {
      userId,
      message,
      conversationHistory,
      relevantMemories,
      config: {
        temperature,
        max_new_tokens: maxTokens
      }
    };

    // 启动 Python 进程
    const inferenceProcess = spawn('python3', [
      pythonScript,
      '--user-id', userId,
      '--message', message,
      '--temperature', temperature.toString(),
      '--max-tokens', maxTokens.toString()
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let output = '';
    let errorOutput = '';

    inferenceProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    inferenceProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`[Inference] ${data.toString()}`);
    });

    inferenceProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // 解析输出（假设 Python 脚本输出 JSON）
          const result = JSON.parse(output);
          
          res.json({
            success: true,
            response: result.response,
            metadata: {
              modelVersion: model.model_version,
              modelPath: model.model_path,
              usedMemories: relevantMemories.length,
              temperature,
              ...result.metadata
            }
          });
        } catch (parseError) {
          // 如果输出不是 JSON，直接返回文本
          res.json({
            success: true,
            response: output.trim(),
            metadata: {
              modelVersion: model.model_version,
              usedMemories: relevantMemories.length,
              temperature
            }
          });
        }
      } else {
        res.status(500).json({
          error: 'Inference failed',
          message: errorOutput || 'Unknown error',
          exitCode: code
        });
      }
    });

  } catch (error: any) {
    console.error('Inference API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/self-agent/chat/model-status/:userId
 * 查询用户的模型状态
 */
chatInferenceRouter.get('/model-status/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = getDB();

    // 查询最新模型
    const model = (db.prepare(`
      SELECT 
        model_version,
        model_type,
        model_path,
        training_samples_count,
        training_loss,
        created_at,
        is_active
      FROM personality_models
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId) as any);

    if (!model) {
      return res.json({
        hasModel: false,
        message: '用户还没有训练人格模型'
      });
    }

    // 查询训练样本统计
    const sampleStats = (db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN used_for_training = 1 THEN 1 ELSE 0 END) as used,
        AVG(quality_score) as avg_quality
      FROM personality_training_samples
      WHERE user_id = ?
    `).get(userId) as any);

    res.json({
      hasModel: true,
      model: {
        version: model.model_version,
        type: model.model_type,
        path: model.model_path,
        trainingSamples: model.training_samples_count,
        trainingLoss: model.training_loss,
        createdAt: model.created_at,
        isActive: model.is_active === 1
      },
      samples: {
        total: sampleStats?.total || 0,
        used: sampleStats?.used || 0,
        avgQuality: sampleStats?.avg_quality || 0
      }
    });

  } catch (error: any) {
    console.error('Failed to get model status:', error);
    res.status(500).json({
      error: 'Failed to get model status',
      message: error.message
    });
  }
});

/**
 * POST /api/self-agent/chat/batch-inference
 * 批量生成回复（用于评估）
 */
chatInferenceRouter.post('/batch-inference', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      messages = [],
      config = {}
    } = req.body;

    if (!userId || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'userId and messages array are required'
      });
    }

    if (messages.length > 20) {
      return res.status(400).json({
        error: 'Too many messages',
        message: 'Maximum 20 messages per batch'
      });
    }

    const db = getDB();

    // 检查模型
    const model = (db.prepare(`
      SELECT model_path
      FROM personality_models
      WHERE user_id = ? AND is_active = 1
      LIMIT 1
    `).get(userId) as any);

    if (!model) {
      return res.status(404).json({
        error: 'No trained model found'
      });
    }

    console.log(`\n📊 Batch inference for ${messages.length} messages`);

    // 依次生成回复（简化版本，实际可以并行）
    const results: any[] = [];

    for (const message of messages) {
      try {
        // 这里复用单个推理逻辑（简化版）
        // 实际生产中应该批量处理以提高效率
        
        const ragResults = await retrieveRelevant(userId, message, { topK: 2 });
        const relevantMemories = ragResults.map(r => r.text);

        // TODO: 实际调用 Python 推理
        // 目前返回占位符
        results.push({
          message,
          response: `[推理回复: ${message}]`,
          usedMemories: relevantMemories.length
        });

      } catch (error: any) {
        results.push({
          message,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      total: messages.length,
      succeeded: results.filter(r => !r.error).length
    });

  } catch (error: any) {
    console.error('Batch inference error:', error);
    res.status(500).json({
      error: 'Batch inference failed',
      message: error.message
    });
  }
});

export default chatInferenceRouter;
