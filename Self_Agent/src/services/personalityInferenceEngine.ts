/**
 * 人格推理引擎 - 上下文感知的个性化回复生成
 * 根据对话对象、场景、情绪动态调整人格表现
 */

import type { Database as SqlDatabaseNS } from 'better-sqlite3';
import {
  PersonalityVector,
  PersonalityInferenceContext,
  PersonalityInferenceResult,
  RelationshipProfile,
  EmotionalState,
  ConversationMessage
} from '../types/personality';

export class PersonalityInferenceEngine {
  constructor(
  private db: SqlDatabaseNS,
    private geminiApiKey: string
  ) {}

  /**
   * 生成个性化回复（主入口）
   */
  async generatePersonalizedResponse(
    userId: string,
    context: PersonalityInferenceContext
  ): Promise<PersonalityInferenceResult> {
    const startTime = Date.now();

    try {
      // 1. 加载基础人格向量
      const basePersonality = await this.loadPersonalityVector(userId);
      
      if (!basePersonality) {
        throw new Error(`Personality vector not found for user: ${userId}`);
      }

      // 2. 获取对话对象的关系档案
      const relationship = await this.getRelationshipProfile(userId, context.sender);

      // 3. 分析当前情绪状态
      const emotionalState = this.analyzeEmotionalState(
        context.conversationHistory,
        basePersonality
      );

      // 4. 动态调整人格参数（核心算法）
      const adjustedPersonality = this.adjustPersonalityForContext({
        base: basePersonality,
        relationship: relationship,
        time: context.currentTime,
        emotion: emotionalState,
        location: context.location
      });

      // 5. 检索相关记忆
      const relevantMemories = await this.retrieveRelevantMemories(
        userId,
        context.message,
        context.sender
      );

      // 6. 构建人格化Prompt
      const prompt = this.buildPersonalityPrompt({
        personality: adjustedPersonality,
        relationship: relationship,
        emotionalState: emotionalState,
        relevantMemories: relevantMemories,
        conversationHistory: context.conversationHistory,
        currentMessage: context.message
      });

      // 7. 调用LLM生成回复
      const response = await this.generateWithLLM(prompt, adjustedPersonality);

      // 8. 一致性检查与修正
      const finalResponse = await this.ensureConsistency(
        response,
        adjustedPersonality,
        relevantMemories
      );

      // 9. 记录推理过程（用于RLHF）
      await this.logInference(userId, context, finalResponse, adjustedPersonality);

      const inferenceTime = Date.now() - startTime;

      return {
        response: finalResponse,
        confidence: this.calculateConfidence(adjustedPersonality, relevantMemories),
        adjustedPersonality: adjustedPersonality,
        usedMemories: relevantMemories.map(m => ({
          docId: m.doc_id,
          relevance: m.score
        })),
        reasoning: this.explainReasoning(adjustedPersonality, relationship),
        metadata: {
          inferenceTimeMs: inferenceTime,
          modelVersion: 'v1.0-prompt-based',
          strategyUsed: 'prompt'
        }
      };

    } catch (error) {
      console.error('Personality inference error:', error);
      throw error;
    }
  }

