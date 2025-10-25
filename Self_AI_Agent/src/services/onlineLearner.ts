/**
 * OnlineLearner - 在线学习器
 * 
 * Phase 4核心模块:基于用户反馈增量更新模型
 * 实时融合新数据,动态优化persona模型
 * 
 * 功能:
 * 1. 增量训练样本生成
 * 2. 模型参数增量更新
 * 3. 新关系自动归档
 * 4. 动态persona调整
 */

import Database from 'better-sqlite3';
import { PreferencePair } from './feedbackCollector';
import { RewardScore } from './rewardModel';

// ============= 类型定义 =============

export interface IncrementalUpdate {
  updateId: string;
  userId: string;
  updateType: 'persona' | 'relationship' | 'style' | 'knowledge';
  newSamples: number;
  affectedFields: string[];
  improvementScore: number;
  timestamp: number;
}

export interface LearningStats {
  totalUpdates: number;
  lastUpdateTime: number;
  avgImprovementScore: number;
  newRelationshipsDetected: number;
  personaAdjustments: number;
}

export interface NewRelationship {
  targetPerson: string;
  firstSeenTimestamp: number;
  messageCount: number;
  intimacyLevel: number;
  relationshipType: string;
}

// ============= OnlineLearner类 =============

export class OnlineLearner {
  private db: Database.Database;
  private updateThreshold = 10; // 积累10个新样本后触发更新
  private minImprovement = 0.05; // 最小改进阈值

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTables();
  }

  /**
   * 初始化表
   */
  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incremental_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        update_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        update_type TEXT NOT NULL,
        new_samples INTEGER NOT NULL,
        affected_fields TEXT,
        improvement_score REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS new_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        target_person TEXT NOT NULL,
        first_seen_timestamp INTEGER NOT NULL,
        message_count INTEGER DEFAULT 1,
        intimacy_level REAL,
        relationship_type TEXT,
        auto_filed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, target_person)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_incremental_user ON incremental_updates(user_id);
      CREATE INDEX IF NOT EXISTS idx_new_rel_user ON new_relationships(user_id);
    `);
  }

  /**
   * 处理新反馈,决定是否触发增量更新
   */
  async processNewFeedback(
    userId: string, 
    preferencePairs: PreferencePair[],
    rewardScores: RewardScore[]
  ): Promise<IncrementalUpdate | null> {
    console.log(`📊 处理新反馈: ${preferencePairs.length}个偏好对, ${rewardScores.length}个评分`);

    // 检查是否达到更新阈值
    const pendingSamples = this.getPendingSampleCount(userId);
    if (pendingSamples < this.updateThreshold) {
      console.log(`⏳ 待处理样本${pendingSamples}个,未达阈值${this.updateThreshold}`);
      return null;
    }

    // 执行增量更新
    const update = await this.performIncrementalUpdate(userId, preferencePairs, rewardScores);
    
    if (update && update.improvementScore > this.minImprovement) {
      console.log(`✅ 增量更新成功: 改进分数 ${update.improvementScore.toFixed(3)}`);
      return update;
    }

    return null;
  }

  /**
   * 执行增量更新
   */
  private async performIncrementalUpdate(
    userId: string,
    preferencePairs: PreferencePair[],
    rewardScores: RewardScore[]
  ): Promise<IncrementalUpdate> {
    const updateId = `update_${userId}_${Date.now()}`;
    const timestamp = Date.now();

    // 1. 更新persona profile
    const personaImprovement = await this.updatePersonaProfile(userId, preferencePairs);

    // 2. 更新relationship profiles
    const relationshipImprovement = await this.updateRelationshipProfiles(userId, preferencePairs);

    // 3. 更新style calibration
    const styleImprovement = await this.updateStyleCalibration(userId, rewardScores);

    // 计算综合改进分数
    const improvementScore = (personaImprovement + relationshipImprovement + styleImprovement) / 3;

    const update: IncrementalUpdate = {
      updateId,
      userId,
      updateType: 'persona',
      newSamples: preferencePairs.length,
      affectedFields: ['persona_profile', 'relationship_profiles', 'style_features'],
      improvementScore,
      timestamp
    };

    // 保存更新记录
    this.saveUpdate(update);

    return update;
  }

  /**
   * 增量更新persona profile
   */
  private async updatePersonaProfile(
    userId: string, 
    preferencePairs: PreferencePair[]
  ): Promise<number> {
    // 从新的偏好对中提取特征
    const newFeatures = this.extractFeaturesFromPairs(preferencePairs);

    // 获取当前profile
    const currentProfile = this.db.prepare(`
      SELECT * FROM persona_profiles WHERE user_id = ? LIMIT 1
    `).get(userId) as any;

    if (!currentProfile) {
      console.warn('⚠️ 未找到persona profile,跳过更新');
      return 0;
    }

    // 增量更新(加权平均)
    const alpha = 0.2; // 新数据权重
    const updatedProfile = this.mergeFeatures(currentProfile, newFeatures, alpha);

    // 更新数据库
    this.updateProfileInDB(userId, updatedProfile);

    // 计算改进分数(基于特征变化量)
    const improvement = this.calculateFeatureChange(currentProfile, updatedProfile);

    console.log(`🔄 Persona profile更新完成,改进分数: ${improvement.toFixed(3)}`);
    return improvement;
  }

  /**
   * 增量更新relationship profiles
   */
  private async updateRelationshipProfiles(
    userId: string,
    preferencePairs: PreferencePair[]
  ): Promise<number> {
    // 从偏好对中识别新关系
    const newRelationships = this.detectNewRelationships(userId, preferencePairs);

    if (newRelationships.length > 0) {
      console.log(`🆕 检测到 ${newRelationships.length} 个新关系`);
      
      for (const rel of newRelationships) {
        this.fileNewRelationship(userId, rel);
      }
    }

    // 更新现有关系的intimacy level
    const intimacyUpdates = this.updateIntimacyLevels(userId, preferencePairs);

    return newRelationships.length > 0 ? 0.3 : 0.1;
  }

  /**
   * 增量更新style calibration
   */
  private async updateStyleCalibration(
    userId: string,
    rewardScores: RewardScore[]
  ): Promise<number> {
    // 从高分回复中提取风格特征
    const highScoreResponses = rewardScores.filter(s => s.overallScore > 0.7);
    
    if (highScoreResponses.length === 0) return 0;

    // 统计风格特征
    const styleFeatures = {
      avgStyleScore: this.average(highScoreResponses.map(s => s.styleScore)),
      avgEngagementScore: this.average(highScoreResponses.map(s => s.engagementScore))
    };

    // 更新persona profile的style字段
    this.db.prepare(`
      UPDATE persona_profiles
      SET style_consistency = ?,
          last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(styleFeatures.avgStyleScore, userId);

    return 0.15;
  }

  /**
   * 从偏好对提取特征
   */
  private extractFeaturesFromPairs(pairs: PreferencePair[]): any {
    const preferredResponses = pairs.map(p => p.preferredResponse);

    return {
      avgLength: this.average(preferredResponses.map(r => r.length)),
      emojiFreq: this.calculateEmojiFreq(preferredResponses),
      formalityScore: this.calculateFormality(preferredResponses)
    };
  }

  /**
   * 合并特征(加权平均)
   */
  private mergeFeatures(current: any, newFeatures: any, alpha: number): any {
    return {
      ...current,
      avg_message_length: current.avg_message_length * (1 - alpha) + newFeatures.avgLength * alpha,
      emoji_freq: current.emoji_freq * (1 - alpha) + newFeatures.emojiFreq * alpha,
      formality: current.formality * (1 - alpha) + newFeatures.formalityScore * alpha
    };
  }

  /**
   * 计算特征变化量
   */
  private calculateFeatureChange(old: any, updated: any): number {
    const lengthChange = Math.abs(old.avg_message_length - updated.avg_message_length) / 100;
    const emojiChange = Math.abs(old.emoji_freq - updated.emoji_freq);
    const formalityChange = Math.abs(old.formality - updated.formality);

    return (lengthChange + emojiChange + formalityChange) / 3;
  }

  /**
   * 更新profile到数据库
   */
  private updateProfileInDB(userId: string, profile: any): void {
    this.db.prepare(`
      UPDATE persona_profiles
      SET avg_message_length = ?,
          emoji_freq = ?,
          formality = ?,
          last_updated = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      profile.avg_message_length,
      profile.emoji_freq,
      profile.formality,
      userId
    );
  }

  /**
   * 检测新关系
   */
  private detectNewRelationships(userId: string, pairs: PreferencePair[]): NewRelationship[] {
    const newRels: NewRelationship[] = [];
    const seenPersons = new Set<string>();

    for (const pair of pairs) {
      // 从上下文中提取target person
      // TODO: 实际实现需要更复杂的NER
      const targetPerson = this.extractTargetPersonFromContext(pair.context);
      
      if (targetPerson && !seenPersons.has(targetPerson)) {
        seenPersons.add(targetPerson);

        // 检查是否为新关系
        const existing = this.db.prepare(`
          SELECT * FROM relationship_profiles 
          WHERE user_id = ? AND target_person = ?
        `).get(userId, targetPerson);

        if (!existing) {
          newRels.push({
            targetPerson,
            firstSeenTimestamp: pair.timestamp,
            messageCount: 1,
            intimacyLevel: 0.3, // 初始intimacy
            relationshipType: 'acquaintance'
          });
        }
      }
    }

    return newRels;
  }

  /**
   * 归档新关系
   */
  private fileNewRelationship(userId: string, rel: NewRelationship): void {
    try {
      this.db.prepare(`
        INSERT INTO new_relationships
        (user_id, target_person, first_seen_timestamp, message_count, 
         intimacy_level, relationship_type, auto_filed)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(
        userId,
        rel.targetPerson,
        rel.firstSeenTimestamp,
        rel.messageCount,
        rel.intimacyLevel,
        rel.relationshipType
      );

      console.log(`📝 自动归档新关系: ${rel.targetPerson} (intimacy: ${rel.intimacyLevel})`);
    } catch (error) {
      // 可能已存在,忽略
    }
  }

  /**
   * 更新intimacy levels
   */
  private updateIntimacyLevels(userId: string, pairs: PreferencePair[]): number {
    // TODO: 基于对话频率和情感强度更新intimacy
    return 0;
  }

  /**
   * 获取待处理样本数
   */
  private getPendingSampleCount(userId: string): number {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM preference_pairs
      WHERE user_id = ? AND timestamp > ?
    `).get(userId, Date.now() - 24 * 60 * 60 * 1000) as any; // 最近24小时

    return result?.count || 0;
  }

  /**
   * 保存更新记录
   */
  private saveUpdate(update: IncrementalUpdate): void {
    this.db.prepare(`
      INSERT INTO incremental_updates
      (update_id, user_id, update_type, new_samples, affected_fields, 
       improvement_score, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      update.updateId,
      update.userId,
      update.updateType,
      update.newSamples,
      JSON.stringify(update.affectedFields),
      update.improvementScore,
      update.timestamp
    );
  }

  /**
   * 获取学习统计
   */
  getLearningStats(userId: string): LearningStats {
    const updates = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        MAX(timestamp) as last_update,
        AVG(improvement_score) as avg_improvement
      FROM incremental_updates
      WHERE user_id = ?
    `).get(userId) as any;

    const newRels = this.db.prepare(`
      SELECT COUNT(*) as count FROM new_relationships
      WHERE user_id = ?
    `).get(userId) as any;

    return {
      totalUpdates: updates?.total || 0,
      lastUpdateTime: updates?.last_update || 0,
      avgImprovementScore: updates?.avg_improvement || 0,
      newRelationshipsDetected: newRels?.count || 0,
      personaAdjustments: updates?.total || 0
    };
  }

  /**
   * 工具函数
   */
  private extractTargetPersonFromContext(context: string[]): string | null {
    // 简化版:从上下文中查找@提及或名字
    for (const msg of context) {
      const match = msg.match(/@(\w+)/);
      if (match) return match[1];
    }
    return null;
  }

  private calculateEmojiFreq(responses: string[]): number {
    const totalEmojis = responses.reduce((sum, r) => 
      sum + (r.match(/[\p{Emoji}]/gu) || []).length, 0
    );
    const totalChars = responses.reduce((sum, r) => sum + r.length, 0);
    return totalChars > 0 ? totalEmojis / totalChars : 0;
  }

  private calculateFormality(responses: string[]): number {
    const formalWords = ['您', '请', '谢谢', '抱歉'];
    const casualWords = ['哈哈', '哇', '嗯', '哎'];
    
    let formalCount = 0;
    let casualCount = 0;

    for (const response of responses) {
      formalCount += formalWords.filter(w => response.includes(w)).length;
      casualCount += casualWords.filter(w => response.includes(w)).length;
    }

    const total = formalCount + casualCount;
    return total > 0 ? formalCount / total : 0.5;
  }

  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
}
