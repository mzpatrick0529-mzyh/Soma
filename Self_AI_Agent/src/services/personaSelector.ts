/**
 * Phase 3.2: Context-Aware Inference Engine - Persona Selector
 * 
 * 基于上下文动态选择人格特质组合:
 * - 根据社交场景选择合适的人格层面
 * - 根据对话对象调整表达方式
 * - 根据时间和情绪状态调整基调
 */

import { Database } from '../db/index.js';
import { ConversationContext } from './contextDetector.js';

export interface PersonaLayer {
  layerName: string;
  weight: number; // 0-1, 当前场景下的权重
  traits: { [key: string]: any };
}

export interface SelectedPersona {
  coreIdentity: PersonaLayer;
  cognitiveStyle: PersonaLayer;
  linguisticSignature: PersonaLayer;
  emotionalProfile: PersonaLayer;
  socialDynamics: PersonaLayer;
  temporalContext: PersonaLayer;
  overallPersonaId: string;
  contextualAdjustments: string[];
}

export class PersonaSelector {
  private db: Database;
  private cachedPersona: any = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1小时

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 根据上下文选择合适的人格配置
   */
  async selectPersona(
    userId: string,
    context: ConversationContext
  ): Promise<SelectedPersona> {
    // 加载基础人格档案
    const basePersona = await this.loadBasePersona(userId);

    if (!basePersona) {
      throw new Error(`No persona profile found for user ${userId}`);
    }

    // 根据上下文计算各层权重
    const weights = this.calculateLayerWeights(context);

    // 构建分层人格
    const coreIdentity = this.buildLayer(
      'coreIdentity',
      basePersona.core_identity_traits,
      weights.coreIdentity,
      context
    );

    const cognitiveStyle = this.buildLayer(
      'cognitiveStyle',
      basePersona.cognitive_style_traits,
      weights.cognitiveStyle,
      context
    );

    const linguisticSignature = this.buildLayer(
      'linguisticSignature',
      basePersona.linguistic_signature_traits,
      weights.linguisticSignature,
      context
    );

    const emotionalProfile = this.buildLayer(
      'emotionalProfile',
      basePersona.emotional_profile_traits,
      weights.emotionalProfile,
      context
    );

    const socialDynamics = this.buildLayer(
      'socialDynamics',
      basePersona.social_dynamics_traits,
      weights.socialDynamics,
      context
    );

    const temporalContext = this.buildLayer(
      'temporalContext',
      basePersona.temporal_context_traits,
      weights.temporalContext,
      context
    );

    // 生成上下文调整建议
    const contextualAdjustments = this.generateContextualAdjustments(context);

    return {
      coreIdentity,
      cognitiveStyle,
      linguisticSignature,
      emotionalProfile,
      socialDynamics,
      temporalContext,
      overallPersonaId: basePersona.user_id,
      contextualAdjustments,
    };
  }

  /**
   * 加载基础人格档案 (带缓存)
   */
  private async loadBasePersona(userId: string): Promise<any | null> {
    const now = Date.now();

    // 检查缓存
    if (this.cachedPersona && this.cacheExpiry > now) {
      return this.cachedPersona;
    }

    // 从数据库加载
    const persona = this.db
      .prepare(
        `
      SELECT * FROM persona_profiles 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `
      )
      .get(userId);

    if (persona) {
      // 解析JSON字段
      const parsed = {
        ...persona,
        core_identity_traits: this.parseJSON(persona.core_identity_traits),
        cognitive_style_traits: this.parseJSON(persona.cognitive_style_traits),
        linguistic_signature_traits: this.parseJSON(persona.linguistic_signature_traits),
        emotional_profile_traits: this.parseJSON(persona.emotional_profile_traits),
        social_dynamics_traits: this.parseJSON(persona.social_dynamics_traits),
        temporal_context_traits: this.parseJSON(persona.temporal_context_traits),
      };

      this.cachedPersona = parsed;
      this.cacheExpiry = now + this.CACHE_TTL;

      return parsed;
    }

    return null;
  }

