/**
 * Unified Data Importer Coordinator
 * 统一数据导入协调器 - Auto识别数据源并调用相应的导入器
 */
import fs from "fs";
import path from "path";
import { importGoogleTakeout } from "./google";
import { importWeChatData } from "./wechat";
import { importInstagramData } from "./instagram";

export type DataSource = "google" | "wechat" | "instagram" | "unknown";

export type ImportStats = { 
  files: number; 
  docs: number; 
  chunks: number;
  source: DataSource;
};

/**
 * 检测数据源类型
 */
export function detectDataSource(extractedDir: string): DataSource {
  try {
  const entries = fs.readdirSync(extractedDir, { withFileTypes: true });
    const files = entries.filter(e => e.isFile()).map(e => e.name.toLowerCase());
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name.toLowerCase());
    
    // 检查 Instagram 特征
    // Instagram 导出包含: messages, posts, stories, media, followers_and_following 等目录
    const instagramDirs = ["messages", "posts", "stories", "media", "comments"];
    const instagramFiles = ["account_information", "profile", "followers", "following"];
    
    const hasInstagramDirs = instagramDirs.some(dir => dirs.includes(dir));
    const hasInstagramFiles = instagramFiles.some(file => 
      files.some(f => f.includes(file))
    );
    
    if (hasInstagramDirs || hasInstagramFiles) {
      console.log("[detect] Detected Instagram data source");
      return "instagram";
    }
    
  // 检查 WeChat 特征
  // WeChat 导出通常包含: chat, message, contact, moment, ChatPackage, Index 等关键词
  const wechatKeywords = ["wechat", "weixin", "WeChat", "chat", "message", "chatpackage", "index", "mm.sqlite", "wcdb", "microMsg", "msg.db"]; 
    const hasWeChatIndicator = dirs.some(dir => 
      wechatKeywords.some(kw => dir.includes(kw))
    ) || files.some(file => 
      wechatKeywords.some(kw => file.includes(kw))
    );
    
    if (hasWeChatIndicator) {
      console.log("[detect] Detected WeChat data source");
      return "wechat";
    }
    
    // 检查 Google Takeout 特征
    // Google Takeout 通常包含: Gmail, Drive, Calendar, Photos, YouTube 等目录
    const googleDirs = ["gmail", "drive", "calendar", "youtube", "photos", "chrome", "maps", "search"];
    const hasGoogleDirs = googleDirs.some(dir => dirs.includes(dir));
    
    // 检查是否有 Takeout 目录
    const hasTakeoutDir = dirs.includes("takeout");
    
    if (hasGoogleDirs || hasTakeoutDir) {
      console.log("[detect] Detected Google Takeout data source");
      return "google";
    }
    
  // 深度检查：读取一些文件内容（顶层）
    for (const file of files.slice(0, 5)) {
      if (file.endsWith(".json")) {
        try {
          const filePath = path.join(extractedDir, file);
          const content = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(content);
          
          // Instagram JSON 通常有 media, participants, timestamp_ms 等字段
          if (data.participants || data.messages || data.media) {
            console.log("[detect] Detected Instagram via JSON content");
            return "instagram";
          }
          
          // Google JSON 通常有特定的结构
          if (data.kind && data.kind.includes("gmail")) {
            console.log("[detect] Detected Google via JSON content");
            return "google";
          }
        } catch {
          // 解析失败，继续
        }
      }
    }
    
    // 递归深度检查（最多搜索到 3 层目录）
    const maxDepth = 3;
    const queue: string[] = dirs.map((d) => path.join(extractedDir, d));
    let depth = 0;
    while (queue.length && depth < maxDepth) {
      const levelSize = queue.length;
      for (let i = 0; i < levelSize; i++) {
        const dirPath = queue.shift()!;
        let dirents: fs.Dirent[] = [];
        try {
          dirents = fs.readdirSync(dirPath, { withFileTypes: true });
        } catch {}
        const subFiles = dirents.filter(e => e.isFile()).map(e => e.name.toLowerCase());
        const subDirs = dirents.filter(e => e.isDirectory()).map(e => e.name.toLowerCase());

        const joinedNames = [...subFiles, ...subDirs].join(' ');
        const wechatKeywords = ["wechat", "weixin", "WeChat", "chat", "message", "chatpackage", "index", "mm.sqlite", "wcdb", "micromsg", "msg.db"]; 
        if (wechatKeywords.some(kw => joinedNames.includes(kw))) {
          console.log("[detect] Detected WeChat via deep scan");
          return "wechat";
        }
        const instagramHit = ["messages", "posts", "stories", "media", "comments"].some((k) => subDirs.includes(k));
        if (instagramHit) {
          console.log("[detect] Detected Instagram via deep scan");
          return "instagram";
        }
        const googleHit = ["gmail", "drive", "calendar", "youtube", "photos", "chrome", "maps", "search", "takeout"].some((k) => subDirs.includes(k));
        if (googleHit) {
          console.log("[detect] Detected Google via deep scan");
          return "google";
        }

        // 加入下一层目录
        for (const sd of subDirs) queue.push(path.join(dirPath, sd));
      }
      depth++;
    }

    console.log("[detect] Unknown data source, defaulting to Google");
    return "unknown";
  } catch (error) {
    console.error("[detect] Error detecting data source:", error);
    return "unknown";
  }
}

/**
 * 统一导入入口
 */
export async function importUnifiedData(
  userId: string, 
  extractedDir: string,
  sourceHint?: DataSource
): Promise<ImportStats> {
  // 使用提供的 hint 或Auto检测
  const source = sourceHint || detectDataSource(extractedDir);
  
  console.log(`[import] Starting import for source: ${source}`);
  
  let stats: Omit<ImportStats, "source">;
  
  switch (source) {
    case "instagram":
      stats = await importInstagramData(userId, extractedDir);
      break;
      
    case "wechat":
      stats = await importWeChatData(userId, extractedDir);
      break;
      
    case "google":
      stats = await importGoogleTakeout(userId, extractedDir);
      break;
      
    case "unknown":
    default:
      // 尝试通用导入（使用 Google 导入器作为 fallback）
      console.warn("[import] Unknown source, trying generic import");
      stats = await importGoogleTakeout(userId, extractedDir);
      break;
  }
  
  return {
    ...stats,
    source
  };
}