  /**
   * 加载人格向量
   */
  private async loadPersonalityVector(userId: string): Promise<PersonalityVector | null> {
    const row = this.db.prepare(`
      SELECT * FROM user_personality_vectors WHERE user_id = ?
    `).get(userId) as any;

    if (!row) return null;

    // 转换为PersonalityVector对象
    const personality: PersonalityVector = {
      userId: row.user_id,
      linguistic: {
        vocabularyComplexity: row.vocab_complexity || 0.5,
        sentenceLengthPreference: row.sentence_length_pref || 10,
        formalityLevel: row.formality_level || 0.5,
        humorFrequency: row.humor_frequency || 0.3,
        emojiUsageRate: row.emoji_usage_rate || 0.3,
        catchphrases: JSON.parse(row.catchphrases || '[]'),
        punctuationStyle: JSON.parse(row.punctuation_style || '{"exclamation":0.01,"question":0.01,"ellipsis":0,"comma":0.02}'),
        commonWords: [],
        sentenceStructurePreference: 'mixed'
      },
      emotional: {
        baselineSentiment: row.baseline_sentiment || 0.0,
        emotionalVolatility: row.emotional_volatility || 0.3,
        empathyLevel: row.empathy_level || 0.5,
        optimismScore: row.optimism_score || 0.5,
        anxietyTendency: row.anxiety_tendency || 0.3,
        angerThreshold: row.anger_threshold || 0.7,
        emotionExpressionStyle: (row.emotion_expression_style || 'mixed') as any,
        emotionDistribution: {
          joy: 0.2, sadness: 0.1, anger: 0.05,
          fear: 0.05, surprise: 0.1, neutral: 0.5
        }
      },
      cognitive: {
        analyticalVsIntuitive: row.analytical_vs_intuitive || 0.0,
        detailOriented: row.detail_oriented || 0.5,
        abstractThinking: row.abstract_thinking || 0.5,
        decisionSpeed: row.decision_speed || 0.5,
        riskTolerance: row.risk_tolerance || 0.5,
        openMindedness: row.open_mindedness || 0.7,
        creativityLevel: 0.5,
        logicalReasoning: 0.5
      },
      values: {
        priorities: new Map(),
        moralFramework: {
          fairness: 0.7, loyalty: 0.6, authority: 0.5,
          purity: 0.5, care: 0.7
        },
        lifePhilosophy: [],
        politicalLeaning: 0.0,
        religiousSpiritual: 0.3,
        environmentalConcern: 0.5,
        socialResponsibility: 0.6
      },
      social: {
        extraversionScore: row.extraversion_score || 0.5,
        relationshipMap: new Map(),
        responseTimePattern: JSON.parse(row.response_time_pattern || '{"averageDelayMinutes":30}'),
        topicPreferences: new Map(),
        conflictResolutionStyle: (row.conflict_resolution_style || 'compromise') as any,
        communicationInitiativeScore: 0.5
      },
      behavioral: {
        dailyRoutine: JSON.parse(row.daily_routine || '{}'),
        hobbyInterests: JSON.parse(row.hobby_interests || '[]'),
        consumptionPreferences: {
          brands: [], categories: [], priceRange: 'medium'
        }
      },
      metadata: {
        version: row.version || 1,
        lastTrainedAt: new Date(row.last_trained_at || Date.now()),
        trainingSamplesCount: row.training_samples_count || 0,
        confidenceScore: 0.7,
        createdAt: new Date(row.created_at || Date.now()),
        updatedAt: new Date(row.updated_at || Date.now())
      }
    };

    // 加载价值观优先级
    const valueRows = this.db.prepare(`
      SELECT priority_key, priority_value 
      FROM user_value_systems 
      WHERE user_id = ?
    `).all(userId) as any[];

    valueRows.forEach(v => {
      personality.values.priorities.set(v.priority_key, v.priority_value);
    });

    return personality;
  }

  /**
   * 获取关系档案
   */
  private async getRelationshipProfile(
    userId: string,
    personIdentifier: string
  ): Promise<RelationshipProfile | null> {
    const row = this.db.prepare(`
      SELECT * FROM user_relationships 
      WHERE user_id = ? AND person_identifier = ?
    `).get(userId, personIdentifier) as any;

    if (!row) return null;

    return {
      personIdentifier: row.person_identifier,
      personName: row.person_name,
      relationshipType: row.relationship_type || 'acquaintance',
      intimacyLevel: row.intimacy_level || 0.3,
      interactionFrequency: row.interaction_frequency || 0.1,
      emotionalTone: row.emotional_tone || 0.0,
      topicsDiscussed: JSON.parse(row.topics_discussed || '[]'),
      communicationStyleAdjustments: JSON.parse(row.communication_style_adjustments || '{}'),
      totalInteractions: row.total_interactions || 0,
      lastInteractionAt: row.last_interaction_at ? new Date(row.last_interaction_at) : undefined,
      firstInteractionAt: row.first_interaction_at ? new Date(row.first_interaction_at) : undefined
    };
  }