  /**
   * 根据上下文计算各层权重
   */
  private calculateLayerWeights(context: ConversationContext): {
    [key: string]: number;
  } {
    const weights = {
      coreIdentity: 1.0, // 核心身份始终最高权重
      cognitiveStyle: 0.8,
      linguisticSignature: 0.9,
      emotionalProfile: 0.7,
      socialDynamics: 0.85,
      temporalContext: 0.6,
    };

    // 社交场景调整
    if (context.social.socialSetting === 'professional') {
      weights.cognitiveStyle = 1.0; // 专业场景强化认知风格
      weights.emotionalProfile = 0.5; // 降低情感表达
      weights.socialDynamics = 0.95; // 强化社交动态
    } else if (context.social.socialSetting === 'personal') {
      weights.emotionalProfile = 1.0; // 个人场景强化情感
      weights.socialDynamics = 0.7; // 降低社交规范
    }

    // 亲密度调整
    if (context.social.intimacyLevel !== undefined) {
      if (context.social.intimacyLevel > 0.8) {
        // 高亲密度: 更自然、情感化
        weights.linguisticSignature = 1.0;
        weights.emotionalProfile = 1.0;
      } else if (context.social.intimacyLevel < 0.3) {
        // 低亲密度: 更正式、谨慎
        weights.cognitiveStyle = 0.9;
        weights.socialDynamics = 1.0;
      }
    }

    // 情绪状态调整
    if (context.emotional.detectedMood) {
      if (['sad', 'anxious'].includes(context.emotional.detectedMood)) {
        weights.emotionalProfile = 1.0; // 强化情感支持
      } else if (context.emotional.detectedMood === 'excited') {
        weights.linguisticSignature = 1.0; // 强化语言风格
      }
    }

    // 时间上下文调整
    if (context.temporal.timeOfDay === 'late-night') {
      weights.emotionalProfile = 0.85; // 深夜略降低情感强度
      weights.cognitiveStyle = 0.7; // 降低深度思考
    }

    return weights;
  }

  /**
   * 构建单层人格
   */
  private buildLayer(
    layerName: string,
    traits: any,
    weight: number,
    context: ConversationContext
  ): PersonaLayer {
    if (!traits) {
      return { layerName, weight, traits: {} };
    }

    // 根据上下文调整特质
    const adjustedTraits = { ...traits };

    // 语言特征调整
    if (layerName === 'linguisticSignature') {
      // 专业场景降低emoji使用
      if (context.social.socialSetting === 'professional') {
        if (adjustedTraits.emojiUsage) {
          adjustedTraits.emojiUsage = Math.max(
            0,
            (adjustedTraits.emojiUsage as number) - 0.3
          );
        }
      }

      // 低亲密度降低俚语使用
      if (context.social.intimacyLevel !== undefined && context.social.intimacyLevel < 0.4) {
        if (adjustedTraits.slangUsage) {
          adjustedTraits.slangUsage = Math.max(0, (adjustedTraits.slangUsage as number) - 0.2);
        }
      }
    }

    // 情感特征调整
    if (layerName === 'emotionalProfile') {
      // 根据对方情绪调整表达
      if (context.emotional.detectedMood === 'sad' && adjustedTraits.empathyLevel) {
        adjustedTraits.empathyLevel = Math.min(
          1.0,
          (adjustedTraits.empathyLevel as number) + 0.2
        );
      }
    }

    // 社交动态调整
    if (layerName === 'socialDynamics') {
      // 大群组降低主导性
      if (context.social.groupSize === 'large-group' && adjustedTraits.dominanceLevel) {
        adjustedTraits.dominanceLevel = Math.max(
          0,
          (adjustedTraits.dominanceLevel as number) - 0.2
        );
      }
    }

    return {
      layerName,
      weight,
      traits: adjustedTraits,
    };
  }

