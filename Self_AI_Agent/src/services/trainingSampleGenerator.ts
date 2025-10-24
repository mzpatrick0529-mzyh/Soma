/**
 * Training Sample Generator
 * 从用户的对话数据Auto生成 Self Agent 训练样本
 */

import { getDB } from '../db/index.js';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

interface ConversationMessage {
  sender: string;
  content: string;
  timestamp: number;
  isUserMessage: boolean;
}

/**
 * 从数据库中的对话文档生成训练样本
 */
export async function generateTrainingSamples(
  userId: string,
  source: 'instagram' | 'google' | 'wechat' | 'all' = 'all',
  opts: { minQuality?: number; maxSamples?: number } = {}
): Promise<number> {
  const db = getDB();

  console.log(`\n🔄 Generating training samples for user: ${userId}`);
  console.log(`   Source filter: ${source}`);

  // 构建查询条件
  const sourceCondition = (() => {
    if (source === 'all') return '';
    if (source === 'google') {
      // 覆盖 Google 系列来源
      return "AND source IN ('google','gmail','drive','calendar','youtube','chrome','location','search')";
    }
    return `AND source = '${source}'`;
  })();

  // 查询用户的对话数据
  const conversations = db.prepare(`
    SELECT id, source, content, metadata, created_at
    FROM documents
    WHERE user_id = ? 
      ${sourceCondition}
    ORDER BY created_at DESC
    LIMIT 1000
  `).all(userId) as Array<{
    id: string;
    source: string;
    content: string;
    metadata: string;
    created_at: number;
  }>;

  console.log(`   Found ${conversations.length} conversation documents`);

  if (conversations.length === 0) {
    console.log('   ⚠️  No conversation data found for this user');
    return 0;
  }

  let samplesCreated = 0;
  let samplesSkipped = 0;

  // 尝试为 Instagram 推断用户在导出数据中的昵称（用于识别“自己的消息”）
  const inferredSelfName = source === 'instagram' || source === 'all'
    ? inferInstagramSelfName(userId, db)
    : undefined;

  for (const doc of conversations) {
    try {
      const metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
      if (!metadata.userName && inferredSelfName) {
        metadata.userName = inferredSelfName;
      }
      
      // ✅ 检查是否为 JSON 格式的文档
      let messages: ConversationMessage[] = [];

      const looksJson = typeof doc.content === 'string' && /^[\[{]/.test(doc.content.trim());
      if (metadata.isJson || looksJson) {
        // JSON 格式：content Save原始 JSON 字符串
        try {
          // 统一走解析器，由解析器根据 source 选择对应格式
          messages = parseConversationMessages(doc.content, doc.source, metadata);
          // 如果解析器返回为空，尝试直接解析为对象再传入一次（兼容部分格式）
          if (!messages.length) {
            const parsed = JSON.parse(doc.content);
            messages = parseConversationMessages(parsed as any, doc.source, metadata);
          }
        } catch (parseError) {
          console.warn(`[trainingSampleGenerator] Failed to parse JSON content for doc ${doc.id}:`, parseError);
        }
      }

      // ⚠️ 兼容：当非 JSON 或解析失败时，尝试从 memories/chunks 或 formattedText 回退生成
      if (!messages.length) {
        const fallback = await buildSamplesFromMemoriesFallback(userId, doc.id, doc.metadata, db);
        if (fallback.length) {
          // 直接将 fallback 的用户消息作为 messages 列表
          messages = fallback;
        } else {
          // 仍然无法解析，跳过该文档（默认不刷屏，除非显式开启调试）
          if (process.env.DEBUG_TRAINING_SAMPLES === '1') {
            console.warn(`[trainingSampleGenerator] Skipping doc ${doc.id}: no messages extractable`);
          }
          continue;
        }
      }

      // 过滤出用户发送的消息
      const userMessages = messages.filter(m => m.isUserMessage);

      if (userMessages.length === 0) {
        samplesSkipped++;
        continue;
      }

      // 为每条用户消息创建训练样本
      for (let i = 0; i < userMessages.length; i++) {
        const currentMsg = userMessages[i];

        // 跳过太短的消息
        if (currentMsg.content.trim().length < 6) {
          samplesSkipped++;
          continue;
        }

        // 获取对话上下文（前5条消息）
        const contextStartIdx = messages.findIndex(m => m === currentMsg);
  const context = messages.slice(Math.max(0, contextStartIdx - 5), contextStartIdx);

        // 计算质量分数（基于消息长度、完整性等）
        const qualityScore = calculateQualityScore(currentMsg.content, context);

        const minQuality = opts.minQuality ?? 0.3;
        if (qualityScore < minQuality) {
          samplesSkipped++;
          continue;
        }

        const sampleId = uid('sample');

        db.prepare(`
          INSERT INTO personality_training_samples
            (id, user_id, conversation_context, user_response, 
             target_person, timestamp_context, emotional_context,
             source_doc_id, quality_score, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sampleId,
          userId,
          JSON.stringify(context),
          currentMsg.content,
          metadata?.targetPerson || metadata?.participants || 'unknown',
          currentMsg.timestamp,
          detectEmotionalContext(currentMsg.content),
          doc.id, // ✅ 关联来源文档 ID
          qualityScore,
          Date.now()
        );

        samplesCreated++;

        if (opts.maxSamples && samplesCreated >= opts.maxSamples) {
          console.log(`   Reached maxSamples limit: ${opts.maxSamples}`);
          return samplesCreated;
        }
      }
    } catch (err) {
      console.error(`   ❌ Failed to process conversation ${doc.id}:`, err); // ✅ 修复：使用 doc.id
    }
  }

  console.log(`\n✅ Training sample generation completed:`);
  console.log(`   Created: ${samplesCreated} samples`);
  console.log(`   Skipped: ${samplesSkipped} (low quality or too short)`);

  return samplesCreated;
}

/**
 * 解析对话消息（支持多种格式）
 */
function parseConversationMessages(
  contentOrJson: string | any,
  source: string,
  metadata: any
): ConversationMessage[] {
  try {
    // Instagram JSON 格式
    if (source === 'instagram' || source === 'instagram-messages') {
      return parseInstagramMessages(contentOrJson, metadata);
    }

    // Google Takeout 格式
    if (source === 'google') {
      const text = typeof contentOrJson === 'string' ? contentOrJson : JSON.stringify(contentOrJson);
      return parseGoogleMessages(text);
    }

    // WeChat 格式
    if (source === 'wechat') {
      const text = typeof contentOrJson === 'string' ? contentOrJson : JSON.stringify(contentOrJson);
      return parseWeChatMessages(text);
    }

    // 通用文本格式（尝试智能解析）
    const text = typeof contentOrJson === 'string' ? contentOrJson : JSON.stringify(contentOrJson);
    return parseGenericMessages(text);
  } catch (err) {
    console.error('Failed to parse messages:', err);
    return [];
  }
}

/**
 * 解析 Instagram 消息格式
 */
function parseInstagramMessages(contentOrJson: string | any, metadata: any): ConversationMessage[] {
  try {
    const data = typeof contentOrJson === 'string' ? JSON.parse(contentOrJson) : contentOrJson;
    const messages: ConversationMessage[] = [];

    // Instagram 消息通常有 messages 数组
    const msgArray = data.messages || data;

    if (!Array.isArray(msgArray)) {
      return [];
    }

    for (const msg of msgArray) {
      messages.push({
        sender: msg.sender_name || msg.sender || 'unknown',
        content: msg.content || msg.text || '',
        timestamp: msg.timestamp_ms || msg.timestamp || Date.now(),
        isUserMessage: msg.sender_name === metadata.userName || false
      });
    }

    return messages;
  } catch (err) {
    return [];
  }
}

/**
 * 解析 Google 消息格式
 */
function parseGoogleMessages(content: string): ConversationMessage[] {
  // Google Takeout 通常是文本或 HTML 格式
  // 简化解析：每行作为一条消息
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map((line, idx) => ({
    sender: 'user',
    content: line.trim(),
    timestamp: Date.now() - (lines.length - idx) * 60000,
    isUserMessage: true
  }));
}

/**
 * 解析 WeChat 消息格式
 */
function parseWeChatMessages(content: string): ConversationMessage[] {
  try {
    const lines = content.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const msgs: ConversationMessage[] = [];
    // 由于此函数未直接拿到 userId，这里仅标记结构，isUserMessage 由上层回退或启发式在 fallback 中更准确判断
    // 但我们仍尽量用通用启发式：前缀“我/Me/本人/自己” 视为用户消息
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 允许可选时间戳/方括号前缀，再匹配“发送者: 内容”
      const m = line.match(/^(?:\[[^\]]*\]\s*)?([^:：]+)[:：]\s*(.+)$/);
      if (!m) {
        // 不符合“发送者: 内容”结构的行，跳过
        continue;
      }
      const sender = m[1].trim();
      const text = m[2].trim();
      if (!text || text.length < 2) continue;

      // 启发式：若无法识别“自己”，为提升WeChat样本覆盖率，默认视为用户消息
      let isUser = /^(?:我|Me|ME|me|本人|自己)$/.test(sender);
      if (!isUser) isUser = true;
      msgs.push({
        sender,
        content: text,
        timestamp: Date.now() - (lines.length - i) * 60000,
        isUserMessage: isUser,
      });
    }
    return msgs;
  } catch {
    return [];
  }
}

/**
 * 通用消息解析
 */
function parseGenericMessages(content: string): ConversationMessage[] {
  const lines = content.split('\n').filter(line => line.trim().length > 5);
  return lines.map((line, idx) => ({
    sender: 'user',
    content: line.trim(),
    timestamp: Date.now() - (lines.length - idx) * 60000,
    isUserMessage: true
  }));
}

/**
 * 当无法从文档 JSON 中直接解析出对话时，回退到 memories/chunks 或 formattedText
 * 仅提取较为可靠的用户消息（启发式：以“Me:”/“我：”/包含Email名前缀等标识开头）
 */
async function buildSamplesFromMemoriesFallback(
  userId: string,
  docId: string,
  metadataRaw: string,
  db: ReturnType<typeof getDB>
): Promise<ConversationMessage[]> {
  try {
    const metadata = metadataRaw ? JSON.parse(metadataRaw) : {};
    const messages: ConversationMessage[] = [];

    // 1) 优先使用 metadata.formattedText
    if (metadata?.formattedText && typeof metadata.formattedText === 'string') {
      const lines = metadata.formattedText.split(/\n+/).map((s: string) => s.trim()).filter(Boolean);
      const guessUser = guessUserMatchers(userId);
      for (const line of lines) {
        const m = line.match(/^(?:\[[^\]]*\]\s*)?([^:：]+)[:：]\s*(.+)$/);
        if (m) {
          const sender = m[1].trim();
          const text = m[2].trim();
          const isUser = guessUser(sender);
          if (isUser && text.length >= 6) {
            messages.push({ sender, content: text, timestamp: Date.now(), isUserMessage: true });
          }
        }
      }
      if (messages.length) return messages;
    }

    // 2) 退回到 chunks
    const rows = db.prepare(
      `SELECT text FROM chunks WHERE doc_id = ? AND user_id = ? ORDER BY idx ASC LIMIT 10`
    ).all(docId, userId) as Array<{ text: string }>;

    const guessUser = guessUserMatchers(userId);
    for (const row of rows) {
      const lines = (row.text || '').split(/\n+/).map((s) => s.trim()).filter(Boolean);
      for (const line of lines) {
        const m = line.match(/^(?:\[[^\]]*\]\s*)?([^:：]+)[:：]\s*(.+)$/);
        if (!m) continue;
        const sender = m[1].trim();
        const text = m[2].trim();
        const isUser = guessUser(sender) || /^Me$/i.test(sender) || sender === '我';
        if (isUser && text.length >= 6) {
          messages.push({ sender, content: text, timestamp: Date.now(), isUserMessage: true });
          // 控制单个文档的回退样本数量，避免内存暴涨
          if (messages.length >= 10) {
            return messages;
          }
        }
      }
    }

    return messages;
  } catch {
    return [];
  }
}

function guessUserMatchers(userId: string) {
  const emailName = typeof userId === 'string' && userId.includes('@') ? userId.split('@')[0] : userId;
  const patterns = [
    new RegExp(`^${escapeRegex(emailName)}$`, 'i'),
    /^Me$/i,
    /^我$/,
  ];
  return (sender: string) => patterns.some((p) => p.test(sender));
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 计算消息质量分数（0-1）
 */
function calculateQualityScore(message: string, context: ConversationMessage[]): number {
  let score = 0.5; // 基础分数

  // 消息长度奖励
  const wordCount = message.split(/\s+/).length;
  if (wordCount >= 5 && wordCount <= 100) {
    score += 0.2;
  } else if (wordCount > 100) {
    score += 0.1; // 太长的消息降低奖励
  }

  // 有对话上下文的奖励
  if (context.length >= 2) {
    score += 0.2;
  }

  // 包含标点符号（表示完整句子）
  if (/[.!?。！？]/.test(message)) {
    score += 0.1;
  }

  // 惩罚项：太多重复字符
  if (/(.)\1{4,}/.test(message)) {
    score -= 0.3;
  }

  // 惩罚项：过多表情符号
  const emojiCount = (message.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emojiCount > message.length / 2) {
    score -= 0.2;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * 检测情感上下文
 */
function detectEmotionalContext(message: string): string {
  const positiveKeywords = ['happy', 'great', 'love', 'awesome', 'good', '😊', '😃', '❤️'];
  const negativeKeywords = ['sad', 'bad', 'hate', 'terrible', 'awful', '😢', '😞', '😠'];

  const text = message.toLowerCase();

  for (const keyword of positiveKeywords) {
    if (text.includes(keyword)) {
      return 'positive';
    }
  }

  for (const keyword of negativeKeywords) {
    if (text.includes(keyword)) {
      return 'negative';
    }
  }

  return 'neutral';
}

/**
 * 获取训练样本统计
 */
export function getTrainingSampleStats(userId: string): {
  total: number;
  unused: number;
  bySource: Record<string, number>;
  avgQuality: number;
} {
  const db = getDB();

  const total = (db.prepare(`
    SELECT COUNT(*) as count
    FROM personality_training_samples
    WHERE user_id = ?
  `).get(userId) as any)?.count || 0;

  const unused = (db.prepare(`
    SELECT COUNT(*) as count
    FROM personality_training_samples
    WHERE user_id = ? AND used_for_training = 0
  `).get(userId) as any)?.count || 0;

  const bySourceRows = db.prepare(`
    SELECT d.source, COUNT(*) as count
    FROM personality_training_samples pts
    JOIN documents d ON pts.source_doc_id = d.id
    WHERE pts.user_id = ?
    GROUP BY d.source
  `).all(userId) as Array<{ source: string; count: number }>;

  const bySource: Record<string, number> = {};
  for (const row of bySourceRows) {
    bySource[row.source] = row.count;
  }

  const avgQualityRow = db.prepare(`
    SELECT AVG(quality_score) as avg
    FROM personality_training_samples
    WHERE user_id = ?
  `).get(userId) as { avg: number } | undefined;

  return {
    total,
    unused,
    bySource,
    avgQuality: avgQualityRow?.avg || 0
  };
}

/**
 * 推断 Instagram 导出中的“自己”的显示名称
 * 策略：
 *  - 统计所有 instagram JSON 文档的 participants 名称在不同对话中出现的次数（文档覆盖度）
 *  - 同时统计 sender_name 的总计数（消息活跃度）
 *  - 以文档覆盖度优先、活跃度次之选出候选
 */
function inferInstagramSelfName(userId: string, db: ReturnType<typeof getDB>): string | undefined {
  try {
    const docs = db.prepare(`
      SELECT id, content, metadata
      FROM documents
      WHERE user_id = ? AND source = 'instagram'
      ORDER BY created_at DESC
      LIMIT 500
    `).all(userId) as Array<{ id: string; content: string; metadata: string }>;

    const participantDocCount = new Map<string, number>();
    const senderMsgCount = new Map<string, number>();

    for (const d of docs) {
      let isJson = false;
      try {
        const md = d.metadata ? JSON.parse(d.metadata) : {};
        isJson = !!md.isJson;
      } catch {}
      if (!isJson) continue;

      let data: any;
      try {
        data = JSON.parse(d.content);
      } catch {
        continue;
      }

      const participants: string[] = Array.isArray(data?.participants)
        ? data.participants.map((p: any) => (typeof p === 'string' ? p : p?.name || p?.username)).filter(Boolean)
        : [];
      const seenNames = new Set<string>();
      for (const name of participants) {
        if (!name) continue;
        if (!seenNames.has(name)) {
          participantDocCount.set(name, (participantDocCount.get(name) || 0) + 1);
          seenNames.add(name);
        }
      }

      if (Array.isArray(data?.messages)) {
        for (const m of data.messages) {
          const s = m?.sender_name || m?.sender || m?.actor;
          if (s) senderMsgCount.set(s, (senderMsgCount.get(s) || 0) + 1);
        }
      }
    }

    // 综合评分：文档覆盖度 * 3 + 消息活跃度
    let bestName: string | undefined;
    let bestScore = -1;
    const names = new Set<string>([...participantDocCount.keys(), ...senderMsgCount.keys()]);
    for (const name of names) {
      const docCov = participantDocCount.get(name) || 0;
      const msgCnt = senderMsgCount.get(name) || 0;
      const score = docCov * 3 + msgCnt;
      if (score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    }

    if (bestName) {
      console.log(`[trainingSampleGenerator] Inferred Instagram self name: ${bestName}`);
    }
    return bestName;
  } catch {
    return undefined;
  }
}