  /**
   * 分析当前情绪状态
   */
  private analyzeEmotionalState(
    conversationHistory: ConversationMessage[],
    basePersonality: PersonalityVector
  ): EmotionalState {
    if (conversationHistory.length === 0) {
      return {
        currentEmotion: 'neutral',
        intensity: 0.5,
        duration: 0
      };
    }

    // 分析最近3条消息的情感
    const recentMessages = conversationHistory.slice(-3);
    const sentiments = recentMessages.map(msg => this.estimateSentiment(msg.content));
    
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    
    let currentEmotion = 'neutral';
    let intensity = Math.abs(avgSentiment);

    if (avgSentiment > 0.3) {
      currentEmotion = 'positive';
    } else if (avgSentiment < -0.3) {
      currentEmotion = 'negative';
    }

    // 考虑基础人格的情绪波动性
    intensity *= (1 + basePersonality.emotional.emotionalVolatility);
    intensity = Math.min(intensity, 1.0);

    return {
      currentEmotion,
      intensity,
      duration: recentMessages.length
    };
  }

  /**
   * 动态调整人格参数（核心算法）
   */
  private adjustPersonalityForContext(params: {
    base: PersonalityVector;
    relationship: RelationshipProfile | null;
    time: Date;
    emotion: EmotionalState;
    location?: string;
  }): Partial<PersonalityVector> {
    const { base, relationship, time, emotion } = params;
    const adjusted: any = JSON.parse(JSON.stringify(base)); // 深拷贝

    // 1. 根据关系亲密度调整
    if (relationship) {
      const intimacy = relationship.intimacyLevel;
      
      // 亲密关系 → 更随意、更多表情
      if (intimacy > 0.7) {
        adjusted.linguistic.formalityLevel *= 0.6;
        adjusted.linguistic.emojiUsageRate *= 1.5;
        adjusted.linguistic.humorFrequency *= 1.3;
      }
      // 疏远关系 → 更正式、更谨慎
      else if (intimacy < 0.3) {
        adjusted.linguistic.formalityLevel *= 1.4;
        adjusted.linguistic.emojiUsageRate *= 0.5;
        adjusted.linguistic.humorFrequency *= 0.7;
      }

      // 根据情感基调调整
      if (relationship.emotionalTone < -0.3) {
        adjusted.emotional.baselineSentiment -= 0.2;
      } else if (relationship.emotionalTone > 0.3) {
        adjusted.emotional.baselineSentiment += 0.1;
      }
    }

    // 2. 根据时间调整
    const hour = time.getHours();
    
    // 深夜 (23:00-6:00) → 更疲惫、更简短
    if (hour >= 23 || hour <= 6) {
      adjusted.linguistic.sentenceLengthPreference *= 0.7;
      adjusted.cognitive.decisionSpeed *= 0.8;
      adjusted.emotional.emotionalVolatility *= 1.2;
    }
    // 早晨 (6:00-9:00) → 更清醒、更积极
    else if (hour >= 6 && hour <= 9) {
      adjusted.emotional.optimismScore *= 1.2;
      adjusted.social.communicationInitiativeScore *= 1.1;
    }
    // 工作时间 (9:00-18:00) → 更正式、更专注
    else if (hour >= 9 && hour <= 18) {
      adjusted.linguistic.formalityLevel *= 1.1;
      adjusted.cognitive.analyticalVsIntuitive += 0.1;
    }

    // 3. 根据当前情绪调整
    if (emotion.intensity > 0.7) {
      if (emotion.currentEmotion === 'positive') {
        adjusted.linguistic.emojiUsageRate *= 1.5;
        adjusted.linguistic.humorFrequency *= 1.3;
      } else if (emotion.currentEmotion === 'negative') {
        adjusted.linguistic.sentenceLengthPreference *= 0.8;
        adjusted.emotional.emotionalVolatility *= 1.3;
      }
    }

    // 4. 归一化（确保所有值在合理范围内）
    this.normalizePersonality(adjusted);

    return adjusted;
  }

