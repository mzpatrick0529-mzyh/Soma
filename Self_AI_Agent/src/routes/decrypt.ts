/**
 * 解密服务路由
 * 提供WeChat数据解密的API端点
 */

import express from 'express';
import { 
  decryptWeChatData, 
  checkPythonEnvironment,
  getKeyExtractionGuide,
  type DecryptionProgress 
} from '../services/decryption/wechat_decrypt.js';
import { 
  getSourceIndex, 
  updateSourceIndex 
} from '../services/indexing/memory_indexer.js';
import path from 'path';

const router = express.Router();

/**
 * GET /api/decrypt/check-environment
 * 检查Python环境and依赖是否就绪
 */
router.get('/check-environment', async (req, res) => {
  try {
    const envCheck = await checkPythonEnvironment();
    res.json({
      success: envCheck.python && envCheck.pycryptodome,
      ...envCheck
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/decrypt/key-guide
 * 获取密钥提取指南
 */
router.get('/key-guide', (req, res) => {
  res.json({
    guide: getKeyExtractionGuide(),
    keyFormat: {
      length: 64,
      pattern: /^[0-9a-fA-F]{64}$/,
      example: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd'
    }
  });
});

/**
 * POST /api/decrypt/wechat
 * 解密WeChat数据
 * 
 * Body:
 * {
 *   "key": "64-char hex string",  // 可选，如果没有会使用环境变量
 *   "inputDir": "path/to/encrypted/data",
 *   "userId": "user_id"
 * }
 */
router.post('/wechat', async (req, res) => {
  try {
    const { key, inputDir, userId } = req.body;
    
    if (!inputDir) {
      return res.status(400).json({
        error: 'Missing required field: inputDir'
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId'
      });
    }
    
    // 获取密钥（优先使用请求中的，否则使用环境变量）
    const wechatKey = key || process.env.WECHAT_DB_KEY;
    
    if (!wechatKey) {
      return res.status(400).json({
        error: 'WeChat database key not provided. Set WECHAT_DB_KEY environment variable or include "key" in request body.',
        guide: getKeyExtractionGuide()
      });
    }
    
    // 验证密钥格式
    if (!/^[0-9a-fA-F]{64}$/.test(wechatKey)) {
      return res.status(400).json({
        error: 'Invalid key format. Must be 64-character hexadecimal string.',
        provided: `${wechatKey.substring(0, 10)}... (length: ${wechatKey.length})`
      });
    }
    
    // 构建输出路径
    const outputDir = path.join(process.cwd(), 'memories', 'wechat', 'raw', `decrypted_${Date.now()}`);
    
    // 更新索引状态为处理中
    await updateSourceIndex('wechat', {
      decryptionStatus: 'in_progress'
    });
    
    // 发送SSE响应用于实时进度
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const sendProgress = (progress: DecryptionProgress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    };
    
    try {
      sendProgress({
        type: 'progress',
        message: 'Starting decryption...'
      });
      
      const result = await decryptWeChatData(
        wechatKey,
        inputDir,
        outputDir,
        sendProgress
      );
      
      // 更新索引
      await updateSourceIndex('wechat', {
        decryptionStatus: 'completed',
        metadata: {
          encrypted: false,
          requiresKey: false,
          fileTypes: ['ChatPackage_decrypted', 'Media_decrypted', 'Index'],
          notes: `Decrypted successfully: ${result.stats.success} files, failed: ${result.stats.failed}, skipped: ${result.stats.skipped}. Output: ${outputDir}. Timestamp: ${new Date().toISOString()}`
        }
      });
      
      sendProgress({
        type: 'complete',
        message: 'Decryption completed successfully',
        stats: result.stats
      });
      
      res.write(`data: ${JSON.stringify({ 
        type: 'result',
        result 
      })}\n\n`);
      res.end();
      
    } catch (error) {
      await updateSourceIndex('wechat', {
        decryptionStatus: 'failed'
      });
      
      sendProgress({
        type: 'error',
        message: error instanceof Error ? error.message : 'Decryption failed'
      });
      
      res.end();
    }
    
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/decrypt/status/:source
 * 获取指定数据源的解密状态
 */
router.get('/status/:source', async (req, res) => {
  try {
    const source = req.params.source as 'wechat' | 'instagram' | 'google';
    
    if (!['wechat', 'instagram', 'google'].includes(source)) {
      return res.status(400).json({
        error: 'Invalid source. Must be: wechat, instagram, or google'
      });
    }
    
    const index = await getSourceIndex(source);
    
    res.json({
      source: index.source,
      decryptionStatus: index.decryptionStatus,
      totalDocuments: index.totalDocuments,
      lastUpdated: index.lastUpdated,
      metadata: index.metadata
    });
    
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
