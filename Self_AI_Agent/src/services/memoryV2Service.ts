/**
 * Memory V2.0 Service - AI-Native Memory Architecture
 * 三层记忆系统的TypeScript接口
 * 
 * @version 2.0.0
 */

import { spawn } from 'child_process';
import path from 'path';
import { db } from '../db/index.js';

// ============================================
// Type definitions
// ============================================

export interface L0Memory {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  source: string;
  sentiment_score?: number;
  entities?: string[];
  keywords?: string[];
  importance: number;
}

export interface L1Cluster {
  id: string;
  userId: string;
  clusterName: string;
  keywords: Array<{ word: string; score: number }>;
  memoryCount: number;
  emotionalTone: number;
  importanceScore: number;
  timeRange: { start: Date; end: Date };
}

export interface L2Biography {
  id: string;
  userId: string;
  identityCore: string[];
  identitySummary: string;
  narrativeFirstPerson: string;
  narrativeThirdPerson: string;
  coreValues: Array<{ value: string; score: number }>;
  relationshipMap: any[];
  linguisticSignature: any;
  thinkingPatterns: any;
  communicationStyle: any;
  emotionalBaseline: any;
  version: number;
  qualityScore: number;
}

export interface GenerationContext {
  userId: string;
  currentInput: string;
  conversationHistory: Array<{ role: string; content: string }>;
  partnerId?: string;
  partnerName?: string;
  timestamp?: Date;
  scene?: string;
}

export interface GenerationResult {
  response: string;
  alignmentScore: {
    totalScore: number;
    linguisticScore: number;
    emotionalScore: number;
    valueScore: number;
    factualScore: number;
    confidence: number;
  };
  generationTime: number;
  retrievedMemoriesCount: {
    l0: number;
    l1: number;
    l2: boolean;
  };
}

// ============================================
// Memory V2 Service
// ============================================

