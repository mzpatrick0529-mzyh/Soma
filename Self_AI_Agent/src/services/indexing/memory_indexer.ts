/**
 * Memory Indexer Service
 * 统一管理wechat/instagram/google的数据索引和检索
 */

import fs from 'fs/promises';
import path from 'path';
import { insertDocument, insertChunk, insertVector } from '../../db/index.js';
import { embedText } from '../../pipeline/embeddings.js';
import { randomUUID } from 'crypto';

export interface MemorySource {
  source: 'wechat' | 'instagram' | 'google';
  version: string;
  lastUpdated: string | null;
  totalDocuments: number;
  decryptionStatus: 'pending' | 'in_progress' | 'completed' | 'not_required' | 'failed';
  metadata: {
    encrypted: boolean;
    requiresKey: boolean;
    fileTypes: string[];
    notes: string;
  };
  files: string[];
}

export interface MemoryDocument {
  source: 'wechat' | 'instagram' | 'google';
  type: string;
  title: string;
  content: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

const MEMORIES_BASE = path.join(process.cwd(), 'memories');

/**
 * 获取指定数据源的索引信息
 */
export async function getSourceIndex(source: 'wechat' | 'instagram' | 'google'): Promise<MemorySource> {
  const indexPath = path.join(MEMORIES_BASE, source, 'index.json');
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 返回默认索引
    return {
      source,
      version: '1.0.0',
      lastUpdated: null,
      totalDocuments: 0,
      decryptionStatus: source === 'wechat' ? 'pending' : 'not_required',
      metadata: {
        encrypted: source === 'wechat',
        requiresKey: source === 'wechat',
        fileTypes: [],
        notes: ''
      },
      files: []
    };
  }
}

/**
 * 更新指定数据源的索引信息
 */
export async function updateSourceIndex(source: 'wechat' | 'instagram' | 'google', updates: Partial<MemorySource>): Promise<void> {
  const indexPath = path.join(MEMORIES_BASE, source, 'index.json');
  const current = await getSourceIndex(source);
  const updated = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString()
  };
  await fs.writeFile(indexPath, JSON.stringify(updated, null, 2), 'utf-8');
}

/**
 * 添加文件到原始数据目录
 */
export async function addRawFile(source: 'wechat' | 'instagram' | 'google', filename: string, content: Buffer | string): Promise<string> {
  const rawDir = path.join(MEMORIES_BASE, source, 'raw');
  const filePath = path.join(rawDir, filename);
  
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  if (Buffer.isBuffer(content)) {
    await fs.writeFile(filePath, content);
  } else {
    await fs.writeFile(filePath, content, 'utf-8');
  }
  
  return filePath;
}

/**
 * 处理并索引内存文档
 */
export async function indexMemoryDocument(
  userId: string,
  doc: MemoryDocument
): Promise<{ docId: string; chunks: number }> {
  console.log(`[memory-indexer] Indexing ${doc.source} document: ${doc.title}`);
  
  // 1. 插入文档
  const docId = randomUUID();
  insertDocument({
    id: docId,
    user_id: userId,
    source: doc.source,
    type: doc.type,
    title: doc.title,
    content: doc.content,
    metadata: doc.metadata
  });

  // 2. 分块
  const chunkSize = 1200;
  const overlap = 120;
  const chunks: string[] = [];
  
  for (let i = 0; i < doc.content.length; i += chunkSize - overlap) {
    const chunk = doc.content.slice(i, i + chunkSize);
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }

  // 3. 插入chunks并生成embeddings
  let chunkCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    
    // 插入chunk
    const chunkId = randomUUID();
    insertChunk({
      id: chunkId,
      doc_id: docId,
      user_id: userId,
      idx: i,
      text: chunkText,
      metadata: {
        source: doc.source,
        docTitle: doc.title,
        chunkIndex: i,
        totalChunks: chunks.length
      }
    });

    // 生成embedding并插入
    try {
      const embedding = embedText(chunkText);
      insertVector(chunkId, userId, embedding);
      chunkCount++;
    } catch (error) {
      console.error(`[memory-indexer] Failed to embed chunk ${i}:`, error);
    }
  }

  console.log(`[memory-indexer] Indexed doc ${docId} with ${chunkCount} chunks`);
  return { docId: docId, chunks: chunkCount };
}

/**
 * 批量索引内存文档
 */
export async function indexMemoryDocuments(
  userId: string,
  source: 'wechat' | 'instagram' | 'google',
  documents: MemoryDocument[]
): Promise<{ total: number; success: number; failed: number }> {
  console.log(`[memory-indexer] Starting batch indexing for ${source}: ${documents.length} documents`);
  
  let success = 0;
  let failed = 0;
  
  for (const doc of documents) {
    try {
      await indexMemoryDocument(userId, doc);
      success++;
    } catch (error) {
      console.error(`[memory-indexer] Failed to index document:`, error);
      failed++;
    }
  }
  
  // 更新索引
  await updateSourceIndex(source, {
    totalDocuments: success,
    decryptionStatus: 'completed'
  });
  
  console.log(`[memory-indexer] Batch indexing completed: ${success} success, ${failed} failed`);
  return { total: documents.length, success, failed };
}

/**
 * 获取所有数据源的统计信息
 */
export async function getAllSourcesStats(): Promise<Record<string, MemorySource>> {
  const sources: ('wechat' | 'instagram' | 'google')[] = ['wechat', 'instagram', 'google'];
  const stats: Record<string, MemorySource> = {};
  
  for (const source of sources) {
    stats[source] = await getSourceIndex(source);
  }
  
  return stats;
}

/**
 * 保存处理后的文档到processed目录
 */
export async function saveProcessedDocument(
  source: 'wechat' | 'instagram' | 'google',
  filename: string,
  content: string
): Promise<string> {
  const processedDir = path.join(MEMORIES_BASE, source, 'processed');
  const filePath = path.join(processedDir, filename);
  
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
  
  return filePath;
}

/**
 * 列出指定数据源的所有原始文件
 */
export async function listRawFiles(source: 'wechat' | 'instagram' | 'google'): Promise<string[]> {
  const rawDir = path.join(MEMORIES_BASE, source, 'raw');
  try {
    const files = await fs.readdir(rawDir, { recursive: true });
    return files.filter(f => !f.endsWith('.json'));
  } catch (error) {
    return [];
  }
}

/**
 * 读取原始文件内容
 */
export async function readRawFile(source: 'wechat' | 'instagram' | 'google', filename: string): Promise<string> {
  const filePath = path.join(MEMORIES_BASE, source, 'raw', filename);
  return await fs.readFile(filePath, 'utf-8');
}