  /**
   * 归一化人格参数
   */
  private normalizePersonality(personality: any): void {
    // 确保 [0, 1] 范围的参数
    const clamp01 = (val: number) => Math.max(0, Math.min(1, val));

    personality.linguistic.vocabularyComplexity = clamp01(personality.linguistic.vocabularyComplexity);
    personality.linguistic.formalityLevel = clamp01(personality.linguistic.formalityLevel);
    personality.linguistic.humorFrequency = clamp01(personality.linguistic.humorFrequency);
    personality.linguistic.emojiUsageRate = clamp01(personality.linguistic.emojiUsageRate);
    
    personality.emotional.emotionalVolatility = clamp01(personality.emotional.emotionalVolatility);
    personality.emotional.empathyLevel = clamp01(personality.emotional.empathyLevel);
    personality.emotional.optimismScore = clamp01(personality.emotional.optimismScore);
    
    personality.social.extraversionScore = clamp01(personality.social.extraversionScore);

    // 确保句长不会太极端
    personality.linguistic.sentenceLengthPreference = Math.max(
      3,
      Math.min(50, personality.linguistic.sentenceLengthPreference)
    );
  }

  /**
   * 检索相关记忆
   */
  private async retrieveRelevantMemories(
    userId: string,
    query: string,
    sender: string
  ): Promise<any[]> {
    // 简化版本：从documents表检索
    const memories = this.db.prepare(`
      SELECT d.id as doc_id, d.title, d.content, d.timestamp, d.metadata
      FROM documents d
      WHERE d.user_id = ?
      AND (d.content LIKE ? OR d.title LIKE ?)
      ORDER BY d.timestamp DESC
      LIMIT 5
    `).all(userId, `%${query}%`, `%${query}%`) as any[];

    return memories.map(m => ({
      ...m,
      score: 0.8 // TODO: 实际的相似度计算
    }));
  }

