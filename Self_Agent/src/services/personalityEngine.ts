/**
 * 🧠 Enhanced Personality Engine v2.0
 * Enhanced personality analysis engine - Multi-dimensional personality modeling and dynamic evolution
 * 
 * Core features:
 * 1. Big Five personality quantitative analysis
 * 2. Cross-platform personality consistency verification
 * 3. Relationship context personality change detection
 * 4. Dynamic personality evolution tracking
 */

import { getRecentChunksByUser, getUserDocCount, getDb } from '../db/index.js';
import { PersonaProfile } from '../pipeline/persona.js';
import { callPythonML } from './mlBridge.js';
import { randomUUID } from 'crypto';

// ============================================
// Type definitions
// ============================================

/**
 * Big Five personality dimensions (Five major personality traits)
 * All values range: 0-1 (normalized)
 */
export interface BigFiveTraits {
  openness: number;              // Openness: curiosity, imagination, creativity
  conscientiousness: number;     // Conscientiousness: organized, reliable, disciplined
  extraversion: number;          // Extraversion: sociability, energy, assertiveness
  agreeableness: number;         // Agreeableness: friendly, empathetic, cooperative
  neuroticism: number;           // Neuroticism: emotional stability, anxiety tendency
}

/**
 * Cross-platform personality consistency analysis
 */
export interface CrossPlatformConsistency {
  instagram_wechat: number;      // Instagram vs WeChat personality similarity (0-1)
  wechat_google: number;         // WeChat vs Google personality similarity
  instagram_google: number;      // Instagram vs Google personality similarity
  overall: number;               // Overall consistency score
  inconsistency_flags: string[]; // Inconsistency warnings (e.g: "Instagram more extroverted, WeChat more introverted")
}

/**
 * Contextual personality changes in relationships
 * Example: More formal with parents, more casual with friends
 */
export interface ContextualPersonaShift {
  target_person: string;                          // Target person (contact name)
  relationship_type: 'family' | 'friend' | 'colleague' | 'stranger';
  persona_shift: {
    formality: number;           // 正式程度 (-1到1: -1极随意, 0中性, 1极正式)
    emotional_openness: number;  // 情感开放度 (0-1: 0封闭, 1完全开放)
    humor_level: number;         // 幽默程度 (0-1)
    response_speed: number;      // 回复速度 (分钟数中位数)
    message_length: number;      // 消息长度倾向 (字符数中位数)
  };
  interaction_count: number;     // 互动次数
  last_interaction: number;      // 最后互动时间戳
}

/**
 * Language签名 (Linguistic Signature)
 * 用户独特的Language风格指纹
 */
export interface LinguisticSignature {
  // 词汇特征
  vocabularyFrequency: Record<string, number>;    // 高频词汇 (Top 100)
  vocabularyDiversity: number;                    // 词汇多样性 (unique words / total words)
  avgWordLength: number;                          // 平均词长
  avgSentenceLength: number;                      // 平均句长
  
  // 句式特征
  sentenceStructurePattern: string;               // 句式mode描述 (例: "多用短句,偶尔长句")
  questionFrequency: number;                      // 问句频率 (0-1)
  exclamationFrequency: number;                   // 感叹句频率
  
  // Emoji & 表情
  emojiUsagePattern: Array<{
    emoji: string;
    frequency: number;
    typical_context: string;                      // 使用场景 (例: "表达开心", "结束对话")
  }>;
  emojiOverallFrequency: number;                  // Emoji总体使用频率 (每消息)
  
  // 文化表达
  culturalExpressions: string[];                  // 常用俚语/成语/流行语
  formalityScore: number;                         // 正式程度 (0-1: 0极随意, 1极正式)
  politenessMarkers: string[];                    // 礼貌用语 (例: "谢谢", "麻烦", "抱歉")
}

/**
 * 时序行为mode
 */
export interface TemporalPatterns {
  // 日常作息
  dailyRoutine: Array<{
    time_hour: number;           // 小时 (0-23)
    activity_type: string;       // 活动类型 (例: "睡眠", "工作", "社交")
    frequency: number;           // 频率 (0-1)
  }>;
  
  // 周活动mode
  weeklyPatterns: Record<string, string[]>;       // 周一到周日的典型活动
  
  // 重要日期
  importantDates: Array<{
    date: string;                // 格式: MM-DD
    type: 'birthday' | 'anniversary' | 'holiday' | 'recurring_event';
    person?: string;             // 相关人物 (生日场景)
    description: string;
    confidence: number;          // 置信度 (0-1)
  }>;
  
