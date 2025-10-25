/**
 * RewardModel - 奖励模型
 * 
 * Phase 4核心模块:基于用户反馈训练轻量级奖励模型
 * 评估生成内容的质量,为在线学习提供信号
 * 
 * 功能:
 * 1. 基于preference pairs训练奖励模型
 * 2. 评估生成内容的质量分数
 * 3. 支持多维度评分(准确性/风格/关系适配)
 * 4. 提供可解释的评分理由
 */

import Database from 'better-sqlite3';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PreferencePair } from './feedbackCollector';

// ============= 类型定义 =============

export interface RewardScore {
  overallScore: number; // 0-1综合分数
  accuracyScore: number; // 内容准确性
  styleScore: number; // 风格一致性
  relationshipScore: number; // 关系适配性
  engagementScore: number; // 互动质量
  explanation: string; // 评分解释
}

export interface RewardModelConfig {
  apiKey: string;
  modelName?: string;
  weightsAccuracy?: number;
  weightsStyle?: number;
  weightsRelationship?: number;
  weightsEngagement?: number;
}

export interface TrainingResult {
  trainedPairs: number;
  avgPreferredScore: number;
  avgRejectedScore: number;
  separationMargin: number;
  accuracy: number;
}

// ============= RewardModel类 =============

export class RewardModel {
  private db: Database.Database;
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: Required<RewardModelConfig>;

  // 权重配置
  private weights = {
    accuracy: 0.35,
    style: 0.25,
    relationship: 0.25,
    engagement: 0.15
  };

  constructor(db: Database.Database, config: RewardModelConfig) {
    this.db = db;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.modelName || 'gemini-2.0-flash-exp' 
    });
    
    this.config = {
      apiKey: config.apiKey,
      modelName: config.modelName || 'gemini-2.0-flash-exp',
      weightsAccuracy: config.weightsAccuracy || 0.35,
      weightsStyle: config.weightsStyle || 0.25,
      weightsRelationship: config.weightsRelationship || 0.25,
      weightsEngagement: config.weightsEngagement || 0.15
    };

    this.weights = {
      accuracy: this.config.weightsAccuracy,
      style: this.config.weightsStyle,
      relationship: this.config.weightsRelationship,
      engagement: this.config.weightsEngagement
    };

    this.initializeTables();
  }

  /**
   * 初始化表
   */
  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reward_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        message_id TEXT,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        overall_score REAL NOT NULL,
        accuracy_score REAL NOT NULL,
        style_score REAL NOT NULL,
        relationship_score REAL NOT NULL,
        engagement_score REAL NOT NULL,
        explanation TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_reward_user ON reward_scores(user_id);
    `);
  }

  /**
   * 训练奖励模型(基于preference pairs)
   */
  async train(preferencePairs: PreferencePair[]): Promise<TrainingResult> {
    console.log(`🎓 开始训练奖励模型,使用 ${preferencePairs.length} 个偏好对...`);

    let preferredScores: number[] = [];
    let rejectedScores: number[] = [];

    for (const pair of preferencePairs) {
      // 评估preferred response
      const preferredScore = await this.scoreResponse(
        pair.userId,
        pair.prompt,
        pair.preferredResponse,
        pair.context
      );
      preferredScores.push(preferredScore.overallScore);

      // 评估rejected response
      const rejectedScore = await this.scoreResponse(
        pair.userId,
        pair.prompt,
        pair.rejectedResponse,
        pair.context
      );
      rejectedScores.push(rejectedScore.overallScore);

      // 延迟避免API限流
      await this.delay(100);
    }

    const avgPreferred = this.average(preferredScores);
    const avgRejected = this.average(rejectedScores);
    const margin = avgPreferred - avgRejected;
    
    // 计算准确率(preferred分数应该更高)
    const correct = preferredScores.filter((p, i) => p > rejectedScores[i]).length;
    const accuracy = correct / preferencePairs.length;

    console.log(`✅ 训练完成: 平均preferred=${avgPreferred.toFixed(3)}, rejected=${avgRejected.toFixed(3)}, margin=${margin.toFixed(3)}, accuracy=${(accuracy*100).toFixed(1)}%`);

    return {
      trainedPairs: preferencePairs.length,
      avgPreferredScore: avgPreferred,
      avgRejectedScore: avgRejected,
      separationMargin: margin,
      accuracy
    };
  }

  /**
   * 评估响应质量
   */
  async scoreResponse(
    userId: string,
    prompt: string,
    response: string,
    context: string[] = []
  ): Promise<RewardScore> {
    // 多维度评分
    const accuracyScore = await this.scoreAccuracy(prompt, response, context);
    const styleScore = await this.scoreStyle(userId, response);
    const relationshipScore = await this.scoreRelationship(userId, prompt, response);
    const engagementScore = this.scoreEngagement(response);

    // 加权综合分数
    const overallScore = 
      accuracyScore * this.weights.accuracy +
      styleScore * this.weights.style +
      relationshipScore * this.weights.relationship +
      engagementScore * this.weights.engagement;

    const explanation = this.generateExplanation({
      overallScore,
      accuracyScore,
      styleScore,
      relationshipScore,
      engagementScore,
      explanation: ''
    });

    const score: RewardScore = {
      overallScore,
      accuracyScore,
      styleScore,
      relationshipScore,
      engagementScore,
      explanation
    };

    // 保存评分
    this.saveScore(userId, prompt, response, score);

    return score;
  }

  /**
   * 评估内容准确性
   */
  private async scoreAccuracy(
    prompt: string, 
    response: string, 
    context: string[]
  ): Promise<number> {
    const systemPrompt = `你是一个内容质量评估专家。评估回复的准确性、相关性和逻辑连贯性。
