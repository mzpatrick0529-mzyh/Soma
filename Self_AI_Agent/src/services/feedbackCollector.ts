/**
 * FeedbackCollector - 反馈收集器
 * 
 * Phase 4核心模块:收集用户对生成内容的反馈(点赞/点踩/编辑/重新生成)
 * 构建preference数据集,为RLHF-lite训练提供数据基础
 * 
 * 功能:
 * 1. 收集显式反馈(点赞/点踩/评分)
 * 2. 收集隐式反馈(编辑/重新生成/对话长度)
 * 3. 构建偏好数据对(preferred vs rejected)
 * 4. 生成训练数据集
 */

import Database from 'better-sqlite3';

// ============= 类型定义 =============

export interface ExplicitFeedback {
  conversationId: string;
  messageId: string;
  userId: string;
  feedbackType: 'like' | 'dislike' | 'rating';
  rating?: number; // 1-5星
  timestamp: number;
  reason?: string; // 用户可选的反馈原因
}

export interface ImplicitFeedback {
  conversationId: string;
  messageId: string;
  userId: string;
  actionType: 'edit' | 'regenerate' | 'long_conversation' | 'quick_exit';
  originalResponse: string;
  editedResponse?: string;
  timestamp: number;
  contextBefore: string[]; // 前几轮对话
}

export interface PreferencePair {
  conversationId: string;
  userId: string;
  prompt: string;
  context: string[];
  preferredResponse: string;
  rejectedResponse: string;
  preferenceStrength: number; // 0-1,偏好强度
  feedbackSource: 'explicit' | 'implicit';
  timestamp: number;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  likeCount: number;
  dislikeCount: number;
  avgRating: number;
  editCount: number;
  regenerateCount: number;
  preferencePairCount: number;
}

// ============= FeedbackCollector类 =============