  // 活跃时段
  activeHours: {
    morning: number;             // 早晨活跃度 (6-12h)
    afternoon: number;           // 下午活跃度 (12-18h)
    evening: number;             // 晚上活跃度 (18-24h)
    night: number;               // 深夜活跃度 (0-6h)
  };
  
  // 行为周期性
  cyclicPatterns: Array<{
    cycle_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    description: string;
    strength: number;            // 周期强度 (0-1)
  }>;
}

/**
 * 增强型人格档案
 * 扩展基础 PersonaProfile
 */
export interface EnhancedPersonaProfile extends PersonaProfile {
  // 新增维度
  bigFive: BigFiveTraits;
  crossPlatformConsistency: CrossPlatformConsistency;
  contextualPersona: ContextualPersonaShift[];
  linguisticSignature: LinguisticSignature;
  temporalPatterns: TemporalPatterns;
  
  // 元数据
  profileVersion: number;
  qualityScore: number;                           // 档案质量分数 (0-1)
  lastUpdated: number;
  dataSourcesUsed: string[];                      // 使用的数据源
}

// ============================================
// 核心函数
// ============================================

/**
 * 构建增强型人格档案
 * @param userId User ID
 * @param options 配置选项
 */
export async function buildEnhancedPersonaProfile(
  userId: string,
  options: {
    includeBigFive?: boolean;
    includeRelationshipGraph?: boolean;
    includeTemporalAnalysis?: boolean;
    maxChunks?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<EnhancedPersonaProfile> {
  const {
    includeBigFive = true,
    includeRelationshipGraph = true,
    includeTemporalAnalysis = true,
    maxChunks = 500,
    forceRefresh = false,
  } = options;

  console.log(`[EnhancedPersona] Building profile for user ${userId}...`);

  // 1. 检查是否有缓存的增强档案
  if (!forceRefresh) {
    const cached = getEnhancedPersonaFromDB(userId);
    if (cached && isCacheValid(cached)) {
      console.log(`[EnhancedPersona] Using cached profile (version ${cached.profileVersion})`);
      return cached;
    }
  }

  // 2. 获取用户记忆数据
  const chunks = getRecentChunksByUser(userId, maxChunks);
  if (chunks.length === 0) {
    throw new Error(`No memory data found for user ${userId}`);
  }

  console.log(`[EnhancedPersona] Analyzing ${chunks.length} memory chunks...`);

  // 3. 准备数据给 Python ML 层
  const conversations = prepareConversationsForML(chunks);

  // 4. 调用 Python ML 提取特征
  let bigFiveScores: BigFiveTraits | undefined;
  let linguisticSig: LinguisticSignature | undefined;
  let temporalData: TemporalPatterns | undefined;

  if (includeBigFive) {
    console.log(`[EnhancedPersona] Extracting Big Five traits...`);
    bigFiveScores = await callPythonML('personality_extractor', {
      user_id: userId,
      method: 'extract_big_five',
      conversations: conversations,
    });
  }

  console.log(`[EnhancedPersona] Extracting linguistic signature...`);
  linguisticSig = await callPythonML('personality_extractor', {
    user_id: userId,
    method: 'extract_linguistic_signature',
    conversations: conversations,
  });

  if (includeTemporalAnalysis) {
    console.log(`[EnhancedPersona] Analyzing temporal patterns...`);
    temporalData = await callPythonML('temporal_analyzer', {
      user_id: userId,
      messages: conversations,
    });
  }

  // 5. 分析跨平台一致性
  const consistency = await analyzeCrossPlatformConsistency(userId, chunks);

  // 6. 提取关系上下文人格
  let contextualShifts: ContextualPersonaShift[] = [];
  if (includeRelationshipGraph) {
    console.log(`[EnhancedPersona] Building relationship graph...`);
    contextualShifts = await extractContextualPersona(userId, chunks);
  }

  // 7. 组装完整档案
  const enhancedProfile: EnhancedPersonaProfile = {
    // 基础人格特征 (从原有 persona.ts 获取)
    name: extractUserName(chunks),
    interests: extractInterests(chunks),
    experiences: extractExperiences(chunks),
  language_style: (linguisticSig?.formalityScore ?? 0) > 0.7 ? '正式严谨' : '随and自然',
    thinking_patterns: extractThinkingPatterns(chunks),
    emotional_tone: bigFiveScores ? inferEmotionalTone(bigFiveScores) : '平and理性',
    knowledge_domains: extractKnowledgeDomains(chunks),
    recent_activities: extractRecentActivities(chunks.slice(0, 20)),

    // 增强特征
    bigFive: bigFiveScores || getDefaultBigFive(),
    crossPlatformConsistency: consistency,
    contextualPersona: contextualShifts,
    linguisticSignature: linguisticSig || getDefaultLinguisticSignature(),
    temporalPatterns: temporalData || getDefaultTemporalPatterns(),

    // 元数据
    profileVersion: 2,
    qualityScore: calculateQualityScore(chunks.length, bigFiveScores, linguisticSig),
    lastUpdated: Date.now(),
    dataSourcesUsed: extractDataSources(chunks),
  };

  // 8. Save到数据库
  saveEnhancedPersonaToDB(userId, enhancedProfile);

  console.log(`[EnhancedPersona] ✓ Profile built successfully (quality: ${enhancedProfile.qualityScore.toFixed(2)})`);
  return enhancedProfile;
}

/**
 * 分析跨平台人格一致性
 */
async function analyzeCrossPlatformConsistency(
  userId: string,
  chunks: any[]
): Promise<CrossPlatformConsistency> {
  // 按数据源分组
  const bySource: Record<string, any[]> = {};
  for (const chunk of chunks) {
    const source = chunk.source?.toLowerCase() || 'unknown';
    if (!bySource[source]) bySource[source] = [];
    bySource[source].push(chunk);
  }

  const sources = Object.keys(bySource);
  console.log(`[Consistency] Found data from: ${sources.join(', ')}`);

  if (sources.length < 2) {
    // 只有一个数据源,无法比较一致性
    return {
      instagram_wechat: 1.0,
      wechat_google: 1.0,
      instagram_google: 1.0,
      overall: 1.0,
      inconsistency_flags: ['Only one data source available'],
    };
  }

  // 为每个平台构建简化人格档案
  const profiles: Record<string, any> = {};
  for (const source of sources) {
    const sourceChunks = bySource[source];
    const conversations = prepareConversationsForML(sourceChunks);

    profiles[source] = await callPythonML('personality_extractor', {
      user_id: userId,
      method: 'extract_big_five',
      conversations: conversations,
    });
  }

  // 计算跨平台相似度 (使用余弦相似度)
  const similarity = (p1: BigFiveTraits, p2: BigFiveTraits): number => {
    const vec1 = [p1.openness, p1.conscientiousness, p1.extraversion, p1.agreeableness, p1.neuroticism];
    const vec2 = [p2.openness, p2.conscientiousness, p2.extraversion, p2.agreeableness, p2.neuroticism];

    const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));

    return dotProduct / (mag1 * mag2);
  };

  const instagram = profiles['instagram'];
  const wechat = profiles['wechat'];
  const google = profiles['google'];

  const result: CrossPlatformConsistency = {
    instagram_wechat: instagram && wechat ? similarity(instagram, wechat) : 1.0,
    wechat_google: wechat && google ? similarity(wechat, google) : 1.0,
    instagram_google: instagram && google ? similarity(instagram, google) : 1.0,
    overall: 0,
    inconsistency_flags: [],
  };

  result.overall = (result.instagram_wechat + result.wechat_google + result.instagram_google) / 3;

  // 标记显著不一致
  if (result.instagram_wechat < 0.7) {
    result.inconsistency_flags.push('Instagram 与 WeChat 人格差异较大');
  }
  if (result.overall < 0.8) {
    result.inconsistency_flags.push('跨平台人格一致性较低,可能存在角色扮演');
  }

  return result;
}

