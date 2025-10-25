/**
 * 🤖 Proactive Agent Engine v2.0
 * 主动性行为引擎 - 让 Self Agent 具备主动发起对话的能力
 * 
 * Core features:
 * 1. 定时任务调度 (生日提醒、节日祝福、周期性问候)
 * 2. 事件触发器 (基于用户行为mode)
 * 3. 个性化消息生成 (符合用户Language风格)
 * 4. 关系感知 (不同关系使用不同风格)
 */

import { EventEmitter } from 'events';
import cron from 'node-cron';
import { randomUUID } from 'crypto';
import { getDb } from '../db/index.js';
import { buildEnhancedPersonaProfile, EnhancedPersonaProfile } from './personalityEngine.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// Type definitions
// ============================================

export interface ProactiveEvent {
  id: string;
  user_id: string;
  event_type: 'birthday' | 'holiday' | 'check_in' | 'reminder' | 'periodic_greeting';
  target_person?: string;
  trigger_time: number;
  message_content?: string;
  sent_at?: number;
  response_received: boolean;
  user_feedback?: 'positive' | 'negative' | 'neutral';
  metadata?: Record<string, any>;
}

export interface ProactiveMessageTemplate {
  id: string;
  template_type: string;
  template_content: string;
  formality_level: number;
}

export interface ScheduledTask {
  id: string;
  cron_expression: string;
  task_type: string;
  handler: () => Promise<void>;
}

// ============================================
// 主动 Agent 引擎
// ============================================

export class ProactiveAgentEngine extends EventEmitter {
  private userId: string;
  private scheduledTasks: Map<string, cron.ScheduledTask>;
  private geminiAPI: GoogleGenerativeAI;
  private isInitialized: boolean = false;

  constructor(userId: string, geminiApiKey: string) {
    super();
    this.userId = userId;
    this.scheduledTasks = new Map();
    this.geminiAPI = new GoogleGenerativeAI(geminiApiKey);
  }

  /**
   * 初始化主动引擎
   * - 加载用户人格档案
   * - Sign Up所有定时任务
   * - 检测重要日期
   */
  async initialize(): Promise<void> {
    console.log(`[ProactiveAgent] Initializing for user ${this.userId}...`);

    try {
      // 1. 构建增强型人格档案
      const persona = await buildEnhancedPersonaProfile(this.userId, {
        includeTemporalAnalysis: true,
        includeRelationshipGraph: true,
      });

      console.log(`[ProactiveAgent] Persona loaded (quality: ${persona.qualityScore.toFixed(2)})`);

      // 2. Sign Up生日提醒
      this.registerBirthdayReminders(persona);

      // 3. Sign Up节日祝福
      this.registerHolidayGreetings();

      // 4. Sign Up周期性问候
      this.registerPeriodicCheckIns(persona);

      // 5. Sign Up行为触发器
      this.registerBehaviorTriggers(persona);

      this.isInitialized = true;
      console.log(`[ProactiveAgent] ✓ Initialized successfully with ${this.scheduledTasks.size} scheduled tasks`);
      
      this.emit('initialized', { userId: this.userId });
    } catch (error: any) {
      console.error(`[ProactiveAgent] Initialization failed:`, error);
      throw error;
    }
  }

  /**
   * Sign Up生日提醒任务
   */
  private registerBirthdayReminders(persona: EnhancedPersonaProfile): void {
    const importantDates = persona.temporalPatterns.importantDates || [];
    const birthdays = importantDates.filter(d => d.type === 'birthday');

    console.log(`[ProactiveAgent] Found ${birthdays.length} birthdays to monitor`);

    for (const birthday of birthdays) {
      const [month, day] = birthday.date.split('-').map(Number);
      
      // 在生日当天早上8点触发 (cron: 分 时 日 月 星期)
      const cronExpression = `0 8 ${day} ${month} *`;
      
      const taskId = `birthday_${birthday.person || 'unknown'}_${birthday.date}`;
      const task = cron.schedule(cronExpression, async () => {
        await this.handleBirthdayEvent(birthday.person || '朋友', birthday);
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai', // 可配置
      });

      this.scheduledTasks.set(taskId, task);
      console.log(`[ProactiveAgent] Registered birthday reminder: ${birthday.person} on ${birthday.date}`);
    }
  }

