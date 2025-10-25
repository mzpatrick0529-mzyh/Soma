/**
 * TuringTestHarness - 图灵测试工具
 * 
 * Phase 4核心模块:自动化图灵测试评估
 * 生成真实感指数报告
 * 
 * 功能:
 * 1. 组织盲测实验
 * 2. 收集人类评判
 * 3. 计算通过率
 * 4. 生成可解释报告
 */

import Database from 'better-sqlite3';

export interface TuringTest {
  testId: string;
  userId: string;
  totalTrials: number;
  correctGuesses: number;
  passRate: number;
  humanLikenessScore: number;
  timestamp: number;
}

export interface TuringTrial {
  trialId: string;
  testId: string;
  prompt: string;
  humanResponse?: string;
  aiResponse: string;
  judgeGuess: 'human' | 'ai';
  correct: boolean;
  confidence: number;
  timestamp: number;
}

export interface TuringReport {
  testId: string;
  overallPassRate: number;
  humanLikenessScore: number;
  strengthAreas: string[];
  weaknessAreas: string[];
  recommendations: string[];
}

export class TuringTestHarness {
  private db: Database.Database;
  private passThreshold = 0.5; // 50%误判率即通过图灵测试

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS turing_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        total_trials INTEGER NOT NULL,
        correct_guesses INTEGER NOT NULL,
        pass_rate REAL NOT NULL,
        human_likeness_score REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS turing_trials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trial_id TEXT UNIQUE NOT NULL,
        test_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        human_response TEXT,
        ai_response TEXT NOT NULL,
        judge_guess TEXT NOT NULL,
        correct BOOLEAN NOT NULL,
        confidence REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_turing_user ON turing_tests(user_id);
      CREATE INDEX IF NOT EXISTS idx_trial_test ON turing_trials(test_id);
    `);
  }

  /**
   * 创建新的图灵测试
   */
  createTest(userId: string): TuringTest {
    const testId = `turing_${userId}_${Date.now()}`;

    const test: TuringTest = {
      testId,
      userId,
      totalTrials: 0,
      correctGuesses: 0,
      passRate: 0,
      humanLikenessScore: 0,
      timestamp: Date.now()
    };

    this.saveTest(test);
    console.log(`🤖 创建图灵测试: ${testId}`);

    return test;
  }

  /**
   * 记录测试trial
   */
  recordTrial(
    testId: string,
    prompt: string,
    aiResponse: string,
    judgeGuess: 'human' | 'ai',
    confidence: number,
    humanResponse?: string
  ): TuringTrial {
    const trialId = `trial_${testId}_${Date.now()}`;
    
    // 判断是否正确(AI被误判为human算成功)
    const correct = judgeGuess === 'human';

    const trial: TuringTrial = {
      trialId,
      testId,
      prompt,
      humanResponse,
      aiResponse,
      judgeGuess,
      correct,
      confidence,
      timestamp: Date.now()
    };

    // 保存trial
    this.db.prepare(`
      INSERT INTO turing_trials
      (trial_id, test_id, prompt, human_response, ai_response, 
       judge_guess, correct, confidence, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trialId,
      testId,
      prompt,
      humanResponse || null,
      aiResponse,
      judgeGuess,
      correct ? 1 : 0,
      confidence,
      trial.timestamp
    );

    // 更新test统计
    this.updateTestStats(testId);

