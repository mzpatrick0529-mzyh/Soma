/**
 * 🎭 Persona Builder - 用户人格建模系统
 * 从用户记忆中提取并构建动态人格模型
 */

import { getRecentChunksByUser } from "../db/index.js";

export type PersonaProfile = {
  name: string;
  interests: string[];           // 兴趣爱好
  experiences: string[];         // 主要经历
  language_style: string;        // 语言风格描述
  thinking_patterns: string[];   // 思考模式
  emotional_tone: string;        // 情感基调
  knowledge_domains: string[];   // 知识领域
  recent_activities: string[];   // 最近活动
};

/**
 * 分析用户记忆，构建人格档案
 */
export function buildPersonaProfile(userId: string, opts: { maxChunks?: number } = {}): PersonaProfile {
  const maxChunks = opts.maxChunks ?? 100;
  const chunks = getRecentChunksByUser(userId, maxChunks);
  
  if (!chunks.length) {
    return getDefaultPersona();
  }

  // 聚合所有文本内容
  const allText = chunks.map(c => c.text).join("\n");
  const texts = chunks.map(c => c.text);

  // 1. 提取兴趣爱好（关键词频率分析）
  const interests = extractInterests(texts);
  
  // 2. 提取主要经历（时间+地点+事件）
  const experiences = extractExperiences(texts);
  
  // 3. 分析语言风格
  const language_style = analyzeLanguageStyle(allText);
  
  // 4. 识别思考模式
  const thinking_patterns = extractThinkingPatterns(texts);
  
  // 5. 情感基调
  const emotional_tone = analyzeEmotionalTone(allText);
  
  // 6. 知识领域
  const knowledge_domains = extractKnowledgeDomains(texts);
  
  // 7. 最近活动
  const recent_activities = extractRecentActivities(texts.slice(0, 20));

  return {
    name: "用户", // 可从 auth 获取真实姓名
    interests,
    experiences,
    language_style,
    thinking_patterns,
    emotional_tone,
    knowledge_domains,
    recent_activities,
  };
}

/**
 * 将人格档案转换为系统提示词
 */
export function buildPersonaPrompt(profile: PersonaProfile, context: string, availableSources?: string[]): string {
  const sections = [];
  
  sections.push(`# 你的身份
你现在要扮演一个真实的人类用户，根据以下人格档案和记忆库来回答问题和对话。`);

  sections.push(`## 基本信息
- 姓名：${profile.name}
- 语言风格：${profile.language_style}
- 情感基调：${profile.emotional_tone}`);

  // 新增：明确列出可用的数据源
  if (availableSources && availableSources.length > 0) {
    sections.push(`## 📦 可用的记忆数据源
你拥有以下平台和来源的完整数据访问权限：
${availableSources.map(s => {
  const sourceMap: Record<string, string> = {
    'instagram': '✅ Instagram（包括私信对话、帖子、故事等）',
    'google': '✅ Google（Gmail 邮件、Drive 文档、Photos 照片等）',
    'wechat': '✅ 微信（聊天记录、朋友圈等）',
    'chrome': '✅ Chrome 浏览历史',
    'search': '✅ 搜索记录',
    'youtube': '✅ YouTube 历史',
  };
  return `- ${sourceMap[s.toLowerCase()] || `✅ ${s}`}`;
}).join('\n')}

**重要**：当用户询问关于上述任何平台的信息时，请基于记忆上下文中检索到的相关内容进行回答。`);
  }

  if (profile.interests.length > 0) {
    sections.push(`## 兴趣爱好
${profile.interests.map(i => `- ${i}`).join('\n')}`);
  }

  if (profile.experiences.length > 0) {
    sections.push(`## 主要经历
${profile.experiences.map(e => `- ${e}`).join('\n')}`);
  }

  if (profile.thinking_patterns.length > 0) {
    sections.push(`## 思考特点
${profile.thinking_patterns.map(p => `- ${p}`).join('\n')}`);
  }

  if (profile.knowledge_domains.length > 0) {
    sections.push(`## 知识领域
${profile.knowledge_domains.map(k => `- ${k}`).join('\n')}`);
  }

  if (profile.recent_activities.length > 0) {
    sections.push(`## 最近活动
${profile.recent_activities.map(a => `- ${a}`).join('\n')}`);
  }

  if (context && context.trim()) {
    sections.push(`## 📚 相关记忆上下文（已根据你的问题检索）
${context}`);
  } else {
    sections.push(`## 📚 相关记忆上下文
当前查询未检索到高度相关的记忆片段，但你可以基于整体知识和经验回答。`);
  }

  sections.push(`## 对话要求
1. 使用第一人称"我"来回答，就像你本人在说话
2. 保持与上述人格特征一致的语言风格和思维方式
3. 当用户询问具体平台或记忆时，优先引用"相关记忆上下文"中的内容
4. 如果记忆上下文为空或不相关，可以说"让我查看一下记忆库..."并建议用户更具体的描述
5. 回答要真实、自然，避免机械复述记忆内容
6. **绝不**说"没有任何关于 XXX 的信息"，除非确实在可用数据源列表中不存在该平台`);

  return sections.join('\n\n');
}

// ===== 辅助分析函数 =====

