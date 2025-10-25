/**
 * Phase 3.3: Context-Aware Inference Engine - Conversation Memory
 * 
 * 多层次对话记忆系统:
 * - 短期记忆: 当前对话最近10轮
 * - 中期记忆: 话题级别的关键信息
 * - 长期记忆: 与特定人的历史互动模式
 */

import type { Database } from '../db/index.js';
import type { ConversationContext } from './contextDetector.js';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  contextSnapshot?: ConversationContext;
}

export interface TopicMemory {
  topic: string;
  keyPoints: string[];
  participants: string[];
  startTime: number;
  endTime: number;
  turnCount: number;
}

export interface LongTermPattern {
  targetPerson: string;
  totalConversations: number;
  averageIntimacy: number;
  commonTopics: string[];
  communicationStyle: string;
  lastInteraction: number;
}

export interface MemorySnapshot {
  shortTerm: ConversationTurn[];
  currentTopic?: TopicMemory;
  longTerm?: LongTermPattern;
}

export class ConversationMemory {
  private db: Database;
  private readonly SHORT_TERM_LIMIT = 10;
  private readonly TOPIC_DETECTION_THRESHOLD = 5;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 保存对话轮次
   */
  async saveTurn(
    userId: string,
    conversationId: string,
    targetPerson: string | undefined,
    turn: ConversationTurn,
    turnNumber: number
  ): Promise<void> {
    const contextSnapshot = turn.contextSnapshot ? JSON.stringify(turn.contextSnapshot) : null;

    this.db
      .prepare(
        `
      INSERT INTO conversation_memory 
      (user_id, conversation_id, target_person, turn_number, role, content, context_snapshot, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        userId,
        conversationId,
        targetPerson || null,
        turnNumber,
        turn.role,
        turn.content,
        contextSnapshot,
        turn.timestamp
      );
  }

  /**
   * 获取短期记忆 (最近N轮)
   */
  async getShortTermMemory(
    conversationId: string,
    limit: number = this.SHORT_TERM_LIMIT
  ): Promise<ConversationTurn[]> {
    const rows = this.db
      .prepare(
        `
      SELECT role, content, timestamp, context_snapshot
      FROM conversation_memory
      WHERE conversation_id = ?
      ORDER BY turn_number DESC
      LIMIT ?
    `
      )
      .all(conversationId, limit) as Array<{
      role: string;
      content: string;
      timestamp: number;
      context_snapshot: string | null;
    }>;

    return rows.reverse().map((row) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
      timestamp: row.timestamp,
      contextSnapshot: row.context_snapshot ? JSON.parse(row.context_snapshot) : undefined,
    }));
  }

  /**
   * 检测当前话题 (基于关键词相似度)
   */
  async detectCurrentTopic(conversationId: string): Promise<TopicMemory | null> {
    const recentTurns = await this.getShortTermMemory(conversationId, this.TOPIC_DETECTION_THRESHOLD);

    if (recentTurns.length < 3) {
      return null; // 对话太短,无法确定话题
    }

    // 提取关键词
    const keyPoints = this.extractKeyPoints(recentTurns.map((t) => t.content));

    // 提取参与者
    const participants = new Set<string>();
    for (const turn of recentTurns) {
      if (turn.contextSnapshot?.social.targetPerson) {
        participants.add(turn.contextSnapshot.social.targetPerson);
      }
    }

    // 推断话题 (简化版: 基于高频词)
    const topic = this.inferTopic(keyPoints);

    return {
      topic,
      keyPoints,
      participants: Array.from(participants),
      startTime: recentTurns[0]?.timestamp || Date.now(),
      endTime: recentTurns[recentTurns.length - 1]?.timestamp || Date.now(),
      turnCount: recentTurns.length,
    };
  }

  /**
   * 获取长期互动模式
   */
  async getLongTermPattern(
    userId: string,
    targetPerson: string
  ): Promise<LongTermPattern | null> {
    // 统计总对话数
    const countRow = this.db
      .prepare(
        `
      SELECT COUNT(DISTINCT conversation_id) as total
      FROM conversation_memory
      WHERE user_id = ? AND target_person = ?
    `
      )
      .get(userId, targetPerson) as { total: number } | undefined;

    const totalConversations = countRow?.total || 0;

    if (totalConversations === 0) {
      return null;
    }

    // 从relationship_profiles获取亲密度
    const relationshipRow = this.db
      .prepare(
        `
      SELECT intimacy_level, formality_score
      FROM relationship_profiles
      WHERE user_id = ? AND target_person = ?
    `
      )
      .get(userId, targetPerson) as
      | { intimacy_level: number; formality_score: number }
      | undefined;

    const averageIntimacy = relationshipRow?.intimacy_level || 0.5;

    // 提取常见话题 (从历史对话内容)
    const contentRows = this.db
      .prepare(
        `
      SELECT content
      FROM conversation_memory
      WHERE user_id = ? AND target_person = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `
      )
      .all(userId, targetPerson) as Array<{ content: string }>;

    const allContent = contentRows.map((r) => r.content).join(' ');
    const commonTopics = this.extractCommonTopics(allContent);

    // 沟通风格
    const communicationStyle =
      relationshipRow?.formality_score && relationshipRow.formality_score > 0.6
        ? 'formal'
        : 'casual';

    // 最后互动时间
    const lastRow = this.db
      .prepare(
        `
      SELECT MAX(timestamp) as last_time
      FROM conversation_memory
      WHERE user_id = ? AND target_person = ?
    `
      )
      .get(userId, targetPerson) as { last_time: number } | undefined;

    const lastInteraction = lastRow?.last_time || 0;

    return {
      targetPerson,
      totalConversations,
      averageIntimacy,
      commonTopics,
      communicationStyle,
      lastInteraction,
    };
  }

  /**
   * 获取完整记忆快照
   */
  async getMemorySnapshot(
    userId: string,
    conversationId: string,
    targetPerson?: string
  ): Promise<MemorySnapshot> {
    const shortTerm = await this.getShortTermMemory(conversationId);
    const currentTopic = await this.detectCurrentTopic(conversationId);
    const longTerm = targetPerson
      ? await this.getLongTermPattern(userId, targetPerson)
      : undefined;

    return {
      shortTerm,
      currentTopic,
      longTerm,
    };
  }

  /**
   * 清理旧对话 (保留最近N天)
   */
  async cleanOldConversations(userId: string, daysToKeep: number = 90): Promise<number> {
    const cutoffTimestamp = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    const result = this.db
      .prepare(
        `
      DELETE FROM conversation_memory
      WHERE user_id = ? AND timestamp < ?
    `
      )
      .run(userId, cutoffTimestamp);

    return result.changes;
  }

  /**
   * 提取关键点 (简化版: 长句子)
   */
  private extractKeyPoints(contents: string[]): string[] {
    const keyPoints: string[] = [];

    for (const content of contents) {
      const sentences = content.split(/[.!?。!?]/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 200) {
          keyPoints.push(trimmed);
        }
      }
    }

    return keyPoints.slice(0, 5); // 最多5个关键点
  }

  /**
   * 推断话题 (简化版: 基于高频词)
   */
  private inferTopic(keyPoints: string[]): string {
    if (keyPoints.length === 0) {
      return 'general';
    }

    const allWords = keyPoints.join(' ').toLowerCase();

    // 话题关键词匹配
    const topicKeywords = {
      work: ['work', 'job', 'project', 'meeting', 'deadline', '工作', '项目'],
      life: ['life', 'family', 'home', 'weekend', '生活', '家庭'],
      tech: ['code', 'tech', 'software', 'ai', '技术', '代码'],
      health: ['health', 'exercise', 'food', '健康', '运动'],
      entertainment: ['movie', 'game', 'music', 'travel', '电影', '旅游'],
    };

    let maxScore = 0;
    let detectedTopic = 'general';

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (allWords.includes(keyword)) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        detectedTopic = topic;
      }
    }

    return detectedTopic;
  }

  /**
   * 提取常见话题
   */
  private extractCommonTopics(content: string): string[] {
    const topics = new Set<string>();
    const lowerContent = content.toLowerCase();

    const topicKeywords = {
      work: ['work', 'job', 'project', '工作'],
      life: ['life', 'family', '生活'],
      tech: ['tech', 'ai', '技术'],
      entertainment: ['movie', 'game', '电影'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          topics.add(topic);
          break;
        }
      }
    }

    return Array.from(topics).slice(0, 3);
  }

  /**
   * 将记忆快照转换为可用的prompt描述
   */
  convertMemoryToPromptDescription(memory: MemorySnapshot): string {
    const descriptions: string[] = [];

    // 短期记忆
    if (memory.shortTerm.length > 0) {
      descriptions.push(`最近对话 (${memory.shortTerm.length}轮):`);
      const recentSummary = memory.shortTerm
        .slice(-3)
        .map((t) => `[${t.role}]: ${t.content.slice(0, 100)}`)
        .join('\n');
      descriptions.push(recentSummary);
    }

    // 当前话题
    if (memory.currentTopic) {
      descriptions.push(`\n当前话题: ${memory.currentTopic.topic}`);
      if (memory.currentTopic.keyPoints.length > 0) {
        descriptions.push(`关键点: ${memory.currentTopic.keyPoints.slice(0, 3).join('; ')}`);
      }
    }

    // 长期模式
    if (memory.longTerm) {
      descriptions.push(`\n与${memory.longTerm.targetPerson}的互动:`);
      descriptions.push(`- 总对话次数: ${memory.longTerm.totalConversations}`);
      descriptions.push(`- 亲密度: ${(memory.longTerm.averageIntimacy * 100).toFixed(0)}%`);
      descriptions.push(`- 沟通风格: ${memory.longTerm.communicationStyle}`);
      if (memory.longTerm.commonTopics.length > 0) {
        descriptions.push(`- 常见话题: ${memory.longTerm.commonTopics.join(', ')}`);
      }
    }

    return descriptions.join('\n');
  }
}