  /**
   * 构建人格化Prompt
   */
  private buildPersonalityPrompt(params: {
    personality: Partial<PersonalityVector>;
    relationship: RelationshipProfile | null;
    emotionalState: EmotionalState;
    relevantMemories: any[];
    conversationHistory: ConversationMessage[];
    currentMessage: string;
  }): string {
    const { personality, relationship, emotionalState, relevantMemories, conversationHistory, currentMessage } = params;
    const p = personality as PersonalityVector;

    const relationshipDesc = relationship
      ? `
## 与对话者的关系
- 对话者: ${relationship.personName || relationship.personIdentifier}
- 关系类型: ${this.translateRelationType(relationship.relationshipType)}
- 亲密程度: ${this.describeIntimacy(relationship.intimacyLevel)}
- 情感基调: ${relationship.emotionalTone > 0 ? '友好积极' : relationship.emotionalTone < 0 ? '紧张消极' : '中性平淡'}
- 历史互动: ${relationship.totalInteractions}次对话
${relationship.topicsDiscussed.length > 0 ? `- 常聊话题: ${relationship.topicsDiscussed.slice(0, 3).join('、')}` : ''}
`
      : `
## 与对话者的关系
- 对话者身份: 陌生人或初次交流
- 建议保持礼貌and适度距离
`;

    const memoryContext = relevantMemories.length > 0
      ? `
## 相关记忆片段
${relevantMemories.map((m, i) => `${i + 1}. ${m.title || '无标题'}\n   ${(m.content || '').substring(0, 100)}...`).join('\n')}
`
      : '';

    const conversationContext = conversationHistory.length > 0
      ? `
## 最近对话上下文
${conversationHistory.slice(-3).map(msg => `${msg.role === 'user' ? '对方' : '我'}: ${msg.content}`).join('\n')}
`
      : '';

    return `
你现在要完全模拟一个真实的人（用户本人）进行对话。你的任务是让对方感觉像在and真人聊天，而不是AI。

# 核心人格特征

## Language风格
- 正式程度: ${this.describeFormalityLevel(p.linguistic!.formalityLevel)} (${(p.linguistic!.formalityLevel * 100).toFixed(0)}%)
- 平均句长: ${p.linguistic!.sentenceLengthPreference.toFixed(0)}个词 ${this.describeSentenceLength(p.linguistic!.sentenceLengthPreference)}
- 幽默感: ${this.describeHumor(p.linguistic!.humorFrequency)}
- 表情符号: ${this.describeEmojiUsage(p.linguistic!.emojiUsageRate)}
${p.linguistic!.catchphrases.length > 0 ? `- **口头禅**: ${p.linguistic!.catchphrases.slice(0, 3).join('、')} （务必自然融入）` : ''}

## 情感特征
- 基线情绪: ${this.describeSentiment(p.emotional!.baselineSentiment)}
- 当前情绪: ${emotionalState.currentEmotion} (强度: ${(emotionalState.intensity * 100).toFixed(0)}%)
- 共情能力: ${this.describeEmpathy(p.emotional!.empathyLevel)}
- 乐观倾向: ${(p.emotional!.optimismScore * 100).toFixed(0)}%

## 思维方式
- 决策风格: ${p.cognitive!.analyticalVsIntuitive > 0.3 ? '偏理性分析' : p.cognitive!.analyticalVsIntuitive < -0.3 ? '偏直觉感性' : '理性与感性平衡'}
- 表达方式: ${p.cognitive!.detailOriented > 0.6 ? '注重细节' : '善于概括'}

## 社交风格
- 性格倾向: ${p.social!.extraversionScore > 0.6 ? '外向主动' : p.social!.extraversionScore < 0.4 ? '内向谨慎' : '适度外向'}

${relationshipDesc}

${memoryContext}

${conversationContext}

---

# 重要指令

1. **严格按照上述人格特征回复**，包括：
   - 句子长度控制在${Math.floor(p.linguistic!.sentenceLengthPreference * 0.8)}-${Math.ceil(p.linguistic!.sentenceLengthPreference * 1.2)}词之间
   - 正式程度必须与设定一致（${p.linguistic!.formalityLevel > 0.7 ? '使用标准书面语' : p.linguistic!.formalityLevel < 0.3 ? '可以使用口语、缩写' : '介于书面语and口语之间'}）
   - 表情符号使用率约${(p.linguistic!.emojiUsageRate * 100).toFixed(0)}%

2. **根据关系调整态度**：
   ${relationship && relationship.intimacyLevel > 0.7 ? '- 对方是亲密好友，可以随意、开玩笑、使用昵称' : ''}
   ${relationship && relationship.intimacyLevel < 0.3 ? '- 对方关系疏远，保持礼貌and距离感' : ''}
   ${!relationship ? '- 对方是陌生人，保持友好但不过分亲密' : ''}

3. **融入口头禅**：如果有口头禅，在适当时候自然使用（不要每句都用）

4. **保持一致性**：回复内容不能与已有记忆矛盾

5. **情绪一致**：当前情绪是${emotionalState.currentEmotion}，请在回复中体现

现在，请以这个人的身份回复以下消息：

对方说: "${currentMessage}"

你的回复（只输出回复内容，不要任何解释）:
`.trim();
  }

  /**
   * 调用LLM生成回复
   */
  private async generateWithLLM(
    prompt: string,
    personality: Partial<PersonalityVector>
  ): Promise<string> {
    // TODO: 集成Gemini API
    // 这里暂时返回占位文本
    return "这是一个基于人格模拟的回复示例";
  }

  /**
   * 一致性检查
   */
  private async ensureConsistency(
    response: string,
    personality: Partial<PersonalityVector>,
    memories: any[]
  ): Promise<string> {
    // TODO: 实现一致性检查逻辑
    // 1. 检查回复长度是否符合人格设定
    // 2. 检查是否与已有记忆矛盾
    // 3. 检查情感基调是否一致
    
    return response;
  }