function extractInterests(texts: string[]): string[] {
  const keywords = ['喜欢', '爱好', '兴趣', '热衷', '关注', '享受', '经常'];
  const interests = new Set<string>();
  
  for (const text of texts) {
    const lower = text.toLowerCase();
    
    // 运动健身
    if (lower.match(/健身|运动|跑步|游泳|瑜伽|力量训练|有氧/)) {
      interests.add('健身运动');
    }
    
    // 技术学习
    if (lower.match(/学习|技术|编程|开发|react|typescript|ai|rag|前端|后端/)) {
      interests.add('技术学习与开发');
    }
    
    // 旅游
    if (lower.match(/旅游|旅行|北京|长城|故宫|景点|参观/)) {
      interests.add('旅游探索');
    }
    
    // 美食
    if (lower.match(/美食|烤鸭|餐厅|好吃|菜|年夜饭/)) {
      interests.add('美食品鉴');
    }
    
    // 家庭
    if (lower.match(/家人|家庭|聚会|妈妈|爸爸|春节|亲人/)) {
      interests.add('家庭生活');
    }
  }
  
  return Array.from(interests).slice(0, 5);
}

function extractExperiences(texts: string[]): string[] {
  const experiences: string[] = [];
  
  for (const text of texts) {
    // 旅行经历
    if (text.match(/(去年|最近|上次).*(去了|旅游|参观).*(北京|长城|故宫)/)) {
      experiences.push('去北京旅游，参观了故宫和长城');
    }
    
    // 工作/项目经历
    if (text.match(/(完成|开发|项目).*(前端|React|TypeScript)/)) {
      experiences.push('从事前端开发工作，使用 React 和 TypeScript');
    }
    
    // 学习经历
    if (text.match(/学习.*(RAG|AI|技术|知识)/)) {
      experiences.push('正在学习 AI 相关技术（RAG、向量数据库等）');
    }
    
    // 健身经历
    if (text.match(/(开始|坚持).*(健身|运动|锻炼)/)) {
      experiences.push('坚持每周健身，进行力量训练和有氧运动');
    }
  }
  
  return [...new Set(experiences)].slice(0, 5);
}

function analyzeLanguageStyle(text: string): string {
  const markers = {
    formal: text.match(/因此|综上所述|鉴于|然而|此外/g)?.length || 0,
    casual: text.match(/哈哈|嗯|啊|哦|吧|呢|嘛/g)?.length || 0,
    technical: text.match(/API|技术|函数|代码|数据库|算法|优化/g)?.length || 0,
    emotional: text.match(/开心|高兴|喜欢|感觉|觉得|希望/g)?.length || 0,
  };
  
  const total = Object.values(markers).reduce((a, b) => a + b, 1);
  const styles = [];
  
  if (markers.casual / total > 0.3) styles.push('随和自然');
  if (markers.technical / total > 0.2) styles.push('专业理性');
  if (markers.emotional / total > 0.2) styles.push('情感丰富');
  if (markers.formal / total > 0.2) styles.push('条理清晰');
  
  return styles.length > 0 ? styles.join('、') : '简洁直接';
}

function extractThinkingPatterns(texts: string[]): string[] {
  const patterns: string[] = [];
  
  const allText = texts.join(' ');
  
  // 目标导向
  if (allText.match(/目标|计划|打算|希望|想要/)) {
    patterns.push('目标导向，善于制定计划');
  }
  
  // 逻辑分析
  if (allText.match(/因为|所以|如果|那么|分析|思考/)) {
    patterns.push('注重逻辑分析和因果关系');
  }
  
  // 实践行动
  if (allText.match(/开始|坚持|完成|实践|执行/)) {
    patterns.push('注重实际行动和执行');
  }
  
  // 学习成长
  if (allText.match(/学习|提高|优化|改进|进步/)) {
    patterns.push('持续学习，追求进步');
  }
  
  return patterns.slice(0, 3);
}

function analyzeEmotionalTone(text: string): string {
  const positive = text.match(/开心|高兴|喜欢|很棒|顺利|满意/g)?.length || 0;
  const negative = text.match(/难|困难|失败|糟糕|不好/g)?.length || 0;
  
  if (positive > negative * 2) return '积极乐观';
  if (negative > positive * 2) return '谨慎理性';
  return '平和务实';
}

function extractKnowledgeDomains(texts: string[]): string[] {
  const domains = new Set<string>();
  const allText = texts.join(' ').toLowerCase();
  
  if (allText.match(/react|typescript|javascript|前端|开发|代码/)) {
    domains.add('前端开发（React/TypeScript）');
  }
  
  if (allText.match(/ai|rag|向量|数据库|机器学习|embedding/)) {
    domains.add('人工智能与 RAG 技术');
  }
  
  if (allText.match(/健身|运动|力量|有氧|体能|训练/)) {
    domains.add('健身与运动科学');
  }
  
  if (allText.match(/性能|优化|测试|架构|系统/)) {
    domains.add('软件工程与性能优化');
  }
  
  return Array.from(domains).slice(0, 4);
}

function extractRecentActivities(recentTexts: string[]): string[] {
  const activities: string[] = [];
  
  for (const text of recentTexts.slice(0, 10)) {
    if (text.match(/今天|最近|刚刚|现在/)) {
      const activity = text.slice(0, 60).replace(/\n/g, ' ');
      if (activity.length > 10) {
        activities.push(activity);
      }
    }
  }
  
  return activities.slice(0, 3);
}

function getDefaultPersona(): PersonaProfile {
  return {
    name: "用户",
    interests: ["学习新技术", "日常生活记录"],
    experiences: [],
    language_style: "简洁自然",
    thinking_patterns: ["善于思考", "注重实践"],
    emotional_tone: "平和理性",
    knowledge_domains: [],
    recent_activities: [],
  };
}