  /**
   * Sign Up节日祝福任务
   */
  private registerHolidayGreetings(): void {
    // 预定义的重要节日
    const holidays = [
      { name: '春节', month: 1, day: 1, recipients: 'all' },        // 农历正月初一 (简化为公历1.1)
      { name: '情人节', month: 2, day: 14, recipients: 'partner' },
      { name: '母亲节', month: 5, day: 10, recipients: 'mother' },  // 5月第二个周日 (简化)
      { name: '父亲节', month: 6, day: 21, recipients: 'father' },  // 6月第三个周日 (简化)
      { name: '中秋节', month: 9, day: 15, recipients: 'family' },  // 农历八月十五 (简化)
      { name: '圣诞节', month: 12, day: 25, recipients: 'friends' },
    ];

    for (const holiday of holidays) {
      const cronExpression = `0 9 ${holiday.day} ${holiday.month} *`;
      const taskId = `holiday_${holiday.name}`;
      
      const task = cron.schedule(cronExpression, async () => {
        await this.handleHolidayEvent(holiday.name, holiday.recipients);
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      });

      this.scheduledTasks.set(taskId, task);
      console.log(`[ProactiveAgent] Registered holiday greeting: ${holiday.name}`);
    }
  }

  /**
   * Sign Up周期性问候 (基于关系强度)
   */
  private registerPeriodicCheckIns(persona: EnhancedPersonaProfile): void {
    const relationships = persona.contextualPersona || [];
    
    // 只对关系强度高的联系人定期问候
    const closeRelationships = relationships.filter(r => 
      r.interaction_count > 50 && 
      (r.relationship_type === 'family' || r.relationship_type === 'friend')
    );

    console.log(`[ProactiveAgent] Setting up periodic check-ins for ${closeRelationships.length} close relationships`);

    // 每周日晚上8点检查是否需要问候
    const taskId = 'periodic_checkin_weekly';
    const task = cron.schedule('0 20 * * 0', async () => {
      for (const rel of closeRelationships) {
        // 如果超过7天没联系,发送问候
        const daysSinceLastContact = (Date.now() - rel.last_interaction) / (1000 * 60 * 60 * 24);
        if (daysSinceLastContact > 7) {
          await this.handleCheckInEvent(rel.target_person, rel.relationship_type);
        }
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai',
    });

    this.scheduledTasks.set(taskId, task);
  }

  /**
   * Sign Up基于行为mode的触发器
   */
  private registerBehaviorTriggers(persona: EnhancedPersonaProfile): void {
    // 例: 如果用户习惯每天早上查看消息,在早上发送每日总结
    const morningRoutine = persona.temporalPatterns.dailyRoutine?.find(
      r => r.time_hour >= 6 && r.time_hour <= 9 && r.frequency > 0.7
    );

    if (morningRoutine) {
      const taskId = 'behavior_morning_summary';
      const task = cron.schedule(`0 ${morningRoutine.time_hour} * * *`, async () => {
        await this.handleBehaviorTrigger('morning_summary');
      }, {
        scheduled: true,
        timezone: 'Asia/Shanghai',
      });

      this.scheduledTasks.set(taskId, task);
      console.log(`[ProactiveAgent] Registered morning summary at ${morningRoutine.time_hour}:00`);
    }
  }

  // ============================================
  // 事件处理器
  // ============================================

  /**
   * 处理生日事件
   */
  private async handleBirthdayEvent(targetPerson: string, birthdayInfo: any): Promise<void> {
    console.log(`[ProactiveAgent] Triggering birthday event for ${targetPerson}`);

    try {
      const message = await this.generateProactiveMessage({
        eventType: 'birthday',
        targetPerson,
        context: birthdayInfo,
      });

      const eventId = await this.saveProactiveEvent({
        event_type: 'birthday',
        target_person: targetPerson,
        message_content: message,
        trigger_time: Date.now(),
      });

      this.emit('proactive_message', {
        eventId,
        type: 'birthday',
        targetPerson,
        message,
      });

      console.log(`[ProactiveAgent] ✓ Birthday message generated for ${targetPerson}`);
    } catch (error: any) {
      console.error(`[ProactiveAgent] Failed to handle birthday event:`, error);
    }
  }

  /**
   * 处理节日事件
   */
  private async handleHolidayEvent(holidayName: string, recipients: string): Promise<void> {
    console.log(`[ProactiveAgent] Triggering holiday event: ${holidayName} for ${recipients}`);

    try {
      const message = await this.generateProactiveMessage({
        eventType: 'holiday',
        context: { holidayName, recipients },
      });

      const eventId = await this.saveProactiveEvent({
        event_type: 'holiday',
        message_content: message,
        trigger_time: Date.now(),
        metadata: { holiday: holidayName, recipients },
      });

      this.emit('proactive_message', {
        eventId,
        type: 'holiday',
        holiday: holidayName,
        message,
      });
    } catch (error: any) {
      console.error(`[ProactiveAgent] Failed to handle holiday event:`, error);
    }
  }

  /**
   * 处理周期性问候事件
   */
  private async handleCheckInEvent(targetPerson: string, relationshipType: string): Promise<void> {
    console.log(`[ProactiveAgent] Triggering check-in for ${targetPerson} (${relationshipType})`);

    try {
      const message = await this.generateProactiveMessage({
        eventType: 'check_in',
        targetPerson,
        context: { relationshipType },
      });

      const eventId = await this.saveProactiveEvent({
        event_type: 'check_in',
        target_person: targetPerson,
        message_content: message,
        trigger_time: Date.now(),
      });

      this.emit('proactive_message', {
        eventId,
        type: 'check_in',
        targetPerson,
        message,
      });
    } catch (error: any) {
      console.error(`[ProactiveAgent] Failed to handle check-in event:`, error);
    }
  }

  /**
   * 处理行为触发器
   */
  private async handleBehaviorTrigger(triggerType: string): Promise<void> {
    console.log(`[ProactiveAgent] Triggering behavior event: ${triggerType}`);
    
    // TODO: 实现具体的行为触发逻辑
    this.emit('behavior_trigger', { type: triggerType, timestamp: Date.now() });
  }

  // ============================================
  // 消息生成
  // ============================================

  /**
   * 生成符合用户人格的主动消息
   */
  private async generateProactiveMessage(options: {
    eventType: string;
    targetPerson?: string;
    context?: any;
  }): Promise<string> {
    const { eventType, targetPerson, context } = options;

    // 1. 获取用户人格档案
    const persona = await buildEnhancedPersonaProfile(this.userId, {
      includeBigFive: true,
    });

    // 2. 查找对应的关系上下文 (如果有目标人物)
    let relationshipContext = null;
    if (targetPerson) {
      relationshipContext = persona.contextualPersona.find(
        r => r.target_person === targetPerson
      );
    }

    // 3. 构建 prompt
    const prompt = this.buildProactivePrompt(persona, eventType, targetPerson, relationshipContext, context);

    // 4. 调用 Gemini 生成
    const model = this.geminiAPI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const message = result.response.text().trim();

    return message;
  }

  /**
   * 构建主动消息生成 prompt
   */
  private buildProactivePrompt(
    persona: EnhancedPersonaProfile,
    eventType: string,
    targetPerson: string | undefined,
    relationshipContext: any,
    context: any
  ): string {
    const sections: string[] = [];

    sections.push(`# 任务说明`);
    sections.push(`你需要扮演用户本人,生成一条${eventType === 'birthday' ? '生日祝福' : eventType === 'holiday' ? '节日问候' : '日常关怀'}消息。`);
    sections.push(`这条消息必须完全符合用户的Language风格、人格特征and与目标人物的关系mode。`);

    sections.push(`\n# 用户人格特征`);
    sections.push(`- **Big Five**: Openness=${persona.bigFive.openness.toFixed(2)}, Extraversion=${persona.bigFive.extraversion.toFixed(2)}, Agreeableness=${persona.bigFive.agreeableness.toFixed(2)}`);
    sections.push(`- **Language风格**: ${persona.language_style}`);
    sections.push(`- **情感基调**: ${persona.emotional_tone}`);
    sections.push(`- **正式程度**: ${persona.linguisticSignature.formalityScore.toFixed(2)} (0=极随意, 1=极正式)`);

    if (persona.linguisticSignature.emojiUsagePattern.length > 0) {
      const topEmojis = persona.linguisticSignature.emojiUsagePattern.slice(0, 5).map(e => e.emoji).join('');
      sections.push(`- **常用Emoji**: ${topEmojis}`);
    }

    if (targetPerson && relationshipContext) {
      sections.push(`\n# 与 ${targetPerson} 的关系特征`);
      sections.push(`- **关系类型**: ${relationshipContext.relationship_type}`);
      sections.push(`- **正式程度调整**: ${relationshipContext.persona_shift.formality > 0 ? '更正式' : '更随意'} (${relationshipContext.persona_shift.formality.toFixed(2)})`);
      sections.push(`- **情感开放度**: ${relationshipContext.persona_shift.emotional_openness.toFixed(2)}`);
      sections.push(`- **幽默程度**: ${relationshipContext.persona_shift.humor_level.toFixed(2)}`);
    }

    sections.push(`\n# 生成要求`);
    sections.push(`1. 使用第一人称 "我"`);
    sections.push(`2. 消息长度: ${targetPerson && relationshipContext ? relationshipContext.persona_shift.message_length : 50}-100字符`);
    sections.push(`3. 语气自然、真实,避免客套话and模板化表达`);
    sections.push(`4. 如果用户习惯用Emoji,适当添加 (但不要过度)`);
    sections.push(`5. **只输出消息内容本身,不要有任何解释或前缀**`);

    if (context) {
      sections.push(`\n# 上下文信息`);
      sections.push(JSON.stringify(context, null, 2));
    }

    return sections.join('\n');
  }

  // ============================================
  // 数据库操作
  // ============================================

  private async saveProactiveEvent(event: Partial<ProactiveEvent>): Promise<string> {
    const db = getDb();
    const id = randomUUID();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO proactive_events (
        id, user_id, event_type, target_person, trigger_time,
        message_content, response_received, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      this.userId,
      event.event_type,
      event.target_person || null,
      event.trigger_time || now,
      event.message_content || null,
      0, // response_received
      JSON.stringify(event.metadata || {}),
      now,
      now
    );

    return id;
  }

  // ============================================
  // 引擎控制
  // ============================================

  /**
   * 停止所有定时任务
   */
  stop(): void {
    console.log(`[ProactiveAgent] Stopping all scheduled tasks...`);
    
    for (const [taskId, task] of this.scheduledTasks.entries()) {
      task.stop();
      console.log(`[ProactiveAgent] Stopped task: ${taskId}`);
    }

    this.scheduledTasks.clear();
    this.isInitialized = false;
    this.emit('stopped', { userId: this.userId });
  }

  /**
   * 手动触发特定事件 (用于测试)
   */
  async triggerEvent(eventType: string, options?: any): Promise<void> {
    switch (eventType) {
      case 'birthday':
        await this.handleBirthdayEvent(options.targetPerson, options.context);
        break;
      case 'holiday':
        await this.handleHolidayEvent(options.holidayName, options.recipients);
        break;
      case 'check_in':
        await this.handleCheckInEvent(options.targetPerson, options.relationshipType);
        break;
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }
  }
}

// ============================================
// 导出工厂函数
// ============================================

/**
 * 创建并初始化主动 Agent 引擎
 */
export async function createProactiveAgent(
  userId: string,
  geminiApiKey: string
): Promise<ProactiveAgentEngine> {
  const engine = new ProactiveAgentEngine(userId, geminiApiKey);
  await engine.initialize();
  return engine;
}