  /**
   * 记录推理过程（用于RLHF）
   */
  private async logInference(
    userId: string,
    context: PersonalityInferenceContext,
    response: string,
    adjustedPersonality: Partial<PersonalityVector>
  ): Promise<void> {
    // Save到personality_training_samples表
    this.db.prepare(`
      INSERT INTO personality_training_samples (
        user_id, conversation_context, target_person,
        timestamp_context, user_response
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      userId,
      JSON.stringify(context.conversationHistory),
      context.sender,
      context.currentTime.toISOString(),
      response
    );
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(
    personality: Partial<PersonalityVector>,
    memories: any[]
  ): number {
    const p = personality as PersonalityVector;
    let confidence = p.metadata?.confidenceScore || 0.5;

    // 训练样本越多，置信度越高
    if (p.metadata && p.metadata.trainingSamplesCount > 100) {
      confidence += 0.2;
    }

    // 有相关记忆，置信度提升
    if (memories.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 解释推理过程
   */
  private explainReasoning(
    personality: Partial<PersonalityVector>,
    relationship: RelationshipProfile | null
  ): string {
    const reasons: string[] = [];
    const p = personality as PersonalityVector;

    if (relationship) {
      reasons.push(`根据与${relationship.personName || '对方'}的关系（${relationship.relationshipType}）调整了语气`);
    }

    if (p.linguistic!.formalityLevel > 0.7) {
      reasons.push('使用较正式的Language风格');
    } else if (p.linguistic!.formalityLevel < 0.3) {
      reasons.push('使用轻松随意的Language风格');
    }

    if (p.emotional!.baselineSentiment > 0.3) {
      reasons.push('保持积极乐观的情绪基调');
    }

    return reasons.join('；');
  }

  // ==========================================
  // 辅助方法：描述性文本生成
  // ==========================================

  private estimateSentiment(text: string): number {
    // 简单的情感估算
    const positive = ['好', '棒', '开心', '喜欢', '爱', '谢谢', 'good', 'great', 'love', 'happy', '😊', '😄', '❤️'];
    const negative = ['不好', '糟糕', '难过', '讨厌', '烦', 'bad', 'sad', 'hate', '😢', '😭', '😠'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positive.forEach(word => {
      if (lowerText.includes(word)) score += 0.2;
    });
    
    negative.forEach(word => {
      if (lowerText.includes(word)) score -= 0.2;
    });
    
    return Math.max(-1, Math.min(1, score));
  }

  private translateRelationType(type: string): string {
    const map: Record<string, string> = {
      'family': '家人',
      'close_friend': '亲密好友',
      'friend': '朋友',
      'colleague': '同事',
      'acquaintance': '熟人',
      'stranger': '陌生人',
      'romantic_partner': '恋人',
      'mentor': '导师',
      'mentee': '学生'
    };
    return map[type] || type;
  }

  private describeIntimacy(level: number): string {
    if (level > 0.8) return '非常亲密';
    if (level > 0.6) return '较为亲密';
    if (level > 0.4) return '一般亲密';
    if (level > 0.2) return '不太亲密';
    return '疏远';
  }

  private describeFormalityLevel(level: number): string {
    if (level > 0.8) return '非常正式（书面语为主）';
    if (level > 0.6) return '较为正式（标准表达）';
    if (level > 0.4) return '中等正式（口语and书面语混合）';
    if (level > 0.2) return '较为随意（口语为主）';
    return '非常随意（网络用语、缩写）';
  }

  private describeSentenceLength(length: number): string {
    if (length > 20) return '（倾向长句，详细表达）';
    if (length > 12) return '（句长适中）';
    return '（倾向短句，简洁直接）';
  }

  private describeHumor(frequency: number): string {
    if (frequency > 0.6) return '经常开玩笑、幽默';
    if (frequency > 0.3) return '偶尔幽默';
    return '较少使用幽默';
  }

  private describeEmojiUsage(rate: number): string {
    if (rate > 0.6) return '频繁使用表情符号';
    if (rate > 0.3) return '适度使用表情符号';
    return '较少使用表情符号';
  }

  private describeSentiment(sentiment: number): string {
    if (sentiment > 0.3) return '积极乐观';
    if (sentiment < -0.3) return '消极悲观';
    return '中性平and';
  }

  private describeEmpathy(level: number): string {
    if (level > 0.7) return '非常善解人意';
    if (level > 0.5) return '能够共情';
    return '较少表现共情';
  }
}
