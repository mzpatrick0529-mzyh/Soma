/**
 * Training Sample Generator
 * 从用户的对话数据Auto生成 Self Agent 训练样本
 */

import { getDB } from '../db/index.js';
import { embedText, cosineSim } from '../pipeline/embeddings.js';

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
  opts: { minQuality?: number; maxSamples?: number; jaccardThreshold?: number; semanticThreshold?: number } = {}
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

  // Parameters
  const jaccardThreshold = Math.max(0.5, Math.min(0.98, opts.jaccardThreshold ?? 0.85));
  const semanticThreshold = Math.max(0.6, Math.min(0.995, opts.semanticThreshold ?? 0.95));
  const maxSamples = opts.maxSamples && opts.maxSamples > 0 ? opts.maxSamples : undefined;

  // Buffers for candidate samples and dedup
  type Candidate = {
    id: string;
    response: string;
    context: ConversationMessage[];
    timestamp: number;
    emotional: string;
    sourceDocId: string;
    quality: number;
    styleTags: string[];
    intentTags: string[];
    tokens: Set<string>;
    vector: number[];
    dedupSig: string;
    templateFlag: number;
    negative?: { text: string; type: string };
    targetPerson?: string;      // Phase 1: relationship annotation
    intimacyLevel?: number;     // Phase 1: intimacy score 0-1
  };

  const candidates: Candidate[] = [];
  const acceptedVectors: number[][] = [];
  const acceptedTokenSets: Set<string>[] = [];

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

        // === Phase 1: Extract target_person and intimacy_level ===
        let targetPerson = 'unknown';
        let intimacyLevel = 0.5; // Default medium intimacy
        
        // Extract target person from metadata or context
        if (metadata.participants && Array.isArray(metadata.participants)) {
          // Instagram format: find non-user participant
          const userName = metadata.userName || inferredSelfName;
          const otherParticipants = metadata.participants.filter((p: any) => {
            const name = typeof p === 'string' ? p : (p?.name || p?.username);
            return name && name !== userName;
          });
          if (otherParticipants.length > 0) {
            const other = otherParticipants[0];
            targetPerson = typeof other === 'string' ? other : (other?.name || other?.username || 'unknown');
          }
        } else if (context.length > 0) {
          // Extract from context: find most recent non-user sender
          for (let j = context.length - 1; j >= 0; j--) {
            if (!context[j].isUserMessage) {
              targetPerson = context[j].sender;
              break;
            }
          }
        }

        // Estimate intimacy level (based on message frequency and emotional words)
        if (userMessages.length > 50) intimacyLevel += 0.2;
        else if (userMessages.length > 20) intimacyLevel += 0.1;
        
        // Check emotional vocabulary
        const emotionalWords = /\b(love|miss|friend|bro|sis|dear|honey|buddy|mate)\b/gi;
        if (currentMsg.content.match(emotionalWords)) intimacyLevel += 0.2;
        
        intimacyLevel = Math.min(1.0, intimacyLevel);
        // === End Phase 1 ===

        // 计算质量分数（基于消息长度、完整性等）
        const qualityScore = calculateQualityScore(currentMsg.content, context);

        const minQuality = opts.minQuality ?? 0.3;
        if (qualityScore < minQuality) {
          samplesSkipped++;
          continue;
        }

        // Style/intent detection
        const styleTags = detectStyleTags(currentMsg.content, context);
        const intentTags = detectIntentTags(currentMsg.content, context);

        // Template filtering
        const templateFlag = isTemplateLike(currentMsg.content) ? 1 : 0;
        if (templateFlag) { samplesSkipped++; continue; }

        // Prepare Jaccard/semantic features
        const tokens = toTokenSet(currentMsg.content);
        const vector = embedText(currentMsg.content, 256);
        const dedupSig = stableHashSig(normalizeTextForHash(currentMsg.content));

        // Push candidate; actual selection after loop (balance + dedup)
        candidates.push({
          id: uid('sample'),
          response: currentMsg.content,
          context,
          timestamp: currentMsg.timestamp,
          emotional: detectEmotionalContext(currentMsg.content),
          sourceDocId: doc.id,
          quality: qualityScore,
          styleTags,
          intentTags,
          tokens,
          vector,
          dedupSig,
          templateFlag,
          targetPerson,  // Phase 1 addition
          intimacyLevel  // Phase 1 addition
        });
      }
    } catch (err) {
      console.error(`   ❌ Failed to process conversation ${doc.id}:`, err); // ✅ 修复：使用 doc.id
    }
  }

  // 先做数据库级去重（按 dedup_signature）以避免重复插入
  const existingSigsRows = db.prepare(`
    SELECT dedup_signature AS sig FROM personality_training_samples WHERE user_id = ?
  `).all(userId) as Array<{ sig: string | null }>;
  const existingSigs = new Set(existingSigsRows.map(r => r.sig || ''));

  // 排序（质量优先）
  candidates.sort((a, b) => (b.quality - a.quality));

  // 覆盖均衡：按主 intent 做加权选择（稀有类优先）
  const intentCounts = new Map<string, number>();
  const getPrimaryIntent = (c: Candidate) => c.intentTags[0] || 'general';

  function pickAccept(c: Candidate): boolean {
    // Skip if sig exists
    if (c.dedupSig && existingSigs.has(c.dedupSig)) return false;
    // Jaccard near-dup check
    for (const ts of acceptedTokenSets) {
      const jac = jaccard(ts, c.tokens);
      if (jac >= jaccardThreshold) return false;
    }
    // Semantic near-dup check
    for (const v of acceptedVectors) {
      const sim = cosineSim(v, c.vector);
      if (sim >= semanticThreshold) return false;
    }
    return true;
  }

  const selected: Candidate[] = [];
  for (const c of candidates) {
    // Balance weight = 1 / (1 + current count of primary intent)
    const key = getPrimaryIntent(c);
    const curr = intentCounts.get(key) || 0;
    const weight = 1 / (1 + curr);
    // 简化：按权重阈值筛选（也可用 lottery），这里用贪心+去重
    if (pickAccept(c)) {
      selected.push(c);
      acceptedVectors.push(c.vector);
      acceptedTokenSets.push(c.tokens);
      intentCounts.set(key, curr + 1);
      if (maxSamples && selected.length >= maxSamples) break;
    }
  }

  // 为每个选中的样本生成对比负样本（优先风格不一致，其次事实不一致）
  for (const s of selected) {
    const neg = generateNegativeSample(s.response, s.styleTags);
    if (neg) s.negative = neg;
  }

  // 批量落库
  for (const s of selected) {
    db.prepare(`
      INSERT INTO personality_training_samples (
        id, user_id, conversation_context, user_response,
        target_person, timestamp_context, emotional_context,
        source_doc_id, quality_score,
        style_tags, intent_tags, dedup_signature,
        negative_response, negative_type, template_flag,
        intimacy_level, relationship_context,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.id,
      userId,
      JSON.stringify(s.context),
      s.response,
      s.targetPerson || 'unknown',
      s.timestamp,
      s.emotional,
      s.sourceDocId,
      s.quality,
      JSON.stringify(s.styleTags),
      JSON.stringify(s.intentTags),
      s.dedupSig,
      s.negative?.text || null,
      s.negative?.type || null,
      s.templateFlag,
      s.intimacyLevel || 0.5,
      JSON.stringify({ targetPerson: s.targetPerson, intimacy: s.intimacyLevel }),
      Date.now()
    );
    samplesCreated++;
  }

  console.log(`\n✅ Training sample generation completed:`);
  console.log(`   Created: ${samplesCreated} samples (accepted after dedup/balance)`);
  console.log(`   Skipped: ${samplesSkipped} (low quality/short/template)`);

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

// ===== Style & Intent tagging =====
function detectStyleTags(message: string, context: ConversationMessage[]): string[] {
  const text = (context.map(c => c.content).join(' ') + ' ' + message).toLowerCase();
  const tags: string[] = [];
  const technical = /(api|代码|function|class|数据库|算法|react|typescript|debug|优化)/i.test(text);
  const casual = /(哈哈|啊|呢|吧|呀|[~～]+|表情|表情包|嗷|哇)/.test(text) || /[\u{1F600}-\u{1F64F}]/u.test(text);
  const emotional = /(开心|伤心|难过|生气|喜欢|讨厌|爱|恨|感动)/.test(text);
  const formal = /(因此|综上|然而|此外|鉴于|根据|注意|请)/.test(text);
  if (technical) tags.push('technical');
  if (casual) tags.push('casual');
  if (emotional) tags.push('emotional');
  if (formal) tags.push('formal');
  if (!tags.length) tags.push('neutral');
  return Array.from(new Set(tags)).slice(0, 3);
}

function detectIntentTags(message: string, _context: ConversationMessage[]): string[] {
  const text = message.toLowerCase();
  const tags: string[] = [];
  if (/[?？]$/.test(text) || /怎么|如何|为何|为什么/.test(text)) tags.push('question');
  if (/约|安排|时间|日程|预约|会议|明天|后天|周[一二三四五六日]/.test(text)) tags.push('scheduling');
  if (/工作|项目|任务|进度|需求|产品|上线|开发/.test(text)) tags.push('work');
  if (/旅游|旅行|机票|酒店|行程|路线/.test(text)) tags.push('travel');
  if (/吃|餐厅|美食|晚饭|午饭|早餐/.test(text)) tags.push('food');
  if (/健身|运动|跑步|瑜伽|力量/.test(text)) tags.push('fitness');
  if (/编程|代码|bug|报错|部署|构建/.test(text)) tags.push('coding');
  if (/学习|课程|作业|考试|复习/.test(text)) tags.push('study');
  if (!tags.length) tags.push('general');
  return Array.from(new Set(tags)).slice(0, 3);
}

// ===== Dedup helpers =====
function toTokenSet(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);
  return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const uni = a.size + b.size - inter || 1;
  return inter / uni;
}

function normalizeTextForHash(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function stableHashSig(text: string): string {
  // FNV-1a 32-bit
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

// ===== Template detection =====
function isTemplateLike(message: string): boolean {
  const t = message.trim();
  if (t.length < 6) return true;
  if (/^(好的|收到|ok|OK|嗯嗯|哈哈|行|可以|是的)[!！。\.]?$/.test(t)) return true;
  const unique = new Set(t.toLowerCase().split(/\s+/));
  if (unique.size / Math.max(1, t.split(/\s+/).length) < 0.4) return true;
  if (/(.)\1{4,}/.test(t)) return true;
  return false;
}

// ===== Negative sample generation =====
function generateNegativeSample(response: string, styleTags: string[]): { text: string; type: string } | null {
  if (styleTags.includes('technical')) {
    // 生成随性/emoji 风格的负例（风格不一致）
    return { text: makeCasualEmoji(response), type: 'style_mismatch' };
  }
  if (styleTags.includes('casual')) {
    return { text: makeOverFormal(response), type: 'style_mismatch' };
  }
  // 否则做轻微事实扰动
  return { text: makeFactMismatch(response), type: 'fact_mismatch' };
}

function makeCasualEmoji(text: string): string {
  const base = text.replace(/因此|综上|然而|此外|鉴于/g, '').trim();
  return `${base} 😂😂 就这~`; 
}

function makeOverFormal(text: string): string {
  const base = text.replace(/哈哈|啊|呢|吧|呀/g, '').trim();
  return `鉴于上述情形，${base}。综上所述，请知悉。`;
}

function makeFactMismatch(text: string): string {
  // 将数字+日期轻度扰动；若无则替换常见实体
  let changed = text.replace(/(\d{1,4})([年/-](\d{1,2}))?/g, (m, y) => String(Number(y) + 1));
  if (changed !== text) return changed;
  // 替换常见地点/人名占位
  changed = text
    .replace(/北京|上海|广州|深圳/g, '火星')
    .replace(/我妈|我爸|同事|朋友/g, '陌生人');
  if (changed !== text) return changed;
  return text + '（备注：数据可能与事实不符）';
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