/**
 * 提取关系上下文人格变化
 */
async function extractContextualPersona(
  userId: string,
  chunks: any[]
): Promise<ContextualPersonaShift[]> {
  // 调用 Python 关系图谱分析
  const relationshipData = await callPythonML('relationship_graph', {
    user_id: userId,
    conversations: prepareConversationsForML(chunks),
  });

  return relationshipData.contextual_shifts || [];
}

// ============================================
// 辅助函数
// ============================================

function prepareConversationsForML(chunks: any[]): any[] {
  return chunks.map(chunk => ({
    content: chunk.text,
    sender: chunk.metadata?.sender || 'user',
    timestamp: new Date(chunk.metadata?.timestamp || Date.now()),
    source: chunk.source,
  }));
}

function extractDataSources(chunks: any[]): string[] {
  const sources = new Set(chunks.map(c => c.source));
  return Array.from(sources);
}

function calculateQualityScore(
  chunkCount: number,
  bigFive?: BigFiveTraits,
  linguistic?: LinguisticSignature
): number {
  let score = 0;

  // 数据量分数 (0-0.4)
  score += Math.min(chunkCount / 1000, 1.0) * 0.4;

  // Big Five 完整性 (0-0.3)
  if (bigFive) {
    score += 0.3;
  }

  // Language签名完整性 (0-0.3)
  if (linguistic && linguistic.vocabularyFrequency) {
    score += 0.3;
  }

  return Math.min(score, 1.0);
}