export class FeedbackCollector {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTables();
  }

  /**
   * 初始化反馈相关表
   */
  private initializeTables(): void {
    // 显式反馈表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS explicit_feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        rating INTEGER,
        reason TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 隐式反馈表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS implicit_feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        action_type TEXT NOT NULL,
        original_response TEXT NOT NULL,
        edited_response TEXT,
        context_before TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 偏好对表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS preference_pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        context TEXT,
        preferred_response TEXT NOT NULL,
        rejected_response TEXT NOT NULL,
        preference_strength REAL NOT NULL,
        feedback_source TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_explicit_user ON explicit_feedbacks(user_id);
      CREATE INDEX IF NOT EXISTS idx_implicit_user ON implicit_feedbacks(user_id);
      CREATE INDEX IF NOT EXISTS idx_preference_user ON preference_pairs(user_id);
    `);
  }

  /**
   * 收集显式反馈
   */
  collectExplicitFeedback(feedback: ExplicitFeedback): void {
    const stmt = this.db.prepare(`
      INSERT INTO explicit_feedbacks 
      (conversation_id, message_id, user_id, feedback_type, rating, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      feedback.conversationId,
      feedback.messageId,
      feedback.userId,
      feedback.feedbackType,
      feedback.rating || null,
      feedback.reason || null,
      feedback.timestamp
    );

    console.log(`✅ 收集显式反馈: ${feedback.feedbackType} for message ${feedback.messageId}`);
  }

  /**
   * 收集隐式反馈
   */
  collectImplicitFeedback(feedback: ImplicitFeedback): void {
    const stmt = this.db.prepare(`
      INSERT INTO implicit_feedbacks
      (conversation_id, message_id, user_id, action_type, original_response, 
       edited_response, context_before, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      feedback.conversationId,
      feedback.messageId,
      feedback.userId,
      feedback.actionType,
      feedback.originalResponse,
      feedback.editedResponse || null,
      JSON.stringify(feedback.contextBefore),
      feedback.timestamp
    );

    console.log(`✅ 收集隐式反馈: ${feedback.actionType} for message ${feedback.messageId}`);
  }

  /**
   * 从显式反馈生成偏好对
   */
  generatePreferencePairsFromExplicit(userId: string, conversationId: string): number {
    // 获取该对话中的所有显式反馈
    const feedbacks = this.db.prepare(`
      SELECT * FROM explicit_feedbacks
      WHERE user_id = ? AND conversation_id = ?
      ORDER BY timestamp
    `).all(userId, conversationId) as any[];

    let pairCount = 0;

    for (let i = 0; i < feedbacks.length; i++) {
      const feedback = feedbacks[i];
      
      // 如果是dislike,寻找之前的like作为对比
      if (feedback.feedback_type === 'dislike' || (feedback.rating && feedback.rating <= 2)) {
        const betterFeedback = feedbacks.find(f => 
          f.timestamp < feedback.timestamp && 
          (f.feedback_type === 'like' || (f.rating && f.rating >= 4))
        );

        if (betterFeedback) {
          const pair = this.createPreferencePairFromFeedbacks(
            betterFeedback, 
            feedback, 
            userId, 
            conversationId
          );
          if (pair) {
            this.savePreferencePair(pair);
            pairCount++;
          }
        }
      }
    }

    return pairCount;
  }

  /**
   * 从隐式反馈生成偏好对
   */
  generatePreferencePairsFromImplicit(userId: string): number {
    // 获取所有编辑反馈
    const edits = this.db.prepare(`
      SELECT * FROM implicit_feedbacks
      WHERE user_id = ? AND action_type = 'edit' AND edited_response IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 50
    `).all(userId) as any[];

    let pairCount = 0;

    for (const edit of edits) {
      const pair: PreferencePair = {
        conversationId: edit.conversation_id,
        userId: edit.user_id,
        prompt: this.extractPromptFromContext(edit.context_before),
        context: JSON.parse(edit.context_before || '[]'),
        preferredResponse: edit.edited_response,
        rejectedResponse: edit.original_response,
        preferenceStrength: 0.8, // 编辑表示明确偏好
        feedbackSource: 'implicit',
        timestamp: edit.timestamp
      };

      this.savePreferencePair(pair);
      pairCount++;
    }

    // 获取所有重新生成反馈
    const regenerates = this.db.prepare(`
      SELECT * FROM implicit_feedbacks
      WHERE user_id = ? AND action_type = 'regenerate'
      ORDER BY timestamp DESC
      LIMIT 30
    `).all(userId) as any[];

    for (const regen of regenerates) {
      // 重新生成表示对原始回复不满意
      // 尝试找到同一prompt的后续成功回复
      const laterMessages = this.db.prepare(`
        SELECT * FROM implicit_feedbacks
        WHERE user_id = ? AND conversation_id = ? 
        AND timestamp > ? AND action_type != 'regenerate'
        LIMIT 1
      `).get(userId, regen.conversation_id, regen.timestamp) as any;

      if (laterMessages) {
        const pair: PreferencePair = {
          conversationId: regen.conversation_id,
          userId: regen.user_id,
          prompt: this.extractPromptFromContext(regen.context_before),
          context: JSON.parse(regen.context_before || '[]'),
          preferredResponse: laterMessages.original_response,
          rejectedResponse: regen.original_response,
          preferenceStrength: 0.6, // 重新生成表示中等偏好
          feedbackSource: 'implicit',
          timestamp: regen.timestamp
        };

        this.savePreferencePair(pair);
        pairCount++;
      }
    }

    return pairCount;
  }

  /**
   * 保存偏好对
   */
  private savePreferencePair(pair: PreferencePair): void {
    const stmt = this.db.prepare(`
      INSERT INTO preference_pairs
      (conversation_id, user_id, prompt, context, preferred_response, 
       rejected_response, preference_strength, feedback_source, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      pair.conversationId,
      pair.userId,
      pair.prompt,
      JSON.stringify(pair.context),
      pair.preferredResponse,
      pair.rejectedResponse,
      pair.preferenceStrength,
      pair.feedbackSource,
      pair.timestamp
    );
  }

  /**
   * 从两个反馈创建偏好对
   */
  private createPreferencePairFromFeedbacks(
    better: any, 
    worse: any, 
    userId: string, 
    conversationId: string
  ): PreferencePair | null {
    // 从数据库获取实际的消息内容
    const betterMsg = this.getMessageContent(better.message_id);
    const worseMsg = this.getMessageContent(worse.message_id);

    if (!betterMsg || !worseMsg) return null;

    return {
      conversationId,
      userId,
      prompt: betterMsg.prompt || '',
      context: betterMsg.context || [],
      preferredResponse: betterMsg.response,
      rejectedResponse: worseMsg.response,
      preferenceStrength: this.calculatePreferenceStrength(better, worse),
      feedbackSource: 'explicit',
      timestamp: better.timestamp
    };
  }

  /**
   * 计算偏好强度
   */
  private calculatePreferenceStrength(better: any, worse: any): number {
    if (better.rating && worse.rating) {
      return Math.min(1.0, (better.rating - worse.rating) / 4.0);
    }
    return 0.7; // 默认中等偏好强度
  }

  /**
   * 获取消息内容(占位符,实际需要从conversations表获取)
   */
  private getMessageContent(messageId: string): any {
    // TODO: 实际实现需要从conversations或messages表获取
    return {
      prompt: 'Sample prompt',
      context: [],
      response: 'Sample response'
    };
  }

  /**
   * 从上下文提取prompt
   */
  private extractPromptFromContext(contextJson: string): string {
    try {
      const context = JSON.parse(contextJson || '[]');
      return context.length > 0 ? context[context.length - 1] : '';
    } catch {
      return '';
    }
  }

  /**
   * 获取反馈统计
   */
  getFeedbackStats(userId: string): FeedbackStats {
    const explicit = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN feedback_type = 'like' THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN feedback_type = 'dislike' THEN 1 ELSE 0 END) as dislikes,
        AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as avg_rating
      FROM explicit_feedbacks
      WHERE user_id = ?
    `).get(userId) as any;

    const implicit = this.db.prepare(`
      SELECT 
        SUM(CASE WHEN action_type = 'edit' THEN 1 ELSE 0 END) as edits,
        SUM(CASE WHEN action_type = 'regenerate' THEN 1 ELSE 0 END) as regenerates
      FROM implicit_feedbacks
      WHERE user_id = ?
    `).get(userId) as any;

    const pairs = this.db.prepare(`
      SELECT COUNT(*) as count FROM preference_pairs WHERE user_id = ?
    `).get(userId) as any;

    return {
      totalFeedbacks: explicit.total || 0,
      likeCount: explicit.likes || 0,
      dislikeCount: explicit.dislikes || 0,
      avgRating: explicit.avg_rating || 0,
      editCount: implicit.edits || 0,
      regenerateCount: implicit.regenerates || 0,
      preferencePairCount: pairs.count || 0
    };
  }

  /**
   * 导出训练数据集
   */
  exportTrainingDataset(userId: string, minStrength: number = 0.5): PreferencePair[] {
    const pairs = this.db.prepare(`
      SELECT * FROM preference_pairs
      WHERE user_id = ? AND preference_strength >= ?
      ORDER BY timestamp DESC
    `).all(userId, minStrength) as any[];

    return pairs.map(row => ({
      conversationId: row.conversation_id,
      userId: row.user_id,
      prompt: row.prompt,
      context: JSON.parse(row.context || '[]'),
      preferredResponse: row.preferred_response,
      rejectedResponse: row.rejected_response,
      preferenceStrength: row.preference_strength,
      feedbackSource: row.feedback_source as 'explicit' | 'implicit',
      timestamp: row.timestamp
    }));
  }
}
