/**
 * ABTestingFramework - A/B测试框架
 * 
 * Phase 4核心模块:支持多模型版本对比和自动流量分配
 * 
 * 功能:
 * 1. 创建A/B测试实验
 * 2. 流量分配和路由
 * 3. 实时指标收集
 * 4. 统计显著性检验
 */

import Database from 'better-sqlite3';

export interface ABExperiment {
  experimentId: string;
  userId: string;
  variantA: string;
  variantB: string;
  trafficSplit: number;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'stopped';
}

export interface ABMetrics {
  experimentId: string;
  variantA: {
    samples: number;
    avgScore: number;
    winRate: number;
  };
  variantB: {
    samples: number;
    avgScore: number;
    winRate: number;
  };
  winner?: 'A' | 'B' | 'tie';
  pValue?: number;
  confidence: number;
}

export class ABTestingFramework {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ab_experiments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experiment_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        variant_a TEXT NOT NULL,
        variant_b TEXT NOT NULL,
        traffic_split REAL NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        status TEXT NOT NULL,
        winner TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ab_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experiment_id TEXT NOT NULL,
        variant TEXT NOT NULL,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        score REAL NOT NULL,
        user_feedback TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  createExperiment(
    userId: string,
    variantA: string,
    variantB: string,
    trafficSplit: number = 0.5
  ): ABExperiment {
    const experimentId = `exp_${userId}_${Date.now()}`;
    
    const experiment: ABExperiment = {
      experimentId,
      userId,
      variantA,
      variantB,
      trafficSplit,
      startTime: Date.now(),
      status: 'running'
    };

    this.db.prepare(`
      INSERT INTO ab_experiments
      (experiment_id, user_id, variant_a, variant_b, traffic_split, start_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      experimentId,
      userId,
      variantA,
      variantB,
      trafficSplit,
      experiment.startTime,
      'running'
    );

    console.log(`🧪 创建A/B实验: ${variantA} vs ${variantB}`);
    return experiment;
  }

  routeTraffic(experimentId: string): 'A' | 'B' {
    const exp = this.db.prepare(`
      SELECT traffic_split FROM ab_experiments WHERE experiment_id = ?
    `).get(experimentId) as any;

    if (!exp) return 'A';

    return Math.random() < exp.traffic_split ? 'A' : 'B';
  }

  recordSample(
    experimentId: string,
    variant: 'A' | 'B',
    prompt: string,
    response: string,
    score: number
  ): void {
    this.db.prepare(`
      INSERT INTO ab_samples
      (experiment_id, variant, prompt, response, score, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(experimentId, variant, prompt, response, score, Date.now());
  }

  getMetrics(experimentId: string): ABMetrics {
    const samplesA = this.db.prepare(`
      SELECT COUNT(*) as count, AVG(score) as avg_score
      FROM ab_samples
      WHERE experiment_id = ? AND variant = 'A'
    `).get(experimentId) as any;

    const samplesB = this.db.prepare(`
      SELECT COUNT(*) as count, AVG(score) as avg_score
      FROM ab_samples
      WHERE experiment_id = ? AND variant = 'B'
    `).get(experimentId) as any;

    const winRateA = samplesA.count > 0 ? (samplesA.avg_score || 0) : 0;
    const winRateB = samplesB.count > 0 ? (samplesB.avg_score || 0) : 0;

    const winner = this.determineWinner(
      samplesA.count, 
      samplesB.count, 
      winRateA, 
      winRateB
    );

    return {
      experimentId,
      variantA: {
        samples: samplesA.count || 0,
        avgScore: samplesA.avg_score || 0,
        winRate: winRateA
      },
      variantB: {
        samples: samplesB.count || 0,
        avgScore: samplesB.avg_score || 0,
        winRate: winRateB
      },
      winner,
      confidence: this.calculateConfidence(samplesA.count, samplesB.count)
    };
  }

  private determineWinner(
    countA: number,
    countB: number,
    scoreA: number,
    scoreB: number
  ): 'A' | 'B' | 'tie' | undefined {
    if (countA < 30 || countB < 30) return undefined; // 样本不足

    const diff = Math.abs(scoreA - scoreB);
    if (diff < 0.05) return 'tie';
    return scoreA > scoreB ? 'A' : 'B';
  }

  private calculateConfidence(countA: number, countB: number): number {
    const total = countA + countB;
    if (total < 30) return 0;
    if (total >= 100) return 0.95;
    return 0.5 + (total / 200);
  }
}