评分标准:
- 1.0: 完美回答,准确相关,逻辑严密
- 0.7-0.9: 良好,基本准确,逻辑清晰
- 0.4-0.6: 一般,有偏差或不够完整
- 0.0-0.3: 差,不相关或逻辑混乱

只返回0-1之间的分数,不要解释。`;

    const userPrompt = `上下文:\n${context.join('\n')}\n\n提问: ${prompt}\n\n回复: ${response}\n\n评分:`;

    try {
      const result = await this.model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);
      const scoreText = result.response.text().trim();
      const score = parseFloat(scoreText);
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.warn('准确性评分失败,使用默认值', error);
      return 0.5;
    }
  }

  /**
   * 评估风格一致性
   */
  private async scoreStyle(userId: string, response: string): Promise<number> {
    // 从persona profile获取用户风格特征
    const profile = this.db.prepare(`
      SELECT * FROM persona_profiles WHERE user_id = ? LIMIT 1
    `).get(userId) as any;

    if (!profile) return 0.5; // 无profile时给中等分

    // 检查风格特征匹配度
    let score = 0.5;
    let matches = 0;
    let total = 0;

    // 检查emoji使用
    const emojiCount = (response.match(/[\p{Emoji}]/gu) || []).length;
    const expectedEmoji = profile.emoji_freq || 0;
    if (expectedEmoji > 0.1 && emojiCount > 0) {
      matches++; score += 0.1;
    } else if (expectedEmoji < 0.05 && emojiCount === 0) {
      matches++; score += 0.1;
    }
    total++;

    // 检查正式度
    const formalWords = ['您', '请', '谢谢', '抱歉', '感谢'].filter(w => response.includes(w)).length;
    const casualWords = ['哈哈', '哇', '嗯', '哎', '呀'].filter(w => response.includes(w)).length;
    const formality = formalWords > casualWords ? 0.7 : 0.3;
    if (Math.abs(formality - (profile.formality || 0.5)) < 0.3) {
      matches++; score += 0.15;
    }
    total++;

    // 检查回复长度
    const lengthScore = response.length / 100;
    const expectedLength = profile.avg_message_length || 50;
    if (Math.abs(response.length - expectedLength) < 50) {
      matches++; score += 0.1;
    }
    total++;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估关系适配性
   */
  private async scoreRelationship(
    userId: string, 
    prompt: string, 
    response: string
  ): Promise<number> {
    // 从prompt中推断对话对象
    // TODO: 实际应该从对话上下文中获取target_person
    
    // 简化版:检查回复是否适配一般社交场景
    let score = 0.5;

    // 检查礼貌用语
    const politeWords = ['请', '谢谢', '麻烦', '抱歉', '不好意思'];
    const hasPolite = politeWords.some(w => response.includes(w));
    if (hasPolite) score += 0.2;

    // 检查情感词汇
    const emotionalWords = ['开心', '难过', '担心', '高兴', '感动', '理解'];
    const hasEmotion = emotionalWords.some(w => response.includes(w));
    if (hasEmotion) score += 0.15;

    // 检查回复完整性
    if (response.length > 20 && !response.endsWith('...')) {
      score += 0.15;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 评估互动质量
   */
  private scoreEngagement(response: string): number {
    let score = 0.5;

    // 检查问句(促进互动)
    const hasQuestion = response.includes('?') || response.includes('?');
    if (hasQuestion) score += 0.2;

    // 检查回复丰富度
    if (response.length > 50) score += 0.1;
    if (response.length > 100) score += 0.1;

    // 检查多样性(不重复)
    const words = response.split(/\s+/);
    const uniqueWords = new Set(words);
    const diversity = uniqueWords.size / words.length;
    score += diversity * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 生成评分解释
   */
  private generateExplanation(score: RewardScore): string {
    const parts: string[] = [];

    if (score.accuracyScore >= 0.7) {
      parts.push('内容准确相关');
    } else if (score.accuracyScore < 0.5) {
      parts.push('内容准确性需提升');
    }

    if (score.styleScore >= 0.7) {
      parts.push('风格一致');
    } else if (score.styleScore < 0.5) {
      parts.push('风格需调整');
    }

    if (score.relationshipScore >= 0.7) {
      parts.push('关系适配良好');
    } else if (score.relationshipScore < 0.5) {
      parts.push('关系适配需优化');
    }

    if (score.engagementScore >= 0.7) {
      parts.push('互动性强');
    } else if (score.engagementScore < 0.5) {
      parts.push('互动性待加强');
    }

    return parts.join(', ');
  }

  /**
   * 保存评分
   */
  private saveScore(
    userId: string, 
    prompt: string, 
    response: string, 
    score: RewardScore
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO reward_scores
      (user_id, prompt, response, overall_score, accuracy_score, 
       style_score, relationship_score, engagement_score, explanation, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      prompt,
      response,
      score.overallScore,
      score.accuracyScore,
      score.styleScore,
      score.relationshipScore,
      score.engagementScore,
      score.explanation,
      Date.now()
    );
  }

  /**
   * 获取历史评分
   */
  getScoreHistory(userId: string, limit: number = 50): RewardScore[] {
    const rows = this.db.prepare(`
      SELECT * FROM reward_scores
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(row => ({
      overallScore: row.overall_score,
      accuracyScore: row.accuracy_score,
      styleScore: row.style_score,
      relationshipScore: row.relationship_score,
      engagementScore: row.engagement_score,
      explanation: row.explanation
    }));
  }

  /**
   * 工具函数
   */
  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
