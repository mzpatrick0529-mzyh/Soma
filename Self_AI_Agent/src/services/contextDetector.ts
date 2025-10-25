/**
 * Phase 3.1: Context-Aware Inference Engine - Context Detector
 * 
 * 从对话数据中提取多维度上下文信息:
 * - 时间上下文 (Temporal): 时间段、季节、特殊日期
 * - 空间上下文 (Spatial): 地点、场景
 * - 社交上下文 (Social): 对话对象、群组类型、社交场景
 * - 情感上下文 (Emotional): 当前情绪状态、对话氛围
 */

import { Database } from '../db/index.js';

export interface TemporalContext {
  timestamp?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';
  dayOfWeek?: 'weekday' | 'weekend';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  isSpecialDate?: boolean; // 节假日、生日、纪念日
  specialDateType?: string;
}

export interface SpatialContext {
  location?: string;
  locationType?: 'home' | 'work' | 'public' | 'travel' | 'unknown';
  scene?: string; // e.g., "meeting", "party", "casual"
}

export interface SocialContext {
  targetPerson?: string;
  relationshipType?: string;
  intimacyLevel?: number;
  groupSize?: 'one-on-one' | 'small-group' | 'large-group';
  socialSetting?: 'formal' | 'informal' | 'professional' | 'personal';
}

export interface EmotionalContext {
  detectedMood?: 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'excited';
  moodIntensity?: number; // 0-1
  conversationTone?: 'light' | 'serious' | 'humorous' | 'supportive' | 'argumentative';
  emotionalWords?: string[];
}

export interface ConversationContext {
  temporal: TemporalContext;
  spatial: SpatialContext;
  social: SocialContext;
  emotional: EmotionalContext;
  conversationId?: string;
  turnNumber?: number;
}

export class ContextDetector {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 从对话消息中提取完整上下文
   */
  async detectContext(
    message: string,
    metadata?: {
      timestamp?: number;
      sender?: string;
      location?: string;
      participants?: string[];
      conversationId?: string;
      turnNumber?: number;
    }
  ): Promise<ConversationContext> {
    const temporal = this.extractTemporalContext(metadata?.timestamp);
    const spatial = this.extractSpatialContext(metadata?.location);
    const social = await this.extractSocialContext(metadata);
    const emotional = this.extractEmotionalContext(message);

    return {
      temporal,
      spatial,
      social,
      emotional,
      conversationId: metadata?.conversationId,
      turnNumber: metadata?.turnNumber,
    };
  }

  /**
   * 提取时间上下文
   */
  private extractTemporalContext(timestamp?: number): TemporalContext {
    if (!timestamp) {
      return {};
    }

    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();

    // 时间段
    let timeOfDay: TemporalContext['timeOfDay'];
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 && hour < 24) timeOfDay = 'night';
    else timeOfDay = 'late-night';

    // 工作日/周末
    const isDayOfWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 季节 (北半球)
    let season: TemporalContext['season'];
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'autumn';
    else season = 'winter';

    // 特殊日期检测 (简化版，可扩展)
    const isSpecialDate = this.checkSpecialDate(date);

