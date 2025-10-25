/**
 * Instagram Data Importer
 * 支持解析 Instagram 导出的帖子、消息、故事、媒体等
 */
import fg from "fast-glob";
import fs from "fs";
import path from "path";
import { ensureUser, insertDocument, insertChunk, insertVector, getDB } from "../db";
import { stripHtml, normalizeText } from "../utils/text";
import { chunkText } from "../pipeline/chunk";
import { embedText } from "../pipeline/embeddings";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

type ImportStats = { files: number; docs: number; chunks: number };

export async function importInstagramData(userId: string, dataDir: string): Promise<ImportStats> {
  ensureUser(userId);
  
  // Instagram 导出通常是 JSON 格式
  const patterns = [
    path.join(dataDir, "**/*.{json,html,txt}")
  ];
  
  const entries = await fg(patterns, { dot: false, onlyFiles: true, followSymbolicLinks: false });
  let stats: ImportStats = { files: 0, docs: 0, chunks: 0 };

  for (const file of entries) {
    stats.files += 1;
    const ext = path.extname(file).toLowerCase();
    
    try {
      let content = "";
      let title = path.basename(file);
      const source = detectInstagramSource(file);
      const type = ext.replace(".", "");

      const raw = fs.readFileSync(file, "utf8");
      let parsedJson: any = null;
      let formattedText = "";
      
      if (ext === ".json") {
        try {
          parsedJson = JSON.parse(raw);
          formattedText = extractInstagramJson(parsedJson);
          // ✅ Save原始 JSON 结构到 content，格式化文本到 metadata
          content = raw; // Save原始 JSON 字符串
        } catch {
          // keep raw on parse failure
          content = raw;
        }
      } else if (ext === ".html") {
        content = stripHtml(raw);
      } else {
        content = raw;
      }

      // 只对非 JSON 文件进行 normalize
      if (ext !== ".json") {
        content = normalizeText(content);
      }
      if (!content) continue;

      const docId = uid("doc");
      // 导入前去重：SQLite 路径直接按内容全等（JSON 使用原始字符串，其他类型使用 normalize 后的文本）
      try {
        const db = getDB();
        const dup = db.prepare(`SELECT id FROM documents WHERE user_id = ? AND content = ? LIMIT 1`).get(userId, content) as any;
        if (dup?.id) {
          // skip duplicate
          continue;
        }
      } catch {}
      // 为 title 添加明确的来源标识，便于 AI 识别
      const displayTitle = source === "instagram-messages" 
        ? `Instagram Message: ${title}`
        : `Instagram ${source.replace("instagram-", "")}: ${title}`;
      
      insertDocument({ 
        id: docId, 
        user_id: userId, 
        source: "instagram", // 统一使用 instagram 作为主分类
        type, 
        title: displayTitle, 
        content, // ✅ JSON 文件Save原始 JSON，其他文件Save文本
        metadata: { 
          path: file, 
          platform: "Instagram", 
          subSource: source, 
          dataSource: "Instagram Export",
          isJson: ext === ".json", // 标记是否为 JSON 格式
          formattedText: formattedText || undefined, // Save格式化的人类可读文本
          hasMessages: parsedJson?.messages ? true : false, // 标记是否包含消息数据
          participantCount: parsedJson?.participants?.length || undefined
        } 
      });
      stats.docs += 1;

      // ✅ 对于 JSON 文件，使用格式化文本进行 chunking；其他文件使用原始 content
      const textForChunking = (ext === ".json" && formattedText) ? formattedText : content;
      const chunks = chunkText(textForChunking, { maxChars: 1200, overlap: 120 });
      chunks.forEach((text, idx) => {
        const chunkId = uid("chk");
        insertChunk({ 
          id: chunkId, 
          doc_id: docId, 
          user_id: userId, 
          idx, 
          text, 
          metadata: { 
            path: file, 
            platform: "Instagram", 
            source: "instagram",
            dataSource: "Instagram Export",
            subSource: source 
          } 
        });
        // ✅ 重要：生成并插入向量（修复向量化流程）
        const vec = embedText(text);
        insertVector(chunkId, userId, vec);
        stats.chunks += 1;
      });
    } catch (e) {
      console.warn(`[instagram-import] skip ${file}:`, e);
      continue;
    }
  }

  return stats;
}

function detectInstagramSource(filePath: string): string {
  const p = filePath.toLowerCase();
  const filename = path.basename(p);
  
  // Instagram 数据导出的典型目录结构
  if (p.includes("messages") || p.includes("direct") || filename.includes("message")) {
    return "instagram-messages";
  }
  if (p.includes("posts") || p.includes("media") || filename.includes("posts")) {
    return "instagram-posts";
  }
  if (p.includes("stories") || filename.includes("stories")) {
    return "instagram-stories";
  }
  if (p.includes("comments") || filename.includes("comments")) {
    return "instagram-comments";
  }
  if (p.includes("liked") || p.includes("saved")) {
    return "instagram-liked";
  }
  if (p.includes("followers") || p.includes("following")) {
    return "instagram-connections";
  }
  if (p.includes("profile")) {
    return "instagram-profile";
  }
  
  return "instagram";
}

