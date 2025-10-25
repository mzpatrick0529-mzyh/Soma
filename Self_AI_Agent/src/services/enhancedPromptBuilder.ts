/**
 * Phase 3.4: Enhanced Prompt Builder
 * 融合人格/关系/上下文/记忆的动态prompt生成
 */

import type { SelectedPersona } from './personaSelector.js';
import type { MemorySnapshot } from './conversationMemory.js';
import type { ConversationContext } from './contextDetector.js';

export interface PromptComponents {
  systemPrompt: string;
  personaDescription: string;
  contextDescription: string;
  memoryDescription: string;
  styleGuidelines: string;
}

export class EnhancedPromptBuilder {
  /**
   * 构建完整的增强型prompt
   */
  buildPrompt(
    persona: SelectedPersona,
    context: ConversationContext,
    memory: MemorySnapshot,
    userMessage: string
  ): string {
    const components = this.buildComponents(persona, context, memory);
    
    return `${components.systemPrompt}

${components.personaDescription}

${components.contextDescription}

${components.memoryDescription}

${components.styleGuidelines}

User: ${userMessage}`;
  }

  /**
   * 构建prompt组件
   */
  private buildComponents(
    persona: SelectedPersona,
    context: ConversationContext,
    memory: MemorySnapshot
  ): PromptComponents {
    return {
      systemPrompt: this.buildSystemPrompt(),
      personaDescription: this.buildPersonaDescription(persona),
      contextDescription: this.buildContextDescription(context),
      memoryDescription: this.buildMemoryDescription(memory),
      styleGuidelines: this.buildStyleGuidelines(persona, context),
    };
  }

  private buildSystemPrompt(): string {
    return `You are a digital persona that represents a specific user. Your goal is to respond exactly as the user would, matching their personality, communication style, knowledge, and relationships.`;
  }

  private buildPersonaDescription(persona: SelectedPersona): string {
    const parts: string[] = ['## Persona Profile'];
    
    if (persona.coreIdentity.traits) {
      const traits = persona.coreIdentity.traits;
      parts.push(`Core Identity: ${JSON.stringify(traits)}`);
    }
    
    if (persona.linguisticSignature.traits) {
      const ls = persona.linguisticSignature.traits;
      parts.push(`Language Style: emoji=${ls.emojiUsage || 0}, formality=${ls.formality || 0}`);
    }
    
    if (persona.emotionalProfile.traits) {
      const ep = persona.emotionalProfile.traits;
      parts.push(`Emotional: mood=${ep.baselineMood || 'neutral'}, expressiveness=${ep.expressiveness || 0}`);
    }
    
    return parts.join('\n');
  }

  private buildContextDescription(context: ConversationContext): string {
    const parts: string[] = ['## Current Context'];
    
    if (context.social.targetPerson) {
      parts.push(`Talking to: ${context.social.targetPerson}`);
      parts.push(`Relationship: ${context.social.relationshipType || 'unknown'}`);
      parts.push(`Intimacy: ${((context.social.intimacyLevel || 0) * 100).toFixed(0)}%`);
    }
    
    if (context.temporal.timeOfDay) {
      parts.push(`Time: ${context.temporal.timeOfDay}`);
    }
    
    if (context.emotional.detectedMood) {
      parts.push(`Detected mood: ${context.emotional.detectedMood}`);
    }
    
    return parts.join('\n');
  }

  private buildMemoryDescription(memory: MemorySnapshot): string {
    const parts: string[] = ['## Conversation Memory'];
    
    if (memory.shortTerm.length > 0) {
      parts.push(`Recent turns (${memory.shortTerm.length}):`);
      memory.shortTerm.slice(-3).forEach(turn => {
        parts.push(`[${turn.role}]: ${turn.content.slice(0, 100)}`);
      });
    }
    
    if (memory.currentTopic) {
      parts.push(`Topic: ${memory.currentTopic.topic}`);
    }
    
    if (memory.longTerm) {
      parts.push(`History with ${memory.longTerm.targetPerson}: ${memory.longTerm.totalConversations} conversations`);
    }
    
    return parts.join('\n');
  }

  private buildStyleGuidelines(persona: SelectedPersona, context: ConversationContext): string {
    const guidelines: string[] = ['## Style Guidelines'];
    
    guidelines.push(...persona.contextualAdjustments);
    
    return guidelines.join('\n');
  }
}