function getDefaultBigFive(): BigFiveTraits {
  return {
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
  };
}

function getDefaultLinguisticSignature(): LinguisticSignature {
  return {
    vocabularyFrequency: {},
    vocabularyDiversity: 0.5,
    avgWordLength: 5.0,
    avgSentenceLength: 15.0,
    sentenceStructurePattern: '简洁直接',
    questionFrequency: 0.1,
    exclamationFrequency: 0.05,
    emojiUsagePattern: [],
    emojiOverallFrequency: 0.1,
    culturalExpressions: [],
    formalityScore: 0.5,
    politenessMarkers: [],
  };
}

function getDefaultTemporalPatterns(): TemporalPatterns {
  return {
    dailyRoutine: [],
    weeklyPatterns: {},
    importantDates: [],
    activeHours: {
      morning: 0.25,
      afternoon: 0.25,
      evening: 0.25,
      night: 0.25,
    },
    cyclicPatterns: [],
  };
}

// ============================================
// 数据库操作
// ============================================

function getEnhancedPersonaFromDB(userId: string): EnhancedPersonaProfile | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM enhanced_persona_profiles WHERE user_id = ?
  `);

  const row = stmt.get(userId) as any;
  if (!row) return null;

  return {
    ...JSON.parse(row.big_five_scores),
    crossPlatformConsistency: JSON.parse(row.cross_platform_consistency || '{}'),
    contextualPersona: JSON.parse(row.contextual_persona || '[]'),
    linguisticSignature: JSON.parse(row.linguistic_signature || '{}'),
    temporalPatterns: JSON.parse(row.temporal_patterns || '{}'),
    profileVersion: row.version,
    qualityScore: row.quality_score,
    lastUpdated: row.updated_at,
    dataSourcesUsed: [],
  } as EnhancedPersonaProfile;
}

function saveEnhancedPersonaToDB(userId: string, profile: EnhancedPersonaProfile): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO enhanced_persona_profiles (
      user_id,
      big_five_scores,
      cross_platform_consistency,
      contextual_persona,
      linguistic_signature,
      temporal_patterns,
      version,
      quality_score,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  stmt.run(
    userId,
    JSON.stringify(profile.bigFive),
    JSON.stringify(profile.crossPlatformConsistency),
    JSON.stringify(profile.contextualPersona),
    JSON.stringify(profile.linguisticSignature),
    JSON.stringify(profile.temporalPatterns),
    profile.profileVersion,
    profile.qualityScore,
    now,
    now
  );
}

function isCacheValid(profile: EnhancedPersonaProfile): boolean {
  const ageInDays = (Date.now() - profile.lastUpdated) / (1000 * 60 * 60 * 24);
  return ageInDays < 7; // 缓存7天有效
}

// ============================================
// 占位符实现 (待迁移自 persona.ts)
// ============================================

function extractUserName(chunks: any[]): string {
  // TODO: 从 chunks metadata 提取真实Name
  return '用户';
}

function extractInterests(chunks: any[]): string[] {
  // TODO: 迁移自 persona.ts
  return [];
}

function extractExperiences(chunks: any[]): string[] {
  return [];
}

function extractThinkingPatterns(chunks: any[]): string[] {
  return [];
}

function extractKnowledgeDomains(chunks: any[]): string[] {
  return [];
}

function extractRecentActivities(chunks: any[]): string[] {
  return [];
}

function inferEmotionalTone(bigFive: BigFiveTraits): string {
  if (bigFive.neuroticism < 0.3 && bigFive.extraversion > 0.7) {
    return '积极乐观';
  } else if (bigFive.neuroticism > 0.7) {
    return '谨慎敏感';
  }
  return '平and理性';
}