    return trial;
  }

  /**
   * 更新测试统计
   */
  private updateTestStats(testId: string): void {
    const stats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN correct = 1 THEN 1 ELSE 0 END) as correct_count,
        AVG(confidence) as avg_confidence
      FROM turing_trials
      WHERE test_id = ?
    `).get(testId) as any;

    const total = stats?.total || 0;
    const correctGuesses = stats?.correct_count || 0;
    const passRate = total > 0 ? correctGuesses / total : 0;
    
    // 人类相似度分数 (综合通过率和评判信心)
    const avgConfidence = stats?.avg_confidence || 0.5;
    const humanLikenessScore = passRate * (1 - avgConfidence * 0.3);

    this.db.prepare(`
      UPDATE turing_tests
      SET total_trials = ?,
          correct_guesses = ?,
          pass_rate = ?,
          human_likeness_score = ?
      WHERE test_id = ?
    `).run(total, correctGuesses, passRate, humanLikenessScore, testId);
  }

  /**
   * 获取测试结果
   */
  getTestResults(testId: string): TuringTest {
    const test = this.db.prepare(`
      SELECT * FROM turing_tests WHERE test_id = ?
    `).get(testId) as any;

    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    return {
      testId: test.test_id,
      userId: test.user_id,
      totalTrials: test.total_trials,
      correctGuesses: test.correct_guesses,
      passRate: test.pass_rate,
      humanLikenessScore: test.human_likeness_score,
      timestamp: test.timestamp
    };
  }

  /**
   * 生成综合报告
   */
  generateReport(testId: string): TuringReport {
    const test = this.getTestResults(testId);
    
    // 获取所有trials
    const trials = this.db.prepare(`
      SELECT * FROM turing_trials WHERE test_id = ?
    `).all(testId) as any[];

    // 分析优势和劣势领域
    const { strengthAreas, weaknessAreas } = this.analyzePerformance(trials);
    
    // 生成建议
    const recommendations = this.generateRecommendations(test, strengthAreas, weaknessAreas);

    const report: TuringReport = {
      testId,
      overallPassRate: test.passRate,
      humanLikenessScore: test.humanLikenessScore,
      strengthAreas,
      weaknessAreas,
      recommendations
    };

    console.log(`📊 图灵测试报告: 通过率${(test.passRate*100).toFixed(1)}%, 真实感${(test.humanLikenessScore*100).toFixed(1)}%`);

    return report;
  }

  /**
   * 分析表现
   */
  private analyzePerformance(trials: any[]): { 
    strengthAreas: string[], 
    weaknessAreas: string[] 
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // 按prompt长度分组
    const shortPrompts = trials.filter(t => t.prompt.length < 50);
    const longPrompts = trials.filter(t => t.prompt.length >= 50);

    if (shortPrompts.length > 0) {
      const shortPassRate = shortPrompts.filter(t => t.correct).length / shortPrompts.length;
      if (shortPassRate > 0.6) {
        strengths.push('短对话表现优秀');
      } else if (shortPassRate < 0.4) {
        weaknesses.push('短对话识别度高');
      }
    }

    if (longPrompts.length > 0) {
      const longPassRate = longPrompts.filter(t => t.correct).length / longPrompts.length;
      if (longPassRate > 0.6) {
        strengths.push('长对话表现优秀');
      } else if (longPassRate < 0.4) {
        weaknesses.push('长对话连贯性不足');
      }
    }

    // 分析高信心判断
    const highConfidence = trials.filter(t => t.confidence > 0.7);
    if (highConfidence.length > 0) {
      const highConfPassRate = highConfidence.filter(t => t.correct).length / highConfidence.length;
      if (highConfPassRate < 0.3) {
        weaknesses.push('在明显特征上暴露AI身份');
      }
    }

    return { strengthAreas: strengths, weaknessAreas: weaknesses };
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    test: TuringTest,
    strengths: string[],
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (test.passRate < 0.4) {
      recommendations.push('强烈建议重新训练模型,当前真实感不足');
      recommendations.push('增加训练样本多样性,特别是自然对话数据');
    } else if (test.passRate < 0.5) {
      recommendations.push('建议优化风格一致性和情感表达');
    }

    if (weaknesses.includes('短对话识别度高')) {
      recommendations.push('优化简短回复的自然度,避免模板化');
    }

    if (weaknesses.includes('长对话连贯性不足')) {
      recommendations.push('强化对话记忆和上下文理解能力');
    }

    if (weaknesses.includes('在明显特征上暴露AI身份')) {
      recommendations.push('校准语言风格,减少AI特征词汇');
    }

    if (test.humanLikenessScore > 0.7) {
      recommendations.push('已达到高真实感,建议进行生产部署');
    }

    return recommendations;
  }

  /**
   * 保存测试
   */
  private saveTest(test: TuringTest): void {
    this.db.prepare(`
      INSERT INTO turing_tests
      (test_id, user_id, total_trials, correct_guesses, pass_rate, 
       human_likeness_score, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      test.testId,
      test.userId,
      test.totalTrials,
      test.correctGuesses,
      test.passRate,
      test.humanLikenessScore,
      test.timestamp
    );
  }

  /**
   * 获取测试历史
   */
  getTestHistory(userId: string, limit: number = 10): TuringTest[] {
    const tests = this.db.prepare(`
      SELECT * FROM turing_tests
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(userId, limit) as any[];

    return tests.map(t => ({
      testId: t.test_id,
      userId: t.user_id,
      totalTrials: t.total_trials,
      correctGuesses: t.correct_guesses,
      passRate: t.pass_rate,
      humanLikenessScore: t.human_likeness_score,
      timestamp: t.timestamp
    }));
  }
}
