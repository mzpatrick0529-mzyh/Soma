/**
 * DriftDetector - 漂移检测器
 * 
 * Phase 4核心模块:监测persona漂移和关系变化
 * 自动触发模型更新,保持persona与真实用户同步
 * 
 * 功能:
 * 1. 检测persona特征漂移
 * 2. 检测关系intimacy变化
 * 3. 检测生成质量下降
 * 4. 自动触发重训练
 */

import Database from 'better-sqlite3';
import { RewardScore } from './rewardModel';

// ============= 类型定义 =============

export interface DriftAlert {
  alertId: string;
  userId: string;
  driftType: 'persona' | 'relationship' | 'quality' | 'style';
  severity: 'low' | 'medium' | 'high';
  driftScore: number; // 0-1,漂移程度
  affectedFeatures: string[];
  recommendation: string;
  timestamp: number;
}

export interface DriftMetrics {
  personaDrift: number;
  relationshipDrift: number;
  qualityDrift: number;
  styleDrift: number;
  overallDrift: number;
}

export interface DriftHistory {
  totalAlerts: number;
  recentAlerts: DriftAlert[];
  avgDriftScore: number;
  mostDriftedFeature: string;
}

// ============= DriftDetector类 =============

export class DriftDetector {
  private db: Database.Database;
  
  // 漂移阈值
  private thresholds = {
    low: 0.15,
    medium: 0.30,
    high: 0.50
  };

