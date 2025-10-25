/**
 * Phase 3.6: Fact Checker
 * 验证生成内容与记忆数据的事实一致性
 */

import type { Database } from '../db/index.js';

export interface FactCheckResult {
  isConsistent: boolean;
  conflicts: string[];
  confidence: number;
}

export class FactChecker {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * 检查生成文本与用户记忆的事实一致性
   */
  async checkFactConsistency(
    userId: string,
    generatedText: string,
    context?: string
  ): Promise<FactCheckResult> {
    const extractedFacts = this.extractFacts(generatedText);
    const conflicts: string[] = [];
    let totalChecks = 0;
    let passedChecks = 0;

    for (const fact of extractedFacts) {
      totalChecks++;
      const isConsistent = await this.verifyFact(userId, fact);
      if (isConsistent) {
        passedChecks++;
      } else {
        conflicts.push(`Potential inconsistency: "${fact}"`);
      }
    }

    const confidence = totalChecks > 0 ? passedChecks / totalChecks : 1.0;

    return {
      isConsistent: conflicts.length === 0,
      conflicts,
      confidence,
    };
  }

  /**
   * 从文本中提取事实性陈述
   */
  private extractFacts(text: string): string[] {
    const facts: string[] = [];
    
    // 提取包含"我"的陈述 (可能是关于用户自己的事实)
    const iStatements = text.match(/我[^。!?,;，!?；]*[。!?,;,!?；]/g) || [];
    facts.push(...iStatements.map(s => s.trim()));
    
    // 提取包含具体时间/地点的陈述
    const timeLocationStatements = text.match(/[在去到][^。!?]*[。!?]/g) || [];
    facts.push(...timeLocationStatements.map(s => s.trim()));
    
    // 提取包含人名的陈述
    const personStatements = text.match(/[A-Z][a-z]+[^。!?]*[。!?]/g) || [];
    facts.push(...personStatements.map(s => s.trim()));
    
    return facts.slice(0, 10); // 限制最多检查10个事实
  }

  /**
   * 验证单个事实
   */
  private async verifyFact(userId: string, fact: string): Promise<boolean> {
    // 从记忆数据库搜索相关内容
    const memories = this.db
      .prepare(
        `
      SELECT content 
      FROM memories 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 100
    `
      )
      .all(userId) as Array<{ content: string }>;

    // 提取事实中的关键词
    const keywords = this.extractKeywords(fact);
    
    // 检查是否有记忆包含这些关键词
    let matchCount = 0;
    for (const memory of memories) {
      const lowerContent = memory.content.toLowerCase();
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          matchCount++;
          break;
        }
      }
    }

    // 如果至少有10%的记忆包含相关关键词，认为是一致的
    return matchCount >= Math.min(memories.length * 0.1, 5);
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 移除常见停用词
    const stopWords = new Set(['我', '的', '了', '是', '在', '和', '有', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and']);
    
    const words = text.split(/[\s,，.。!?！?;；]+/);
    const keywords = words.filter(word => {
      const lower = word.toLowerCase();
      return word.length > 1 && !stopWords.has(lower);
    });
    
    return keywords.slice(0, 5); // 最多5个关键词
  }

  /**
   * 检查与特定人的关系一致性
   */
  async checkRelationshipConsistency(
    userId: string,
    targetPerson: string,
    generatedText: string
  ): Promise<boolean> {
    // 获取关系档案
    const relationship = this.db
      .prepare(
        `
      SELECT intimacy_level, relationship_type 
      FROM relationship_profiles 
      WHERE user_id = ? AND target_person = ?
    `
      )
      .get(userId, targetPerson) as
      | { intimacy_level: number; relationship_type: string }
      | undefined;

    if (!relationship) {
      return true; // 没有关系记录，无法验证
    }

    // 检查语气是否符合亲密度
    const textFormality = this.assessFormality(generatedText);
    const expectedFormality = relationship.intimacy_level < 0.5 ? 'formal' : 'casual';

    return textFormality === expectedFormality || textFormality === 'neutral';
  }

  /**
   * 评估文本的正式程度
   */
  private assessFormality(text: string): 'formal' | 'casual' | 'neutral' {
    const formalIndicators = ['please', 'kindly', 'would', 'could', '请', '您'];
    const casualIndicators = ['yeah', 'nope', 'hey', '嗯', '哦'];

    const lowerText = text.toLowerCase();
    let formalCount = 0;
    let casualCount = 0;

    for (const indicator of formalIndicators) {
      if (lowerText.includes(indicator)) formalCount++;
    }

    for (const indicator of casualIndicators) {
      if (lowerText.includes(indicator)) casualCount++;
    }

    if (formalCount > casualCount + 1) return 'formal';
    if (casualCount > formalCount + 1) return 'casual';
    return 'neutral';
  }
}
