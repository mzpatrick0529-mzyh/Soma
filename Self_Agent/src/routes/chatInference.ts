/**
 * Self Agent Chat Inference Routes
 * 人格模型推理 API - 用于生成个性化回复
 */

import express, { Request, Response } from 'express';
// Queue-based execution
import { enqueueInference, enqueueRerank } from '../queue/queues.js';
import { getDB, getUserAvailableSources } from '../db/index.js';
import { retrieveRelevantHybrid } from '../pipeline/rag.js';
import { buildPersonaProfile, buildPersonaPrompt } from '../pipeline/persona.js';
import { detectSourceIntent, rerankCandidates, composeCitedContext, compressHistory, calibrateStyle } from '../pipeline/rag_enhance.js';
import { rerankWithCrossEncoder } from '../services/reranker.js';
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
      maxTokens = 150,
      rag = {},
      convo = {},
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

    // 2. RAG 增强：来源意图 + 混合检索 + 重排序 + 引用上下文拼接
    let relevantMemories: string[] = [];
    let citedContext = '';
    let predictedSources: string[] = [];
    try {
      if (useRAG) {
        const intent = detectSourceIntent(message);
        predictedSources = intent.sources;
        const topK: number = Math.max(1, Math.min(12, rag.topK ?? 8));
        const minScore: number = typeof rag.minScore === 'number' ? rag.minScore : 0.1;
        const recentBoost: number = typeof rag.recentBoost === 'number' ? rag.recentBoost : 0.15;
        const strict: boolean = !!rag.strictSourceFilter;

        // 混合检索（若不严格过滤，则先不带 sources，由 reranker 偏好加权）
        const initial = retrieveRelevantHybrid(
          userId,
          message,
          {
            topK: topK,
            minScore,
            sources: strict && predictedSources.length ? predictedSources : undefined,
            recentBoost,
          }
        );

        // 重排序：对来源进行轻权重提升，并结合词面重合
        let reranked = rerankCandidates(
          message,
          initial.map(r => ({ id: r.id, text: r.text, score: r.score })),
          { preferredSources: !strict ? predictedSources : [], topK: Math.min(4, topK) }
        );

        // 可选：使用 Cross-Encoder 进一步重排
        try {
          // Prefer queue-based rerank if redis available; fallback to local
          if (process.env.CROSS_ENCODER && process.env.CROSS_ENCODER !== '0') {
            try {
              const rr = await enqueueRerank({ query: message, candidates: reranked.map(x => x.text), model: process.env.CROSS_ENCODER_MODEL });
              const ceScores = rr?.scores;
              if (ceScores && ceScores.length === reranked.length) {
                reranked = reranked.map((r, i) => ({ ...r, score: r.score * 0.5 + ceScores[i] * 0.5 }))
                  .sort((a, b) => b.score - a.score);
              }
            } catch {
              const ceScores = await rerankWithCrossEncoder(message, reranked.map(x => x.text), process.env.CROSS_ENCODER_MODEL);
              if (ceScores && ceScores.length === reranked.length) {
                reranked = reranked.map((r, i) => ({ ...r, score: r.score * 0.5 + ceScores[i] * 0.5 }))
                  .sort((a, b) => b.score - a.score);
              }
            }
          }
        } catch {}

        const composed = composeCitedContext(reranked, { maxSnippets: Math.min(4, topK), maxCharsPerSnippet: 260, dedup: true });
        citedContext = composed.contextText;
        relevantMemories = reranked.map(r => r.text);
        console.log(`   Retrieved ${relevantMemories.length} relevant memories (after rerank)`);
      }
    } catch (ragError) {
      console.warn('   RAG retrieval failed:', ragError);
      // 继续执行，只是没有记忆增强
    }

    // 2.1 会话窗口压缩
    let compressedHistory = '';
    try {
      if (Array.isArray(conversationHistory) && conversationHistory.length) {
        const keepLast = Math.max(0, Math.min(10, convo.keepLast ?? 4));
        const maxChars = Math.max(200, Math.min(4000, convo.maxChars ?? 1200));
        compressedHistory = compressHistory(conversationHistory, { keepLast, maxChars });
      }
    } catch (histErr) {
      console.warn('   Conversation compression failed:', histErr);
    }

    // 2.2 人格提示（与可用数据源）构建
    const availableSources = getUserAvailableSources(userId);
    const persona = buildPersonaProfile(userId, { maxChunks: 120 });
    const personaPrompt = buildPersonaPrompt(persona, citedContext, availableSources);

    // 将 RAG 上下文与会话压缩合并到最终传入模型的消息中（临时方案，直到 Python 接口支持上下文参数）
    const finalMessage = [
      personaPrompt ? `【人格与记忆上下文】\n${personaPrompt}` : '',
      compressedHistory ? `【对话历史】\n${compressedHistory}` : '',
      `【当前问题】\n${message}`
    ].filter(Boolean).join('\n\n');

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

    // 使用队列执行 Python 推理，带超时/重试
    const stdinPayload = {
      personaPrompt: personaPrompt,
      conversationHistory,
      relevantMemories,
      message: finalMessage,
      config: { temperature, max_new_tokens: maxTokens }
    };
    try {
      const result = await enqueueInference({ userId, pythonScript, stdinPayload, timeoutMs: 45_000 });
      const calibrated = calibrateStyle(result.response, { language_style: persona.language_style });
      return res.json({
        success: true,
        response: calibrated,
        metadata: {
          modelVersion: model.model_version,
          modelPath: model.model_path,
          usedMemories: relevantMemories.length,
          temperature,
          predictedSources,
          ...result.metadata
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: 'Inference failed', message: String(e?.message || e) });
    }

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
        
  const ragResults = retrieveRelevantHybrid(userId, message, { topK: 2 });
  const relevantMemories = ragResults.map((r) => r.text);

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