  /**
   * 生成上下文调整建议
   */
  private generateContextualAdjustments(context: ConversationContext): string[] {
    const adjustments: string[] = [];

    // 社交场景建议
    if (context.social.socialSetting === 'professional') {
      adjustments.push('使用更正式的语言风格');
      adjustments.push('减少emoji和表情符号');
      adjustments.push('保持专业礼貌的语气');
    } else if (context.social.socialSetting === 'personal') {
      adjustments.push('使用更轻松自然的语言');
      adjustments.push('可以表达更多情感');
    }

    // 亲密度建议
    if (context.social.intimacyLevel !== undefined) {
      if (context.social.intimacyLevel > 0.8) {
        adjustments.push('可以使用昵称和私密用语');
        adjustments.push('表达更深层的情感和想法');
      } else if (context.social.intimacyLevel < 0.3) {
        adjustments.push('保持适当距离感');
        adjustments.push('避免过于私人的话题');
      }
    }

    // 情绪建议
    if (context.emotional.detectedMood) {
      if (context.emotional.detectedMood === 'sad') {
        adjustments.push('提供情感支持和安慰');
        adjustments.push('使用温暖关怀的语气');
      } else if (context.emotional.detectedMood === 'angry') {
        adjustments.push('保持冷静理性');
        adjustments.push('避免激化情绪');
      } else if (context.emotional.detectedMood === 'excited') {
        adjustments.push('匹配对方的兴奋程度');
        adjustments.push('使用积极活跃的语言');
      }
    }

    // 时间建议
    if (context.temporal.timeOfDay === 'late-night') {
      adjustments.push('考虑简洁回复,避免复杂讨论');
    } else if (context.temporal.timeOfDay === 'morning') {
      adjustments.push('可以使用积极活力的语气');
    }

    // 特殊日期建议
    if (context.temporal.isSpecialDate) {
      adjustments.push(`考虑${context.temporal.specialDateType}的特殊氛围`);
    }

    return adjustments;
  }

  /**
   * 将选定的人格转换为可用的prompt描述
   */
  convertPersonaToPromptDescription(persona: SelectedPersona): string {
    const descriptions: string[] = [];

    // 核心身份
    if (persona.coreIdentity.traits) {
      descriptions.push(`核心身份: ${JSON.stringify(persona.coreIdentity.traits)}`);
    }

    // 认知风格
    if (persona.cognitiveStyle.traits) {
      descriptions.push(`认知风格: ${JSON.stringify(persona.cognitiveStyle.traits)}`);
    }

    // 语言特征
    if (persona.linguisticSignature.traits) {
      const ls = persona.linguisticSignature.traits;
      descriptions.push(
        `语言风格: emoji使用度${ls.emojiUsage || 0}, 正式度${ls.formality || 0}, 词汇丰富度${ls.vocabularyLevel || 0}`
      );
    }

    // 情感特征
    if (persona.emotionalProfile.traits) {
      const ep = persona.emotionalProfile.traits;
      descriptions.push(
        `情感表达: 基线情绪${ep.baselineMood || 'neutral'}, 表达度${ep.expressiveness || 0}, 共情力${ep.empathyLevel || 0}`
      );
    }

    // 社交动态
    if (persona.socialDynamics.traits) {
      descriptions.push(`社交动态: ${JSON.stringify(persona.socialDynamics.traits)}`);
    }

    // 上下文调整
    if (persona.contextualAdjustments.length > 0) {
      descriptions.push(`当前场景建议: ${persona.contextualAdjustments.join('; ')}`);
    }

    return descriptions.join('\n');
  }

  /**
   * 解析JSON (容错)
   */
  private parseJSON(jsonString: any): any {
    if (typeof jsonString === 'object') {
      return jsonString;
    }

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return {};
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedPersona = null;
    this.cacheExpiry = 0;
  }
}