export function extractInstagramJson(obj: any): string {
  if (Array.isArray(obj)) {
    return obj.map((x) => extractInstagramJson(x)).join("\n\n");
  }
  
  if (obj && typeof obj === "object") {
    const lines: string[] = [];
    
    // Instagram 帖子格式
    if (obj.media) {
      // 这是一个包含多个帖子的对象
      return extractInstagramJson(obj.media);
    }
    
    // 单个帖子
    if (obj.caption) {
      lines.push(`Caption: ${obj.caption}`);
    }
    
    // 消息格式
    if (obj.participants && obj.messages) {
      // participants can be objects: { name: "..." }
      const participants = Array.isArray(obj.participants)
        ? obj.participants
            .map((p: any) => (typeof p === "string" ? p : p?.name || p?.username))
            .filter(Boolean)
        : [];
      lines.push(`Conversation with: ${participants.length ? participants.join(", ") : "Unknown"}`);
      if (Array.isArray(obj.messages)) {
        // Sort messages chronologically (oldest first)
        const sortedMessages = [...obj.messages].sort((a, b) => 
          (a.timestamp_ms || 0) - (b.timestamp_ms || 0)
        );
        
        for (const msg of sortedMessages) {
          const sender = msg.sender_name || msg.actor || "Unknown";
          let content = "";
          
          // Instagram export sometimes uses arrays for text/content parts
          if (typeof msg.content === "string") content = msg.content;
          else if (Array.isArray(msg.content)) content = msg.content.map((x: any) => (typeof x === "string" ? x : x?.text || "")).join(" ");
          else if (typeof msg.text === "string") content = msg.text;
          else if (Array.isArray(msg.text)) content = msg.text.map((x: any) => (typeof x === "string" ? x : x?.text || "")).join(" ");

          // Handle share/link
          if (!content && msg.share) {
            const link = msg.share.link || msg.share.original_content_url || "";
            if (link) content = `[shared: ${link}]`;
          }

          // Attachments summary
          if (!content && Array.isArray(msg.attachments) && msg.attachments.length) {
            const att = msg.attachments
              .map((a: any) => a?.file || a?.uri || a?.link || a?.type)
              .filter(Boolean)
              .slice(0, 3)
              .join(", ");
            if (att) content = `[attachments: ${att}]`;
          }
          
          // Reactions
          const reactions = Array.isArray(msg.reactions) 
            ? msg.reactions.map((r: any) => r.reaction || r.emoji).filter(Boolean).join(" ")
            : "";
          
          const timestamp = msg.timestamp_ms 
            ? new Date(msg.timestamp_ms).toLocaleString() 
            : "";
          
          if (content) {
            const line = `[${timestamp}] ${sender}: ${content}`;
            lines.push(reactions ? `${line} ${reactions}` : line);
          }
        }
      }
    }
    
    // 单条消息
    if (obj.sender_name && (obj.content || obj.text)) {
      const sender = obj.sender_name;
      const content = typeof obj.content === "string" ? obj.content : (typeof obj.text === "string" ? obj.text : "");
      const timestamp = obj.timestamp_ms 
        ? new Date(obj.timestamp_ms).toLocaleString() 
        : "";
      lines.push(`[${timestamp}] ${sender}: ${content}`);
    }
    
    // 通用内容提取
    const contentFields = [
      "title", "text", "content", "description", 
      "caption", "story_text", "name", "username"
    ];
    
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === "string") {
        lines.push(`${field}: ${obj[field]}`);
      }
      if (Array.isArray(obj[field])) {
        const s = obj[field]
          .map((x: any) => (typeof x === "string" ? x : x?.text || x?.name || ""))
          .filter(Boolean)
          .join(" ");
        if (s) lines.push(`${field}: ${s}`);
      }
    }
    
    // 提取时间信息
    if (obj.taken_at) {
      const date = new Date(obj.taken_at * 1000).toLocaleString();
      lines.push(`Date: ${date}`);
    }
    
    if (lines.length) return lines.join("\n");
    
    // 兜底：提取所有简单字段
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === "string" && val.length > 0 && val.length < 1000) {
        lines.push(`${key}: ${val}`);
      } else if (typeof val === "number") {
        lines.push(`${key}: ${val}`);
      }
    }
    
    if (lines.length) return lines.join("\n");
  }
  
  return typeof obj === "string" ? obj : JSON.stringify(obj);
}