export class MemoryV2Service {
  private dbPath: string;
  private pythonScriptPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'self_agent.db');
    this.pythonScriptPath = path.join(process.cwd(), 'src/ml');
  }

  // ----------------------------------------
  // L0: 原始记忆管理
  // ----------------------------------------

  /**
   * 存储原始记忆 (调用Python HMM)
   */
  async storeMemory(
    userId: string,
    content: string,
    source: string,
    conversationId?: string,
    metadata?: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath, 'hierarchical_memory_manager.py');
      
      const args = [
        pythonScript,
        '--db-path', this.dbPath,
        '--user-id', userId,
        '--action', 'store',
        '--content', content,
        '--source', source
      ];

      if (conversationId) {
        args.push('--conversation-id', conversationId);
      }

      const python = spawn('python3', args);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result.memory_id);
          } catch (e) {
            resolve(output.trim());
          }
        } else {
          reject(new Error(`Python script failed: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * 检索L0记忆
   */
  async retrieveL0Memories(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<L0Memory[]> {
    const stmt = db.prepare(`
      SELECT 
        id, user_id, content, timestamp, source, 
        sentiment_score, entities, keywords, importance
      FROM l0_raw_memories
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const rows = stmt.all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      timestamp: new Date(row.timestamp),
      source: row.source,
      sentiment_score: row.sentiment_score,
      entities: row.entities ? JSON.parse(row.entities) : [],
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      importance: row.importance
    }));
  }

  /**
   * 全文搜索记忆
   */
  async searchMemories(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<L0Memory[]> {
    const stmt = db.prepare(`
      SELECT 
        m.id, m.user_id, m.content, m.timestamp, m.source,
        m.sentiment_score, m.entities, m.keywords, m.importance
      FROM l0_memories_fts fts
      JOIN l0_raw_memories m ON fts.rowid = m.rowid
      WHERE fts.content_fts MATCH ?
        AND m.user_id = ?
      ORDER BY rank
      LIMIT ?
    `);

    const rows = stmt.all(query, userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      timestamp: new Date(row.timestamp),
      source: row.source,
      sentiment_score: row.sentiment_score,
      entities: row.entities ? JSON.parse(row.entities) : [],
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      importance: row.importance
    }));
  }

  // ----------------------------------------
  // L1: Theme聚类管理
  // ----------------------------------------

  /**
   * 运行聚类 (调用Python HMM)
   */
  async runClustering(userId: string): Promise<{ clusterCount: number; message: string }> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath, 'hierarchical_memory_manager.py');
      
      const args = [
        pythonScript,
        '--db-path', this.dbPath,
        '--user-id', userId,
        '--action', 'cluster'
      ];

      const python = spawn('python3', args);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            resolve({ clusterCount: 0, message: output.trim() });
          }
        } else {
          reject(new Error(`Clustering failed: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * 获取用户的Theme聚类
   */
  async getClusters(userId: string, limit: number = 10): Promise<L1Cluster[]> {
    const stmt = db.prepare(`
      SELECT 
        id, user_id, cluster_name, keywords, memory_count,
        emotional_tone, importance_score, time_range
      FROM l1_memory_clusters
      WHERE user_id = ?
      ORDER BY importance_score DESC
      LIMIT ?
    `);

    const rows = stmt.all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      clusterName: row.cluster_name,
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      memoryCount: row.memory_count,
      emotionalTone: row.emotional_tone,
      importanceScore: row.importance_score,
      timeRange: row.time_range ? JSON.parse(row.time_range) : { start: new Date(), end: new Date() }
    }));
  }

  /**
   * 获取聚类的代表性记忆
   */
  async getClusterShades(clusterId: string, limit: number = 5): Promise<L0Memory[]> {
    const stmt = db.prepare(`
      SELECT 
        m.id, m.user_id, m.content, m.timestamp, m.source,
        m.sentiment_score, m.entities, m.keywords, m.importance
      FROM l1_memory_shades s
      JOIN l0_raw_memories m ON s.memory_id = m.id
      WHERE s.cluster_id = ?
      ORDER BY s.representativeness DESC
      LIMIT ?
    `);

    const rows = stmt.all(clusterId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      timestamp: new Date(row.timestamp),
      source: row.source,
      sentiment_score: row.sentiment_score,
      entities: row.entities ? JSON.parse(row.entities) : [],
      keywords: row.keywords ? JSON.parse(row.keywords) : [],
      importance: row.importance
    }));
  }

  // ----------------------------------------
  // L2: 传记管理
  // ----------------------------------------

  /**
   * 生成传记 (调用Python HMM)
   */
  async generateBiography(userId: string): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath, 'hierarchical_memory_manager.py');
      
      const args = [
        pythonScript,
        '--db-path', this.dbPath,
        '--user-id', userId,
        '--action', 'biography'
      ];

      const python = spawn('python3', args);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            resolve({ success: true, message: output.trim() });
          }
        } else {
          reject(new Error(`Biography generation failed: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * 获取用户传记
   */
  async getBiography(userId: string): Promise<L2Biography | null> {
    const stmt = db.prepare(`
      SELECT 
        id, user_id, identity_core, identity_summary,
        narrative_first_person, narrative_third_person,
        core_values, relationship_map, linguistic_signature,
        thinking_patterns, communication_style, emotional_baseline,
        version, quality_score
      FROM l2_biography
      WHERE user_id = ?
      ORDER BY version DESC
      LIMIT 1
    `);

    const row = stmt.get(userId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      identityCore: row.identity_core ? JSON.parse(row.identity_core) : [],
      identitySummary: row.identity_summary || '',
      narrativeFirstPerson: row.narrative_first_person || '',
      narrativeThirdPerson: row.narrative_third_person || '',
      coreValues: row.core_values ? JSON.parse(row.core_values) : [],
      relationshipMap: row.relationship_map ? JSON.parse(row.relationship_map) : [],
      linguisticSignature: row.linguistic_signature ? JSON.parse(row.linguistic_signature) : {},
      thinkingPatterns: row.thinking_patterns ? JSON.parse(row.thinking_patterns) : {},
      communicationStyle: row.communication_style ? JSON.parse(row.communication_style) : {},
      emotionalBaseline: row.emotional_baseline ? JSON.parse(row.emotional_baseline) : {},
      version: row.version,
      qualityScore: row.quality_score
    };
  }

  // ----------------------------------------
  // Me-Alignment生成
  // ----------------------------------------

  /**
   * 生成个性化回复 (调用Python Me-Alignment Engine)
   */
  async generateResponse(context: GenerationContext): Promise<GenerationResult> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath, 'me_alignment_engine.py');
      
      const args = [
        pythonScript,
        '--db-path', this.dbPath,
        '--user-id', context.userId,
        '--input', context.currentInput
      ];

      if (context.partnerName) {
        args.push('--partner-name', context.partnerName);
      }

      const python = spawn('python3', args);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            // 从输出中提取回复
            const lines = output.split('\n');
            const responseLine = lines.find(l => l.startsWith('Response:'));
            const response = responseLine ? responseLine.replace('Response:', '').trim() : output;

            resolve({
              response,
              alignmentScore: {
                totalScore: 0.7,
                linguisticScore: 0.7,
                emotionalScore: 0.7,
                valueScore: 0.7,
                factualScore: 0.7,
                confidence: 0.5
              },
              generationTime: 0,
              retrievedMemoriesCount: {
                l0: 0,
                l1: 0,
                l2: false
              }
            });
          }
        } else {
          reject(new Error(`Generation failed: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * 记录用户反馈 (用于RLHF)
   */
  async recordFeedback(
    userId: string,
    response: string,
    context: any,
    rating?: number,
    feedbackText?: string,
    correction?: string
  ): Promise<void> {
    const reward = rating ? (rating - 3) / 2.0 : 0;

    const stmt = db.prepare(`
      INSERT INTO me_alignment_samples (
        id, user_id, context_memories, conversation_history,
        current_input, generated_response, generation_method,
        user_rating, user_feedback, user_correction, reward
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    stmt.run(
      id,
      userId,
      JSON.stringify(context.memoryIds || []),
      JSON.stringify(context.conversationHistory || []),
      context.currentInput || '',
      response,
      'v2_memory_driven',
      rating || null,
      feedbackText || null,
      correction || null,
      reward
    );
  }

  // ----------------------------------------
  // 完整管线
  // ----------------------------------------

  /**
   * 构建完整记忆层次 (L0 → L1 → L2)
   */
  async buildMemoryHierarchy(userId: string): Promise<{
    l0Count: number;
    l1Count: number;
    l2Generated: boolean;
    message: string;
  }> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.join(this.pythonScriptPath, 'hierarchical_memory_manager.py');
      
      const args = [
        pythonScript,
        '--db-path', this.dbPath,
        '--user-id', userId,
        '--action', 'full'
      ];

      const python = spawn('python3', args);
      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            resolve({
              l0Count: 0,
              l1Count: 0,
              l2Generated: false,
              message: output.trim()
            });
          }
        } else {
          reject(new Error(`Full pipeline failed: ${errorOutput}`));
        }
      });
    });
  }

  // ----------------------------------------
  // 统计and监控
  // ----------------------------------------

  /**
   * 获取记忆统计
   */
  async getMemoryStats(userId: string): Promise<any> {
    const l0Stmt = db.prepare(`
      SELECT COUNT(*) as count FROM l0_raw_memories WHERE user_id = ?
    `);
    const l0Count = (l0Stmt.get(userId) as any).count;

    const l1Stmt = db.prepare(`
      SELECT COUNT(*) as count FROM l1_memory_clusters WHERE user_id = ?
    `);
    const l1Count = (l1Stmt.get(userId) as any).count;

    const l2Stmt = db.prepare(`
      SELECT COUNT(*) as count FROM l2_biography WHERE user_id = ?
    `);
    const l2Count = (l2Stmt.get(userId) as any).count;

    const biography = await this.getBiography(userId);

    return {
      l0: {
        totalMemories: l0Count,
        sources: await this._getMemorySources(userId),
        dateRange: await this._getMemoryDateRange(userId)
      },
      l1: {
        totalClusters: l1Count,
        topClusters: await this.getClusters(userId, 5)
      },
      l2: {
        biographyExists: l2Count > 0,
        currentVersion: biography?.version || 0,
        qualityScore: biography?.qualityScore || 0,
        identityTags: biography?.identityCore.length || 0
      }
    };
  }

  private async _getMemorySources(userId: string): Promise<string[]> {
    const stmt = db.prepare(`
      SELECT DISTINCT source FROM l0_raw_memories WHERE user_id = ?
    `);
    const rows = stmt.all(userId) as any[];
    return rows.map(r => r.source);
  }

  private async _getMemoryDateRange(userId: string): Promise<{ start: Date; end: Date } | null> {
    const stmt = db.prepare(`
      SELECT MIN(timestamp) as start, MAX(timestamp) as end
      FROM l0_raw_memories
      WHERE user_id = ?
    `);
    const row = stmt.get(userId) as any;
    
    if (!row || !row.start) {
      return null;
    }

    return {
      start: new Date(row.start),
      end: new Date(row.end)
    };
  }
}

// 导出单例
export const memoryV2Service = new MemoryV2Service();