  // 检测窗口(天数)
  private detectionWindowDays = 7;

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTables();
  }

  /**
   * 初始化表
   */
  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS drift_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        drift_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        drift_score REAL NOT NULL,
        affected_features TEXT,
        recommendation TEXT,
        timestamp INTEGER NOT NULL,
        resolved BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS drift_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        snapshot_data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_drift_user ON drift_alerts(user_id);
      CREATE INDEX IF NOT EXISTS idx_drift_resolved ON drift_alerts(resolved);
      CREATE INDEX IF NOT EXISTS idx_snapshot_user ON drift_snapshots(user_id);
    `);
  }

  /**
   * 执行全面漂移检测
   */
  async detectDrift(userId: string): Promise<DriftAlert[]> {
    console.log(`🔍 开始漂移检测: userId=${userId}`);

    const alerts: DriftAlert[] = [];

    // 1. 检测persona漂移
    const personaDrift = await this.detectPersonaDrift(userId);
    if (personaDrift) alerts.push(personaDrift);

    // 2. 检测关系漂移
    const relationshipDrift = await this.detectRelationshipDrift(userId);
    if (relationshipDrift) alerts.push(relationshipDrift);

    // 3. 检测质量漂移
    const qualityDrift = await this.detectQualityDrift(userId);
    if (qualityDrift) alerts.push(qualityDrift);

    // 4. 检测风格漂移
    const styleDrift = await this.detectStyleDrift(userId);
    if (styleDrift) alerts.push(styleDrift);

    // 保存所有alerts
    for (const alert of alerts) {
      this.saveAlert(alert);
    }

    if (alerts.length > 0) {
      console.log(`⚠️ 检测到 ${alerts.length} 个漂移警报`);
    } else {
      console.log(`✅ 未检测到显著漂移`);
    }

    return alerts;
  }

  /**
   * 检测persona特征漂移
   */
  private async detectPersonaDrift(userId: string): Promise<DriftAlert | null> {
    // 获取当前persona profile
    const current = this.db.prepare(`
      SELECT * FROM persona_profiles WHERE user_id = ? LIMIT 1
    `).get(userId) as any;

    if (!current) return null;

    // 获取最近的snapshot(基线)
    const baseline = this.getBaselineSnapshot(userId);
    if (!baseline) {
      // 创建新的baseline
      this.createSnapshot(userId, current);
      return null;
    }

    // 计算特征变化
    const driftScore = this.calculatePersonaDriftScore(baseline, current);

    if (driftScore > this.thresholds.low) {
      const severity = this.determineSeverity(driftScore);
      const affectedFeatures = this.identifyDriftedFeatures(baseline, current);

      return {
        alertId: `drift_persona_${userId}_${Date.now()}`,
        userId,
        driftType: 'persona',
        severity,
        driftScore,
        affectedFeatures,
        recommendation: this.generateRecommendation('persona', severity),
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * 检测关系intimacy漂移
   */
  private async detectRelationshipDrift(userId: string): Promise<DriftAlert | null> {
    // 获取最近的relationship变化
    const recentChanges = this.db.prepare(`
      SELECT * FROM relationship_profiles
      WHERE user_id = ? AND last_interaction > ?
      ORDER BY last_interaction DESC
      LIMIT 10
    `).all(userId, Date.now() - this.detectionWindowDays * 24 * 60 * 60 * 1000) as any[];

    if (recentChanges.length === 0) return null;

    // 检查intimacy急剧变化
    let significantChanges = 0;
    const affectedRelationships: string[] = [];

    for (const rel of recentChanges) {
      // 获取历史intimacy
      const history = this.getRelationshipHistory(userId, rel.target_person);
      if (history.length < 2) continue;

      const currentIntimacy = rel.intimacy_level;
      const previousIntimacy = history[history.length - 2].intimacy_level;
      const change = Math.abs(currentIntimacy - previousIntimacy);

      if (change > 0.2) {
        significantChanges++;
        affectedRelationships.push(rel.target_person);
      }
    }

    if (significantChanges > 2) {
      const driftScore = Math.min(1.0, significantChanges / 5);
      const severity = this.determineSeverity(driftScore);

      return {
        alertId: `drift_relationship_${userId}_${Date.now()}`,
        userId,
        driftType: 'relationship',
        severity,
        driftScore,
        affectedFeatures: affectedRelationships,
        recommendation: this.generateRecommendation('relationship', severity),
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * 检测生成质量漂移
   */
  private async detectQualityDrift(userId: string): Promise<DriftAlert | null> {
    // 获取最近的reward scores
    const recentScores = this.db.prepare(`
      SELECT overall_score FROM reward_scores
      WHERE user_id = ? AND timestamp > ?
      ORDER BY timestamp DESC
      LIMIT 50
    `).all(userId, Date.now() - this.detectionWindowDays * 24 * 60 * 60 * 1000) as any[];

    if (recentScores.length < 10) return null;

    // 计算最近和历史的平均分
    const recent = recentScores.slice(0, 20).map(r => r.overall_score);
    const historical = recentScores.slice(20).map(r => r.overall_score);

    const recentAvg = this.average(recent);
    const historicalAvg = this.average(historical);

    // 检测显著下降
    const decline = historicalAvg - recentAvg;

    if (decline > 0.1) {
      const driftScore = Math.min(1.0, decline / 0.3);
      const severity = this.determineSeverity(driftScore);

      return {
        alertId: `drift_quality_${userId}_${Date.now()}`,
        userId,
        driftType: 'quality',
        severity,
        driftScore,
        affectedFeatures: ['overall_quality', 'generation_performance'],
        recommendation: this.generateRecommendation('quality', severity),
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * 检测风格漂移
   */
  private async detectStyleDrift(userId: string): Promise<DriftAlert | null> {
    // 获取最近生成的消息
    const recentMessages = this.db.prepare(`
      SELECT response FROM reward_scores
      WHERE user_id = ? AND timestamp > ?
      ORDER BY timestamp DESC
      LIMIT 30
    `).all(userId, Date.now() - this.detectionWindowDays * 24 * 60 * 60 * 1000) as any[];

    if (recentMessages.length < 10) return null;

    // 计算风格特征
    const recentFeatures = this.extractStyleFeatures(recentMessages.map(m => m.response));

    // 获取baseline风格
    const profile = this.db.prepare(`
      SELECT * FROM persona_profiles WHERE user_id = ? LIMIT 1
    `).get(userId) as any;

    if (!profile) return null;

    const baselineFeatures = {
      emojiFreq: profile.emoji_freq || 0,
      formality: profile.formality || 0.5,
      avgLength: profile.avg_message_length || 50
    };

    // 计算风格偏差
    const driftScore = this.calculateStyleDriftScore(baselineFeatures, recentFeatures);

    if (driftScore > this.thresholds.low) {
      const severity = this.determineSeverity(driftScore);

      return {
        alertId: `drift_style_${userId}_${Date.now()}`,
        userId,
        driftType: 'style',
        severity,
        driftScore,
        affectedFeatures: ['emoji_usage', 'formality', 'message_length'],
        recommendation: this.generateRecommendation('style', severity),
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * 计算persona漂移分数
   */
  private calculatePersonaDriftScore(baseline: any, current: any): number {
    const features = ['emoji_freq', 'formality', 'avg_message_length', 'vocab_richness'];
    let totalDrift = 0;
    let count = 0;

    for (const feature of features) {
      const baseVal = baseline[feature] || 0;
      const currVal = current[feature] || 0;
      
      if (feature === 'avg_message_length') {
        totalDrift += Math.abs(currVal - baseVal) / 100;
      } else {
        totalDrift += Math.abs(currVal - baseVal);
      }
      count++;
    }

    return count > 0 ? totalDrift / count : 0;
  }

  /**
   * 识别漂移的特征
   */
  private identifyDriftedFeatures(baseline: any, current: any): string[] {
    const drifted: string[] = [];
    const features = ['emoji_freq', 'formality', 'avg_message_length', 'vocab_richness'];

    for (const feature of features) {
      const baseVal = baseline[feature] || 0;
      const currVal = current[feature] || 0;
      const change = Math.abs(currVal - baseVal);

      if (change > 0.15) {
        drifted.push(feature);
      }
    }

    return drifted;
  }

  /**
   * 提取风格特征
   */
  private extractStyleFeatures(messages: string[]): any {
    const emojiFreq = this.calculateEmojiFreq(messages);
    const formality = this.calculateFormality(messages);
    const avgLength = this.average(messages.map(m => m.length));

    return { emojiFreq, formality, avgLength };
  }

  /**
   * 计算风格漂移分数
   */
  private calculateStyleDriftScore(baseline: any, current: any): number {
    const emojiDrift = Math.abs(baseline.emojiFreq - current.emojiFreq);
    const formalityDrift = Math.abs(baseline.formality - current.formality);
    const lengthDrift = Math.abs(baseline.avgLength - current.avgLength) / 100;

    return (emojiDrift + formalityDrift + lengthDrift) / 3;
  }

  /**
   * 确定严重程度
   */
  private determineSeverity(driftScore: number): 'low' | 'medium' | 'high' {
    if (driftScore >= this.thresholds.high) return 'high';
    if (driftScore >= this.thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * 生成建议
   */
  private generateRecommendation(
    driftType: string, 
    severity: 'low' | 'medium' | 'high'
  ): string {
    const recommendations = {
      persona: {
        low: '建议增加训练样本以保持persona稳定性',
        medium: '建议重新运行persona分析并更新模型',
        high: '立即重新训练模型,persona已显著偏离基线'
      },
      relationship: {
        low: '监控关系变化,必要时更新relationship profiles',
        medium: '建议更新受影响的relationship profiles',
        high: '立即重建relationship graph,关系模式已发生重大变化'
      },
      quality: {
        low: '关注生成质量,考虑调整generation参数',
        medium: '建议收集更多反馈并微调模型',
        high: '生成质量严重下降,立即重新训练或回滚模型'
      },
      style: {
        low: '监控风格一致性,必要时调整style calibrator',
        medium: '建议重新校准style parameters',
        high: '风格严重偏离,立即更新persona profile和style模型'
      }
    };

    return recommendations[driftType as keyof typeof recommendations][severity];
  }

  /**
   * 创建snapshot
   */
  private createSnapshot(userId: string, data: any): void {
    this.db.prepare(`
      INSERT INTO drift_snapshots (user_id, snapshot_data, timestamp)
      VALUES (?, ?, ?)
    `).run(userId, JSON.stringify(data), Date.now());

    console.log(`📸 创建persona snapshot: userId=${userId}`);
  }

  /**
   * 获取baseline snapshot
   */
  private getBaselineSnapshot(userId: string): any | null {
    const row = this.db.prepare(`
      SELECT snapshot_data FROM drift_snapshots
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(userId) as any;

    if (!row) return null;

    try {
      return JSON.parse(row.snapshot_data);
    } catch {
      return null;
    }
  }

  /**
   * 获取关系历史
   */
  private getRelationshipHistory(userId: string, targetPerson: string): any[] {
    // TODO: 实际实现需要从relationship_history表获取
    return [];
  }

  /**
   * 保存alert
   */
  private saveAlert(alert: DriftAlert): void {
    this.db.prepare(`
      INSERT INTO drift_alerts
      (alert_id, user_id, drift_type, severity, drift_score, 
       affected_features, recommendation, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      alert.alertId,
      alert.userId,
      alert.driftType,
      alert.severity,
      alert.driftScore,
      JSON.stringify(alert.affectedFeatures),
      alert.recommendation,
      alert.timestamp
    );
  }

  /**
   * 获取漂移历史
   */
  getDriftHistory(userId: string, limit: number = 20): DriftHistory {
    const alerts = this.db.prepare(`
      SELECT * FROM drift_alerts
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    const avgDrift = alerts.length > 0
      ? this.average(alerts.map(a => a.drift_score))
      : 0;

    const featureCounts: Record<string, number> = {};
    for (const alert of alerts) {
      const features = JSON.parse(alert.affected_features || '[]');
      for (const feature of features) {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    }

    const mostDrifted = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

    return {
      totalAlerts: alerts.length,
      recentAlerts: alerts.map(a => ({
        alertId: a.alert_id,
        userId: a.user_id,
        driftType: a.drift_type,
        severity: a.severity,
        driftScore: a.drift_score,
        affectedFeatures: JSON.parse(a.affected_features || '[]'),
        recommendation: a.recommendation,
        timestamp: a.timestamp
      })),
      avgDriftScore: avgDrift,
      mostDriftedFeature: mostDrifted
    };
  }

  /**
   * 工具函数
   */
  private calculateEmojiFreq(messages: string[]): number {
    const totalEmojis = messages.reduce((sum, m) => 
      sum + (m.match(/[\p{Emoji}]/gu) || []).length, 0
    );
    const totalChars = messages.reduce((sum, m) => sum + m.length, 0);
    return totalChars > 0 ? totalEmojis / totalChars : 0;
  }

  private calculateFormality(messages: string[]): number {
    const formalWords = ['您', '请', '谢谢', '抱歉'];
    const casualWords = ['哈哈', '哇', '嗯', '哎'];
    
    let formalCount = 0;
    let casualCount = 0;

    for (const msg of messages) {
      formalCount += formalWords.filter(w => msg.includes(w)).length;
      casualCount += casualWords.filter(w => msg.includes(w)).length;
    }

    const total = formalCount + casualCount;
    return total > 0 ? formalCount / total : 0.5;
  }

  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
}