    return {
      timestamp,
      timeOfDay,
      dayOfWeek: isDayOfWeekend ? 'weekend' : 'weekday',
      season,
      isSpecialDate: isSpecialDate.is,
      specialDateType: isSpecialDate.type,
    };
  }

  /**
   * 检查特殊日期
   */
  private checkSpecialDate(date: Date): { is: boolean; type?: string } {
    const month = date.getMonth();
    const day = date.getDate();

    // 主要节假日 (简化版)
    const holidays: { [key: string]: string } = {
      '0-1': 'New Year',
      '1-14': 'Valentine',
      '11-25': 'Christmas',
      '11-31': 'New Year Eve',
    };

    const key = `${month}-${day}`;
    if (holidays[key]) {
      return { is: true, type: holidays[key] };
    }

    return { is: false };
  }

  /**
   * 提取空间上下文
   */
  private extractSpatialContext(location?: string): SpatialContext {
    if (!location) {
      return { locationType: 'unknown' };
    }

    // 基于关键词识别地点类型
    const lowerLocation = location.toLowerCase();
    let locationType: SpatialContext['locationType'] = 'unknown';

    if (lowerLocation.includes('home') || lowerLocation.includes('家')) {
      locationType = 'home';
    } else if (
      lowerLocation.includes('office') ||
      lowerLocation.includes('work') ||
      lowerLocation.includes('公司')
    ) {
      locationType = 'work';
    } else if (
      lowerLocation.includes('cafe') ||
      lowerLocation.includes('restaurant') ||
      lowerLocation.includes('咖啡') ||
      lowerLocation.includes('餐厅')
    ) {
      locationType = 'public';
    } else if (
      lowerLocation.includes('airport') ||
      lowerLocation.includes('hotel') ||
      lowerLocation.includes('机场') ||
      lowerLocation.includes('酒店')
    ) {
      locationType = 'travel';
    }

    return {
      location,
      locationType,
    };
  }

  /**
   * 提取社交上下文
   */
  private async extractSocialContext(metadata?: {
    sender?: string;
    participants?: string[];
  }): Promise<SocialContext> {
    if (!metadata?.sender) {
      return {};
    }

    const targetPerson = metadata.sender;

    // 从数据库查询关系信息
    const relationshipProfile = this.db
      .prepare(
        `SELECT relationship_type, intimacy_level FROM relationship_profiles WHERE target_person = ?`
      )
      .get(targetPerson) as
      | { relationship_type: string; intimacy_level: number }
      | undefined;

    // 群组大小
    let groupSize: SocialContext['groupSize'] = 'one-on-one';
    if (metadata.participants && metadata.participants.length > 2) {
      groupSize = metadata.participants.length > 5 ? 'large-group' : 'small-group';
    }

    // 社交场景 (基于关系类型推断)
    let socialSetting: SocialContext['socialSetting'] = 'informal';
    if (relationshipProfile?.relationship_type) {
      const type = relationshipProfile.relationship_type.toLowerCase();
      if (type.includes('colleague') || type.includes('boss') || type.includes('client')) {
        socialSetting = 'professional';
      } else if (type.includes('family') || type.includes('close friend')) {
        socialSetting = 'personal';
      } else if (type.includes('acquaintance')) {
        socialSetting = 'formal';
      }
    }

    return {
      targetPerson,
      relationshipType: relationshipProfile?.relationship_type,
      intimacyLevel: relationshipProfile?.intimacy_level,
      groupSize,
      socialSetting,
    };
  }

  /**
   * 提取情感上下文
   */
  private extractEmotionalContext(message: string): EmotionalContext {
    const lowerMessage = message.toLowerCase();

    // 情感词典 (简化版)
    const emotionKeywords = {
      happy: ['happy', 'great', 'awesome', 'love', 'excited', '开心', '高兴', '哈哈', '😊', '😄'],
      sad: ['sad', 'sorry', 'upset', 'disappointed', '难过', '失望', '😢', '😞'],
      angry: ['angry', 'mad', 'furious', 'annoyed', '生气', '愤怒', '😠', '😡'],
      anxious: ['worried', 'nervous', 'anxious', 'stressed', '担心', '焦虑', '😰', '😟'],
      excited: ['excited', 'amazing', 'wonderful', 'fantastic', '激动', '兴奋', '🎉', '✨'],
    };

    // 检测情绪
    const detectedEmotions: { [key: string]: number } = {};
    const emotionalWords: string[] = [];

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let count = 0;
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          count++;
          emotionalWords.push(keyword);
        }
      }
      if (count > 0) {
        detectedEmotions[emotion] = count;
      }
    }

    // 主导情绪
    let detectedMood: EmotionalContext['detectedMood'] = 'neutral';
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(detectedEmotions)) {
      if (count > maxCount) {
        maxCount = count;
        detectedMood = emotion as EmotionalContext['detectedMood'];
      }
    }

    // 情绪强度 (基于关键词数量)
    const moodIntensity = Math.min(maxCount / 3, 1.0);

    // 对话基调
    let conversationTone: EmotionalContext['conversationTone'] = 'light';
    if (lowerMessage.includes('?') || lowerMessage.includes('问')) {
      conversationTone = 'serious';
    } else if (emotionalWords.some((w) => ['haha', '哈哈', '😄'].includes(w))) {
      conversationTone = 'humorous';
    } else if (detectedMood === 'sad' || detectedMood === 'anxious') {
      conversationTone = 'supportive';
    }

    return {
      detectedMood,
      moodIntensity,
      conversationTone,
      emotionalWords: [...new Set(emotionalWords)],
    };
  }

  /**
   * 批量检测历史对话的上下文
   */
  async detectHistoricalContexts(
    userId: string,
    limit: number = 100
  ): Promise<ConversationContext[]> {
    const memories = this.db
      .prepare(
        `
      SELECT content, metadata, timestamp 
      FROM memories 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `
      )
      .all(userId, limit) as Array<{
      content: string;
      metadata: string;
      timestamp: number;
    }>;

    const contexts: ConversationContext[] = [];

    for (const memory of memories) {
      let metadata: any = {};
      try {
        metadata = JSON.parse(memory.metadata);
      } catch (e) {
        // ignore parse errors
      }

      const context = await this.detectContext(memory.content, {
        timestamp: memory.timestamp,
        sender: metadata.sender,
        location: metadata.location,
        participants: metadata.participants,
      });

      contexts.push(context);
    }

    return contexts;
  }

  /**
   * 获取上下文统计信息
   */
  getContextStatistics(contexts: ConversationContext[]): {
    mostCommonTimeOfDay: string;
    mostCommonMood: string;
    averageIntimacyLevel: number;
    professionalVsPersonal: { professional: number; personal: number };
  } {
    const timeOfDayCount: { [key: string]: number } = {};
    const moodCount: { [key: string]: number } = {};
    const intimacyLevels: number[] = [];
    let professionalCount = 0;
    let personalCount = 0;

    for (const ctx of contexts) {
      // 时间段统计
      if (ctx.temporal.timeOfDay) {
        timeOfDayCount[ctx.temporal.timeOfDay] =
          (timeOfDayCount[ctx.temporal.timeOfDay] || 0) + 1;
      }

      // 情绪统计
      if (ctx.emotional.detectedMood) {
        moodCount[ctx.emotional.detectedMood] =
          (moodCount[ctx.emotional.detectedMood] || 0) + 1;
      }

      // 亲密度统计
      if (ctx.social.intimacyLevel !== undefined) {
        intimacyLevels.push(ctx.social.intimacyLevel);
      }

      // 社交场景统计
      if (ctx.social.socialSetting === 'professional') {
        professionalCount++;
      } else if (ctx.social.socialSetting === 'personal') {
        personalCount++;
      }
    }

    // 找出最常见的值
    const mostCommonTimeOfDay =
      Object.entries(timeOfDayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    const mostCommonMood =
      Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
    const averageIntimacyLevel =
      intimacyLevels.length > 0
        ? intimacyLevels.reduce((a, b) => a + b, 0) / intimacyLevels.length
        : 0;

    return {
      mostCommonTimeOfDay,
      mostCommonMood,
      averageIntimacyLevel,
      professionalVsPersonal: {
        professional: professionalCount,
        personal: personalCount,
      },
    };
  }
}
