/**
 * Data Deduplication Utilities
 * 数据去重工具 - 基于内容哈希识别重复数据
 */
import crypto from "crypto";
import { getDB } from "../db";

/**
 * 计算文本内容的哈希值
 */
export function contentHash(text: string): string {
  return crypto
    .createHash("sha256")
    .update(text.trim().toLowerCase())
    .digest("hex");
}

/**
 * 检测并返回重复的文档
 */
export function findDuplicateDocuments(userId: string): Array<{
  hash: string;
  count: number;
  ids: string[];
  content: string;
}> {
  const db = getDB();
  
  // 获取用户所有文档
  const docs = db
    .prepare("SELECT id, content FROM documents WHERE user_id = ?")
    .all(userId) as Array<{ id: string; content: string }>;

  // 按内容哈希分组
  const hashMap = new Map<string, { ids: string[]; content: string }>();
  
  for (const doc of docs) {
    if (!doc.content) continue;
    
    const hash = contentHash(doc.content);
    
    if (!hashMap.has(hash)) {
      hashMap.set(hash, { ids: [], content: doc.content });
    }
    
    hashMap.get(hash)!.ids.push(doc.id);
  }

  // 筛选出重复的（count > 1）
  const duplicates: Array<{
    hash: string;
    count: number;
    ids: string[];
    content: string;
  }> = [];

  for (const [hash, data] of hashMap.entries()) {
    if (data.ids.length > 1) {
      duplicates.push({
        hash,
        count: data.ids.length,
        ids: data.ids,
        content: data.content.slice(0, 200), // 预览前200字符
      });
    }
  }

  return duplicates.sort((a, b) => b.count - a.count);
}

/**
 * 检测并返回重复的 chunks
 */
export function findDuplicateChunks(userId: string): Array<{
  hash: string;
  count: number;
  ids: string[];
  text: string;
}> {
  const db = getDB();
  
  const chunks = db
    .prepare("SELECT id, text FROM chunks WHERE user_id = ?")
    .all(userId) as Array<{ id: string; text: string }>;

  const hashMap = new Map<string, { ids: string[]; text: string }>();
  
  for (const chunk of chunks) {
    if (!chunk.text) continue;
    
    const hash = contentHash(chunk.text);
    
    if (!hashMap.has(hash)) {
      hashMap.set(hash, { ids: [], text: chunk.text });
    }
    
    hashMap.get(hash)!.ids.push(chunk.id);
  }

  const duplicates: Array<{
    hash: string;
    count: number;
    ids: string[];
    text: string;
  }> = [];

  for (const [hash, data] of hashMap.entries()) {
    if (data.ids.length > 1) {
      duplicates.push({
        hash,
        count: data.ids.length,
        ids: data.ids,
        text: data.text.slice(0, 200),
      });
    }
  }

  return duplicates.sort((a, b) => b.count - a.count);
}

/**
 * 删除重复文档（保留第一个）
 */
export function removeDuplicateDocuments(
  userId: string,
  dryRun = false
): { removed: number; kept: number } {
  const db = getDB();
  const duplicates = findDuplicateDocuments(userId);
  
  let removed = 0;
  let kept = 0;

  for (const dup of duplicates) {
    // 保留第一个，删除其余
    const [keepId, ...removeIds] = dup.ids;
    kept += 1;
    removed += removeIds.length;

    if (!dryRun) {
      for (const docId of removeIds) {
        // 删除关联的 chunks
        db.prepare("DELETE FROM chunks WHERE doc_id = ?").run(docId);
        // 删除文档
        db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
      }
    }
  }

  return { removed, kept };
}

/**
 * 删除重复 chunks（保留第一个）
 */
export function removeDuplicateChunks(
  userId: string,
  dryRun = false
): { removed: number; kept: number } {
  const db = getDB();
  const duplicates = findDuplicateChunks(userId);
  
  let removed = 0;
  let kept = 0;

  for (const dup of duplicates) {
    const [keepId, ...removeIds] = dup.ids;
    kept += 1;
    removed += removeIds.length;

    if (!dryRun) {
      for (const chunkId of removeIds) {
        // 删除关联的 vectors
        db.prepare("DELETE FROM vectors WHERE chunk_id = ?").run(chunkId);
        // 删除 chunk
        db.prepare("DELETE FROM chunks WHERE id = ?").run(chunkId);
      }
    }
  }

  return { removed, kept };
}

/**
 * 完整去重流程（文档 + chunks）
 */
export function deduplicateUserData(
  userId: string,
  options: {
    dryRun?: boolean;
    includeDocs?: boolean;
    includeChunks?: boolean;
  } = {}
): {
  documents: { removed: number; kept: number };
  chunks: { removed: number; kept: number };
  dryRun: boolean;
} {
  const {
    dryRun = false,
    includeDocs = true,
    includeChunks = true,
  } = options;

  const result = {
    documents: { removed: 0, kept: 0 },
    chunks: { removed: 0, kept: 0 },
    dryRun,
  };

  if (includeDocs) {
    result.documents = removeDuplicateDocuments(userId, dryRun);
  }

  if (includeChunks) {
    result.chunks = removeDuplicateChunks(userId, dryRun);
  }

  return result;
}

/**
 * 获取去重统计信息（不执行删除）
 */
export function getDeduplicationStats(userId: string) {
  const docDuplicates = findDuplicateDocuments(userId);
  const chunkDuplicates = findDuplicateChunks(userId);

  let totalDocDuplicates = 0;
  let totalChunkDuplicates = 0;

  for (const dup of docDuplicates) {
    totalDocDuplicates += dup.count - 1; // 减去保留的一个
  }

  for (const dup of chunkDuplicates) {
    totalChunkDuplicates += dup.count - 1;
  }

  return {
    documents: {
      duplicateGroups: docDuplicates.length,
      totalDuplicates: totalDocDuplicates,
      examples: docDuplicates.slice(0, 5), // 前5个示例
    },
    chunks: {
      duplicateGroups: chunkDuplicates.length,
      totalDuplicates: totalChunkDuplicates,
      examples: chunkDuplicates.slice(0, 5),
    },
  };
}
