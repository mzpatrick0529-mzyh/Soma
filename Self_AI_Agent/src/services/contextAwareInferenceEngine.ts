/**
 * Phase 3.7: Context-Aware Inference Engine
 * 整合所有Phase 3模块的上下文感知推理引擎
 */

import { ContextDetector, type ConversationContext } from './contextDetector.js';
import { PersonaSelector, type SelectedPersona } from './personaSelector.js';
import { ConversationMemory, type MemorySnapshot } from './conversationMemory.js';
import { EnhancedPromptBuilder } from './enhancedPromptBuilder.js';
import { StyleCalibrator, type StyleFeatures } from './styleCalibrator.js';
import { FactChecker } from './factChecker.js';
import type { Database } from '../db/index.js';

export interface InferenceRequest {
  userId: string;
  conversationId: string;
  userMessage: string;
  targetPerson?: string;
  metadata?: {
    timestamp?: number;
    location?: string;
    participants?: string[];
  };
}

export interface InferenceResponse {
  response: string;
  context: ConversationContext;
  persona: SelectedPersona;
  memory: MemorySnapshot;
  styleConsistency: boolean;
  factConsistency: boolean;
  confidence: number;
}

export class ContextAwareInferenceEngine {
  private db: Database;
  private contextDetector: ContextDetector;
  private personaSelector: PersonaSelector;
  private conversationMemory: ConversationMemory;
  private promptBuilder: EnhancedPromptBuilder;
  private styleCalibrator: StyleCalibrator;
  private factChecker: FactChecker;

  constructor(db: Database) {
    this.db = db;
    this.contextDetector = new ContextDetector(db);
    this.personaSelector = new PersonaSelector(db);
    this.conversationMemory = new ConversationMemory(db);
    this.promptBuilder = new EnhancedPromptBuilder();
    this.styleCalibrator = new StyleCalibrator();
    this.factChecker = new FactChecker(db);
  }

  /**
   * 执行上下文感知推理
   */
  async infer(request: InferenceRequest): Promise<InferenceResponse> {
    // Step 1: 检测上下文
    const context = await this.contextDetector.detectContext(
      request.userMessage,
      {
        timestamp: request.metadata?.timestamp || Date.now(),
        sender: request.targetPerson,
        location: request.metadata?.location,
        participants: request.metadata?.participants,
        conversationId: request.conversationId,
      }
    );

    // Step 2: 选择人格配置
    const persona = await this.personaSelector.selectPersona(request.userId, context);

    // Step 3: 获取记忆快照
    const memory = await this.conversationMemory.getMemorySnapshot(
      request.userId,
      request.conversationId,
      request.targetPerson
    );

    // Step 4: 构建增强prompt
    const enhancedPrompt = this.promptBuilder.buildPrompt(
      persona,
      context,
      memory,
      request.userMessage
    );

    // Step 5: 调用LLM生成响应 (这里需要实际的LLM集成)
    const generatedResponse = await this.generateResponse(enhancedPrompt);

    // Step 6: 风格校准
    const targetStyle = this.extractTargetStyle(persona);
    const styleCalibration = this.styleCalibrator.calibrateStyle(
      generatedResponse,
      targetStyle
    );
    const finalResponse = styleCalibration.calibratedText || generatedResponse;

    // Step 7: 事实验证
    const factCheck = await this.factChecker.checkFactConsistency(
      request.userId,
      finalResponse,
      request.userMessage
    );

    // Step 8: 保存对话记忆
    await this.saveConversationTurn(request, context, finalResponse);

    // 计算综合置信度
    const confidence = this.calculateConfidence(
      styleCalibration.isConsistent,
      factCheck.isConsistent,
      factCheck.confidence
    );

    return {
      response: finalResponse,
      context,
      persona,
      memory,
      styleConsistency: styleCalibration.isConsistent,
      factConsistency: factCheck.isConsistent,
      confidence,
    };
  }

  /**
   * 生成响应 (占位符 - 需要实际LLM集成)
   */
  private async generateResponse(prompt: string): Promise<string> {
    // TODO: 集成实际的LLM API (Gemini 2.0 Flash)
    // 这里返回一个简单的占位响应
    return 'This is a placeholder response. Integrate with Gemini API for actual generation.';
  }

  /**
   * 从人格配置中提取目标风格
   */
  private extractTargetStyle(persona: SelectedPersona): StyleFeatures {
    const linguisticTraits = persona.linguisticSignature.traits;
    
    return {
      emojiCount: Math.round((linguisticTraits.emojiUsage || 0) * 5),
      punctuationDensity: (linguisticTraits.punctuationUsage || 0.05),
      averageLength: linguisticTraits.avgMessageLength || 100,
      slangCount: Math.round((linguisticTraits.slangUsage || 0) * 3),
      formalityScore: linguisticTraits.formality || 0.5,
    };
  }

  /**
   * 保存对话轮次
   */
  private async saveConversationTurn(
    request: InferenceRequest,
    context: ConversationContext,
    response: string
  ): Promise<void> {
    // 获取当前轮次编号
    const currentTurn = await this.getCurrentTurnNumber(request.conversationId);

    // 保存用户消息
    await this.conversationMemory.saveTurn(
      request.userId,
      request.conversationId,
      request.targetPerson,
      {
        role: 'user',
        content: request.userMessage,
        timestamp: request.metadata?.timestamp || Date.now(),
        contextSnapshot: context,
      },
      currentTurn
    );

    // 保存助手响应
    await this.conversationMemory.saveTurn(
      request.userId,
      request.conversationId,
      request.targetPerson,
      {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        contextSnapshot: context,
      },
      currentTurn + 1
    );
  }

  /**
   * 获取当前对话轮次编号
   */
  private async getCurrentTurnNumber(conversationId: string): Promise<number> {
    const result = this.db
      .prepare(
        `
      SELECT MAX(turn_number) as max_turn 
      FROM conversation_memory 
      WHERE conversation_id = ?
    `
      )
      .get(conversationId) as { max_turn: number | null } | undefined;

    return (result?.max_turn || 0) + 1;
  }

  /**
   * 计算综合置信度
   */
  private calculateConfidence(
    styleConsistent: boolean,
    factConsistent: boolean,
    factConfidence: number
  ): number {
    let confidence = 0.7; // 基础置信度

    if (styleConsistent) confidence += 0.15;
    if (factConsistent) confidence += 0.15;
    
    // 加权事实置信度
    confidence = confidence * factConfidence;

    return Math.min(confidence, 1.0);
  }
}
