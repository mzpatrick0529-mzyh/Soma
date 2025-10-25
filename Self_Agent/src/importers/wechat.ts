/**
 * WeChat Data Importer
 * 支持解析WeChat导出的聊天记录、图片、文件等
 * 优化版本：增强错误处理、支持多种编码、改进内容解析
 */
import fg from "fast-glob";
import fs from "fs";
import path from "path";
import { ensureUser, insertDocument, insertChunk, insertVector } from "../db";
import { ensureUserPg, insertDocumentPg, insertChunkPg } from "../db/pgWrites";
import { findDuplicateDocByContentPg, findDuplicateDocByMediaHashPg } from "../db/pgReads";
import { stripHtml, normalizeText } from "../utils/text";
import { chunkText } from "../pipeline/chunk";
import { embedText } from "../pipeline/embeddings";
import { summarizeMediaByPath } from "../utils/media";
import crypto from "crypto";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

type ImportStats = { files: number; docs: number; chunks: number };


function seemsBinary(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.allocUnsafe(4096);
    const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    let nonPrintable = 0;
    for (let i = 0; i < bytes; i++) {
      const c = buf[i];
      // 常见文本范围：\t(9), \n(10), \r(13), 32..126, 160..255（扩展，容纳部分中文转码场景）
      const printable = c === 9 || c === 10 || c === 13 || (c >= 32 && c <= 126) || c >= 160;
      if (!printable) nonPrintable++;
    }
    const ratio = nonPrintable / Math.max(1, bytes);
    return ratio > 0.3; // 非打印字符超过30%则认为是二进制
  } catch {
    return false;
  }
}

/**
 * 尝试用不同编码读取文件
 */
function readFileWithEncoding(filePath: string): string {
  const encodings = ['utf8', 'utf-8', 'gb2312', 'gbk', 'latin1'];
  
  for (const encoding of encodings) {
    try {
      // Node.js 原生只支持 utf8/latin1/ascii 等
      // 对于中文编码，我们先用 latin1 读取再尝试解析
      if (encoding === 'utf8' || encoding === 'utf-8') {
        return fs.readFileSync(filePath, 'utf8');
      } else if (encoding === 'latin1') {
        const buffer = fs.readFileSync(filePath);
        return buffer.toString('latin1');
      }
    } catch (e) {
      continue;
    }
  }
  
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('utf8');
  } catch (e) {
    throw new Error(`Failed to read file with any encoding: ${filePath}`);
  }
}

function cleanInvalidUtf8(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // 控制字符
    .replace(/\uFFFD/g, '') // 替换字符
    .trim();
}

export async function importWeChatData(userId: string, dataDir: string): Promise<ImportStats> {
  console.log(`[wechat-import] Starting import for user ${userId} from ${dataDir}`);
  const USE_PG = (process.env.STORAGE_BACKEND || '').toLowerCase() === 'pg';
  // 默认关闭双写，避免本地落盘；如需兼容可显式设置为 '1'
  const DUAL_WRITE = (process.env.DUAL_WRITE_SQLITE_WHEN_PG || '0') === '1' && USE_PG;
  
  try {
    if (USE_PG) {
      await ensureUserPg(userId);
    } else {
      ensureUser(userId);
    }
  } catch (e) {
    console.error("[wechat-import] Failed to ensure user:", e);
    throw e;
  }
  
  const patterns = [
    path.join(dataDir, "**/*.txt"),
    path.join(dataDir, "**/*.csv"),
    path.join(dataDir, "**/*.html"),
    path.join(dataDir, "**/*.json"),
    path.join(dataDir, "**/*.xml"),
    path.join(dataDir, "**/*"), // 兜底：包含无扩展名文件
  ];
  
  let entries: string[] = [];
  try {
    entries = await fg(patterns, { 
      dot: false, 
      onlyFiles: true, 
      followSymbolicLinks: false,
      caseSensitiveMatch: false 
    });
    console.log(`[wechat-import] Found ${entries.length} files to process`);
  } catch (e) {
    console.error("[wechat-import] Failed to scan directory:", e);
    throw new Error(`Failed to scan WeChat data directory: ${e}`);
  }
  
  let stats: ImportStats = { files: 0, docs: 0, chunks: 0 };
  let successCount = 0;
  let errorCount = 0;
  let skippedDuplicates = 0;

  for (const file of entries) {
  const ext = path.extname(file).toLowerCase();
    
    try {
      console.log(`[wechat-import] Processing file: ${path.basename(file)}`);
      
      let content = "";
      let title = path.basename(file);
      const source = detectWeChatSource(file);
      const type = ext.replace(".", "");

      // 保留所有文件，不跳过。目录除外。
      const stat = fs.statSync(file);
      if (!stat.isFile()) continue;
      
      // 跳过加密文件and已知的二进制格式
      const filename = path.basename(file).toLowerCase();
      if (filename.endsWith('.enc') || filename.endsWith('.tar.enc') || 
          filename.endsWith('.dat') || filename.endsWith('.db') || 
          filename.endsWith('.sqlite') || filename.endsWith('.wcdb')) {
        console.log(`[wechat-import] Skipping encrypted/binary file: ${filename}`);
        continue;
      }
      
      // 检查是否为二进制文件（在读取前）
      if (seemsBinary(file)) {
        console.log(`[wechat-import] Skipping binary file: ${filename}`);
        continue;
      }

      // 读取文件内容（支持多种编码）
      let raw: string;
      try {
        raw = readFileWithEncoding(file);
        raw = cleanInvalidUtf8(raw);
      } catch (e) {
        console.warn(`[wechat-import] Failed to read file ${file}:`, e);
        errorCount++;
        continue;
      }
      
      // 跳过空文件或过小的文件
      if (!raw || raw.length < 10) {
        console.warn(`[wechat-import] Skipping empty or too small file: ${file}`);
        continue;
      }
      
      // 根据文件类型或内容嗅探解析（媒体文件写入元信息文档）
      const head = raw.slice(0, 64).trim();
      const looksLikeHtml = /^<!DOCTYPE|<html[\s>]/i.test(head);
      const looksLikeXml = /^<\?xml|<msg|<message[\s>]/i.test(head);
      const looksLikeJson = /^[\[{"]/.test(head);
      const looksLikeCsv = /,|;/.test(raw.split(/\r?\n/)[0] || "");

      const lower = file.toLowerCase();
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|heic)$/i.test(lower);
  const isVideo = /\.(mp4|mov|avi|mkv|webm|hevc)$/i.test(lower);
  const isAudio = /\.(mp3|m4a|aac|wav|flac|ogg)$/i.test(lower);

      let mediaSha256: string | undefined;
      if (isImage || isVideo || isAudio) {
        // 使用媒体摘要工具生成可用于 RAG 的文本
        const summary = await summarizeMediaByPath(file);
        content = summary.content;
        // 计算媒体文件 sha256 以便严格去重
        try {
          const buf = fs.readFileSync(file);
          mediaSha256 = crypto.createHash('sha256').update(buf).digest('hex');
        } catch {}
        // 在下面 insertDocument 时合并 metadata
      } else if (ext === ".json" || (ext === "" && looksLikeJson)) {
        try {
          const obj = JSON.parse(raw);
          content = extractWeChatJson(obj);
        } catch (jsonError) {
          console.warn(`[wechat-import] JSON parse failed for ${file}, using raw content`);
          content = raw;
        }
      } else if (ext === ".html" || ext === ".htm" || looksLikeHtml) {
        content = stripHtml(raw);
      } else if (ext === ".xml" || looksLikeXml) {
        // WeChat 有时使用 XML 格式存储消息
        content = stripHtml(raw); // 简单处理，提取文本
      } else if (ext === ".csv" || looksLikeCsv) {
        content = parseWeChatCsv(raw);
      } else if (ext === ".txt" || ext === "") {
        content = parseWeChatTxt(raw);
      } else {
        content = raw;
      }

      // 标准化文本
      content = normalizeText(content);
      
      // 跳过空内容
      if (!content || content.length < 10) {
        console.warn(`[wechat-import] Skipping file with no meaningful content: ${file}`);
        continue;
      }

      // 插入文档（去重：完全相同则跳过）
      const docId = uid("doc");
      try {
        const contentSha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
        const baseMeta: any = { path: file, platform: "wechat", subSource: source, content_sha256: contentSha256 };
        if (mediaSha256) baseMeta.media_sha256 = mediaSha256;

        // 去重判断（优先用媒体hash，否则用内容hash）
        if (USE_PG) {
          let dupId: string | null = null;
          if (mediaSha256) dupId = await findDuplicateDocByMediaHashPg(userId, mediaSha256);
          if (!dupId) dupId = await findDuplicateDocByContentPg(userId, content, 'wechat', type);
          if (dupId) {
            console.log(`[wechat-import] Skip duplicate file: ${file} -> existing doc ${dupId}`);
            skippedDuplicates++;
            stats.files += 1; // 文件处理过
            continue; // 跳过后续 chunking/向量化
          }
        } else {
          // SQLite 回退：直接按内容全等判断
          try {
            const { getDB } = await import('../db');
            const db = getDB();
            const dup = db.prepare(`SELECT id FROM documents WHERE user_id = ? AND content = ? LIMIT 1`).get(userId, content) as any;
            if (dup?.id) {
              console.log(`[wechat-import] Skip duplicate (sqlite): ${file} -> ${dup.id}`);
              skippedDuplicates++;
              stats.files += 1;
              continue;
            }
          } catch {}
        }
        // 如果是媒体文件，并且上面生成了 summary，尝试合并其结构化元数据
        if (isImage || isVideo || isAudio) {
          try {
            const sm = await summarizeMediaByPath(file);
            baseMeta.media = sm.metadata || {};
            // 使用更友好的标题
            title = sm.title || title;
          } catch {}
        }
        if (USE_PG) {
          await insertDocumentPg({
            id: docId,
            user_id: userId,
            source: "wechat",
            type,
            title,
            content,
            metadata: baseMeta,
          });
          if (DUAL_WRITE) {
            // 兼容前端 Memories 读取 SQLite 的路径（临时双写）
            insertDocument({ 
              id: docId, 
              user_id: userId, 
              source: "wechat",
              type, 
              title, 
              content, 
              metadata: baseMeta 
            });
          }
        } else {
          insertDocument({ 
            id: docId, 
            user_id: userId, 
            source: "wechat", // 统一使用 wechat 作为主分类
            type, 
            title, 
            content, 
            metadata: baseMeta 
          });
        }
        stats.docs += 1;
      } catch (dbError) {
        console.error(`[wechat-import] Failed to insert document for ${file}:`, dbError);
        errorCount++;
        continue;
      }

      // 分块and向量化
      try {
        const chunks = chunkText(content, { maxChars: 1200, overlap: 120 });
        
        for (let idx = 0; idx < chunks.length; idx++) {
          const text = chunks[idx];
          const chunkId = uid("chk");
          if (USE_PG) {
            const vec = embedText(text, 1536);
            await insertChunkPg({
              id: chunkId,
              doc_id: docId,
              user_id: userId,
              idx,
              text,
              metadata: { path: file, platform: "wechat" },
              embedding: vec,
            });
            if (DUAL_WRITE) {
              // 双写到 SQLite 以便前端现有页面可见
              insertChunk({ 
                id: chunkId, 
                doc_id: docId, 
                user_id: userId, 
                idx, 
                text, 
                metadata: { path: file, platform: "wechat" } 
              });
              insertVector(chunkId, userId, vec);
            }
          } else {
            insertChunk({ 
              id: chunkId, 
              doc_id: docId, 
              user_id: userId, 
              idx, 
              text, 
              metadata: { path: file, platform: "wechat" } 
            });
            const vec = embedText(text);
            insertVector(chunkId, userId, vec);
          }
          stats.chunks += 1;
        }
      } catch (chunkError) {
        console.error(`[wechat-import] Failed to chunk/vectorize ${file}:`, chunkError);
        errorCount++;
        continue;
      }
      
      stats.files += 1;
      successCount++;
      
    } catch (e) {
      console.error(`[wechat-import] Error processing ${file}:`, e);
      errorCount++;
      continue;
    }
  }

  console.log(`[wechat-import] Import completed: ${successCount} succeeded, ${errorCount} failed, ${skippedDuplicates} skipped (duplicates)`);
  console.log(`[wechat-import] Stats:`, stats);
  
  return stats;
}

/**
 * 检测 WeChat 数据子类型
 */
function detectWeChatSource(filePath: string): string {
  const p = filePath.toLowerCase();
  const filename = path.basename(p);
  
  if (p.includes("chat") || filename.includes("message") || filename.includes("聊天")) return "wechat-chat";
  if (p.includes("moment") || p.includes("timeline") || p.includes("朋友圈")) return "wechat-moments";
  if (p.includes("contact") || filename.includes("通讯录")) return "wechat-contacts";
  if (p.includes("favorite") || p.includes("收藏") || p.includes("fav")) return "wechat-favorites";
  if (p.includes("file") || p.includes("文件")) return "wechat-files";
  
  return "wechat";
}

/**
 * 从 WeChat JSON 对象中提取文本内容
 */
function extractWeChatJson(obj: any): string {
  if (Array.isArray(obj)) {
    return obj.map((x) => extractWeChatJson(x)).filter(x => x).join("\n\n");
  }
  
  if (obj && typeof obj === "object") {
    // WeChat 常见字段
    const contentFields = [
      "content", "text", "message", "msg",
      "title", "description", "nickname", "remark",
      "createTime", "time", "strTime"
    ];
    
    const lines: string[] = [];
    
    // 特殊处理聊天记录格式
    if (obj.talker && obj.content) {
      const time = obj.createTime || obj.time || "";
      lines.push(`[${time}] ${obj.talker}: ${obj.content}`);
      return lines.join("\n");
    }
    
    // 提取指定字段
    for (const field of contentFields) {
      if (obj[field]) {
        const val = obj[field];
        if (typeof val === "string" && val.trim()) {
          lines.push(val.trim());
        } else if (typeof val === "number") {
          // 时间戳转为可读格式
          if (field.includes("time") || field.includes("Time")) {
            const date = new Date(val * (val > 10000000000 ? 1 : 1000));
            lines.push(date.toLocaleString());
          }
        }
      }
    }
    
    if (lines.length) return lines.join("\n");
    
    // 兜底：递归提取所有字符串字段
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && val.trim() && val.length > 2) {
        lines.push(val.trim());
      } else if (Array.isArray(val)) {
        const extracted = extractWeChatJson(val);
        if (extracted) lines.push(extracted);
      } else if (val && typeof val === "object") {
        const extracted = extractWeChatJson(val);
        if (extracted) lines.push(extracted);
      }
    }
    
    return lines.join("\n");
  }
  
  return typeof obj === "string" ? obj.trim() : "";
}

/**
 * 解析 WeChat CSV 格式
 */
function parseWeChatCsv(raw: string): string {
  try {
    // 简单 CSV 解析：提取每行内容
    const lines = raw.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) return "";
    
    // 假设第一行是标题
    const hasHeader = lines[0].includes(',') && (
      lines[0].toLowerCase().includes('time') || 
      lines[0].toLowerCase().includes('message') ||
      lines[0].toLowerCase().includes('sender')
    );
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    // 提取每行的内容（简单处理，按逗号分隔）
    const messages: string[] = [];
    for (const line of dataLines) {
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      // 假设最长的部分是消息内容
      const content = parts.reduce((a, b) => a.length > b.length ? a : b, '');
      if (content && content.length > 3) {
        messages.push(content);
      }
    }
    
    return messages.join("\n");
  } catch (e) {
    console.warn("[wechat-import] CSV parse error:", e);
    return raw;
  }
}

/**
 * 解析 WeChat TXT 格式
 */
function parseWeChatTxt(raw: string): string {
  try {
    // WeChat TXT 通常格式：
    // 时间 [发送者] 内容
    // 或直接就是对话内容
    
    const lines = raw.split(/\r?\n/).filter(line => line.trim());
    const messages: string[] = [];
    
    for (const line of lines) {
      let cleanLine = line.trim();
      
      // 跳过分隔线and无意义的短行
      if (cleanLine.length < 3 || /^[-=_]{3,}$/.test(cleanLine)) {
        continue;
      }
      
      // 尝试提Cancel息内容（去除时间戳等元信息）
      // 格式1: 2024-01-01 12:34:56 [张三] 消息内容
      cleanLine = cleanLine.replace(/^\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}[日]?\s+\d{1,2}:\d{2}(:\d{2})?\s*/g, "");
      
      // 格式2: [Username] 或 Username: 开头
      cleanLine = cleanLine.replace(/^\[([^\]]+)\]\s*[:：]?\s*/g, "$1: ");
      
      // 格式3: 时间戳 (Unix timestamp)
      cleanLine = cleanLine.replace(/^\d{10,13}\s+/g, "");
      
      if (cleanLine && cleanLine.length > 3) {
        messages.push(cleanLine);
      }
    }
    
    return messages.join("\n");
  } catch (e) {
    console.warn("[wechat-import] TXT parse error:", e);
    return raw;
  }
}
