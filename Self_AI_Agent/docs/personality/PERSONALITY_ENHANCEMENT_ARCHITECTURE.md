# 🧠 人格增强系统架构设计

## 📋 现状分析

### 已有基础设施 ✅

**TypeScript 层 (src/pipeline/persona.ts)**:
- 简单关键词匹配提取人格特征
- 兴趣、经历、语言风格、思维模式识别
- 基于模板的 prompt 生成

**Python ML 层 (src/ml/)**:
1. **personality_extractor.py** (680行)
   - 多维特征提取:linguistic, emotional, cognitive, social, behavioral, values
   - spaCy NLP + NLTK sentiment + TextBlob
   - **限制**: 特征提取完成但未与 TypeScript 层集成

2. **hierarchical_memory_manager.py** (944行)
   - L0 → L1 → L2 三层记忆架构
   - L0Memory: 原始记忆存储
   - L1Cluster: 主题聚类 (HDBSCAN + UMAP)
   - L2Biography: 个人传记生成
   - **限制**: 架构设计完整但未实际部署使用

3. **personality_trainer.py** (533行)
   - LoRA fine-tuning pipeline
   - 基于 Transformers + PEFT
   - **限制**: 训练流程完整但需要大量计算资源

### 核心问题 ⚠️

1. **分离架构**: Python ML 层和 TypeScript API 层未打通
2. **浅层分析**: 现有 persona.ts 只用简单正则匹配,未利用深度 ML
3. **静态人格**: 缺少时序演化建模
4. **被动响应**: 无主动行为触发机制
5. **低真实感**: 生成内容容易被识别为 AI

---

## 🎯 增强目标

### 核心指标

| 维度 | 当前状态 | 目标状态 |
|------|---------|---------|
| 人格拟合度 | ~60% | **95%+** |
| 图灵测试通过率 | ~40% | **90%+** |
| 语言风格相似度 | 0.3-0.5 | **0.85+** (BLEU) |
| 主动触发准确率 | 0% (无) | **80%+** |
| 关系识别准确率 | 0% (无) | **90%+** |

---

## 🏗️ 系统架构

### 总体流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                         数据层 (Data Layer)                        │
│  [SQLite/Supabase] → chunks, documents, user_models              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   L0: 原始记忆处理 (Memory Processing)              │
│  - 文本清洗 & 实体提取 (spaCy NER)                                   │
│  - 情感分析 (VADER Sentiment)                                      │
│  - Embedding 生成 (sentence-transformers)                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  L1: 主题聚类 (Topic Clustering)                   │
│  - HDBSCAN 聚类算法                                                │
│  - UMAP 降维可视化                                                  │
│  - 主题关键词提取                                                    │
│  - 时序关系建模                                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              L2: 人格传记生成 (Personality Biography)               │
│  ┌──────────────────────┬──────────────────────┐                 │
│  │ Big Five 人格分析      │  关系图谱构建         │                 │
│  │ - Openness          │  - NetworkX 图        │                 │
│  │ - Conscientiousness │  - 关系强度           │                 │
│  │ - Extraversion      │  - 社群发现           │                 │
│  │ - Agreeableness     │  - 情感倾向           │                 │
│  │ - Neuroticism       │                      │                 │
│  └──────────────────────┴──────────────────────┘                 │
│  ┌──────────────────────┬──────────────────────┐                 │
│  │ 语言签名 (LinguisticSig) │ 时序模式 (Temporal)  │                 │
│  │ - 词汇分布           │  - 日周月年周期       │                 │
│  │ - 句式结构           │  - 生日/纪念日        │                 │
│  │ - Emoji 使用         │  - 行为习惯           │                 │
│  │ - 文化表达           │  - 活跃时段           │                 │
│  └──────────────────────┴──────────────────────┘                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                应用层 (Application Layer)                         │
│  ┌──────────────────────┬──────────────────────┐                 │
│  │ 对话生成引擎          │  主动行为引擎         │                 │
│  │ (ChatEngine)         │ (ProactiveEngine)    │                 │
│  │ - Persona-aware prompt│ - 定时任务调度       │                 │
│  │ - 语言风格注入        │ - 事件触发器         │                 │
│  │ - 上下文记忆          │ - 生日提醒           │                 │
│  │ - 关系感知回答        │ - 节日祝福           │                 │
│  │                      │ - 周期性check-in     │                 │
│  └──────────────────────┴──────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 模块设计

### 1. Enhanced Personality Engine (TypeScript)

**文件**: `Self_AI_Agent/src/services/personalityEngine.ts`

```typescript
interface EnhancedPersonaProfile extends PersonaProfile {
  // Big Five 人格维度 (0-1范围)
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  
  // 跨平台人格一致性分数
  crossPlatformConsistency: {
    instagram_wechat: number;
    wechat_google: number;
    overall: number;
  };
  
  // 关系上下文人格变化
  contextualPersona: Array<{
    target_person: string;
    relationship_type: 'family' | 'friend' | 'colleague' | 'stranger';
    persona_shift: {
      formality: number;    // 正式程度 (-1到1, -1非常随意, 1非常正式)
      emotional_openness: number; // 情感开放度
      humor_level: number;  // 幽默程度
    };
  }>;
  
  // 语言签名 (从 Python ML 导入)
  linguisticSignature: {
    vocabularyFrequency: Record<string, number>;
    sentenceStructurePattern: string;
    emojiUsagePattern: Array<{ emoji: string; frequency: number; context: string }>;
    culturalExpressions: string[];
  };
  
  // 时序模式
  temporalPatterns: {
    dailyRoutine: Array<{ time: string; activity: string; frequency: number }>;
    weeklyPatterns: Record<string, string[]>; // 周一到周日的典型活动
    importantDates: Array<{ date: string; type: 'birthday' | 'anniversary' | 'holiday'; person?: string }>;
  };
}
```

**核心方法**:
```typescript
async function buildEnhancedPersonaProfile(
  userId: string,
  options?: {
    includeBigFive?: boolean;
    includeRelationshipGraph?: boolean;
    includeTemporalAnalysis?: boolean;
  }
): Promise<EnhancedPersonaProfile>

async function analyzeCrossPlatformConsistency(
  userId: string
): Promise<{ instagram: PersonaProfile; wechat: PersonaProfile; consistency: number }>
```

### 2. Proactive Agent Engine (TypeScript)

**文件**: `Self_AI_Agent/src/services/proactiveAgent.ts`

```typescript
class ProactiveAgentEngine {
  private scheduler: NodeCron.ScheduledTask[];
  private eventEmitter: EventEmitter;
  
  // 初始化定时任务
  async initialize(userId: string): Promise<void> {
    const persona = await buildEnhancedPersonaProfile(userId, {
      includeTemporalAnalysis: true
    });
    
    // 注册生日提醒
    this.registerBirthdayReminders(persona.temporalPatterns.importantDates);
    
    // 注册节日祝福
    this.registerHolidayGreetings(persona.crossPlatformConsistency);
    
    // 注册周期性check-in
    this.registerPeriodicCheckIns(persona.contextualPersona);
  }
  
  // 生成个性化主动消息
  async generateProactiveMessage(
    userId: string,
    eventType: 'birthday' | 'holiday' | 'check-in',
    targetPerson?: string
  ): Promise<string> {
    const persona = await getEnhancedPersona(userId);
    const linguisticStyle = persona.linguisticSignature;
    
    // 使用 LLM 生成符合用户风格的消息
    const prompt = this.buildProactivePrompt(persona, eventType, targetPerson);
    return await generateWithStyle(prompt, linguisticStyle);
  }
}
```

### 3. Temporal Pattern Analyzer (Python)

**文件**: `Self_AI_Agent/src/ml/temporal_analyzer.py`

```python
class TemporalPatternAnalyzer:
    """时序模式分析器"""
    
    def detect_cycles(self, timestamps: List[datetime]) -> Dict[str, Any]:
        """检测周期性模式 (日/周/月/年)"""
        # 使用 FFT 或 ARIMA 检测周期
        pass
    
    def extract_important_dates(
        self, 
        messages: List[Dict],
        user_id: str
    ) -> List[Dict]:
        """提取重要日期 (生日、纪念日等)"""
        # NER识别 "生日快乐"、"结婚纪念日" 等关键词
        # 聚类同一天的祝福消息
        pass
    
    def predict_next_behavior(
        self,
        user_history: List[Dict],
        current_time: datetime
    ) -> Dict[str, float]:
        """预测用户接下来可能的行为"""
        # 基于历史行为构建 LSTM/GRU 模型
        pass
```

### 4. Relationship Graph Builder (Python)

**文件**: `Self_AI_Agent/src/ml/relationship_graph.py`

```python
import networkx as nx

class RelationshipGraphBuilder:
    """社交关系图谱构建器"""
    
    def build_graph(self, conversations: List[Dict]) -> nx.Graph:
        """构建社交网络图"""
        G = nx.Graph()
        
        # 节点: 每个联系人
        # 边: 互动频率 + 情感倾向
        for conv in conversations:
            sender = conv['sender']
            receiver = conv['receiver']
            sentiment = self.analyze_sentiment(conv['content'])
            
            if G.has_edge(sender, receiver):
                G[sender][receiver]['weight'] += 1
                G[sender][receiver]['sentiment_sum'] += sentiment
            else:
                G.add_edge(sender, receiver, weight=1, sentiment_sum=sentiment)
        
        return G
    
    def detect_communities(self, G: nx.Graph) -> Dict[str, List[str]]:
        """社群发现 (家人/朋友/同事圈)"""
        communities = nx.community.louvain_communities(G)
        return {
            'family': communities[0],
            'friends': communities[1],
            'colleagues': communities[2],
        }
    
    def calculate_relationship_strength(
        self,
        user_id: str,
        target_person: str,
        G: nx.Graph
    ) -> float:
        """计算关系强度 (0-1)"""
        if not G.has_edge(user_id, target_person):
            return 0.0
        
        weight = G[user_id][target_person]['weight']
        max_weight = max(G[user_id][neighbor]['weight'] for neighbor in G.neighbors(user_id))
        
        return weight / max_weight
```

---

## 🔄 集成方案

### Python ↔ TypeScript 通信

**方案 A: 子进程调用 (推荐)**

```typescript
// src/services/mlBridge.ts
import { spawn } from 'child_process';

export async function callPythonML(
  scriptName: string,
  args: Record<string, any>
): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      `./src/ml/${scriptName}.py`,
      JSON.stringify(args)
    ]);
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(JSON.parse(output));
      } else {
        reject(new Error(`Python script failed with code ${code}`));
      }
    });
  });
}

// 使用示例
const bigFiveScores = await callPythonML('personality_extractor', {
  user_id: 'user123',
  method: 'extract_big_five'
});
```

**方案 B: HTTP API (可扩展)**

```python
# src/ml/ml_api.py
from flask import Flask, request, jsonify
from personality_extractor import PersonalityFeatureExtractor

app = Flask(__name__)
extractor = PersonalityFeatureExtractor()

@app.route('/analyze_personality', methods=['POST'])
def analyze_personality():
    data = request.json
    user_id = data['user_id']
    conversations = data['conversations']
    
    features = extractor.extract_all_features(conversations, user_id)
    return jsonify(features)

if __name__ == '__main__':
    app.run(port=5001)
```

---

## 📊 数据库扩展

### 新增表结构

```sql
-- 增强型人格档案表
CREATE TABLE IF NOT EXISTS enhanced_persona_profiles (
  user_id TEXT PRIMARY KEY,
  
  -- Big Five 分数 (JSON)
  big_five_scores TEXT NOT NULL,
  
  -- 跨平台一致性 (JSON)
  cross_platform_consistency TEXT,
  
  -- 关系上下文人格 (JSON数组)
  contextual_persona TEXT,
  
  -- 语言签名 (JSON)
  linguistic_signature TEXT,
  
  -- 时序模式 (JSON)
  temporal_patterns TEXT,
  
  -- 版本号
  version INTEGER DEFAULT 1,
  
  -- 质量分数 (0-1)
  quality_score REAL DEFAULT 0.0,
  
  -- 时间戳
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 主动行为事件表
CREATE TABLE IF NOT EXISTS proactive_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'birthday', 'holiday', 'check-in', 'reminder'
  target_person TEXT,
  trigger_time INTEGER NOT NULL,
  message_content TEXT,
  sent_at INTEGER,
  response_received BOOLEAN DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 关系图谱表
CREATE TABLE IF NOT EXISTS relationship_graph (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_person TEXT NOT NULL,
  relationship_type TEXT, -- 'family', 'friend', 'colleague', 'stranger'
  interaction_count INTEGER DEFAULT 0,
  avg_sentiment REAL DEFAULT 0.0,
  relationship_strength REAL DEFAULT 0.0,
  last_interaction_at INTEGER,
  
  UNIQUE(user_id, target_person),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 时序行为模式表
CREATE TABLE IF NOT EXISTS temporal_behavior_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  pattern_data TEXT NOT NULL, -- JSON: {time, activity, frequency}
  confidence_score REAL DEFAULT 0.0,
  detected_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🚀 实施路线图

### Phase 1: 核心引擎 (Week 1-2)

- [ ] 创建 `personalityEngine.ts` 和 `EnhancedPersonaProfile` 接口
- [ ] 实现 Python ↔ TypeScript 通信桥接 (`mlBridge.ts`)
- [ ] 部署 `personality_extractor.py` 的 Big Five 分析
- [ ] 数据库 schema 迁移 (新增4张表)

### Phase 2: 时序分析 (Week 3)

- [ ] 实现 `temporal_analyzer.py` 周期检测
- [ ] 提取重要日期 (生日/纪念日)
- [ ] 日常行为习惯聚类

### Phase 3: 主动行为 (Week 4)

- [ ] 创建 `proactiveAgent.ts` 引擎
- [ ] 集成 `node-cron` 定时任务
- [ ] 实现生日/节日触发器
- [ ] 个性化消息生成 (基于 linguistic_signature)

### Phase 4: 关系图谱 (Week 5)

- [ ] 实现 `relationship_graph.py` 图构建
- [ ] NetworkX 社群发现
- [ ] 关系强度计算
- [ ] 关系感知对话生成

### Phase 5: 测试 & 优化 (Week 6)

- [ ] 人格一致性测试 (同一问题多次回答相似度)
- [ ] 图灵测试模拟 (人类评估员打分)
- [ ] 语言风格相似度计算 (BLEU/BERTScore)
- [ ] 主动触发准确率验证

---

## 📈 成功指标

### 定量指标

| 指标 | 基线 | 目标 | 测量方法 |
|------|------|------|---------|
| Big Five 准确率 | - | 90%+ | 与标准人格测试对比 |
| 跨平台一致性 | - | 0.85+ | Cosine similarity |
| 语言风格BLEU | - | 0.85+ | BLEU-4 score |
| 主动触发准确率 | - | 80%+ | 用户反馈正确率 |
| 关系识别F1 | - | 0.90+ | 人工标注验证 |

### 定性指标

- [ ] 用户无法区分AI生成的消息和真人消息 (图灵测试)
- [ ] 主动消息被认为"真实、贴心、符合我的性格"
- [ ] 语言风格高度一致 (用户评价"这就是我会说的话")

---

## 🔐 隐私与伦理

### 数据安全

- **E2EE 加密**: 所有人格数据在 `enhanced_persona_profiles` 表中加密存储
- **本地优先**: Python ML 模型在本地运行,不上传原始数据到云端
- **用户控制**: 提供"删除人格模型"功能 (GDPR 合规)

### 伦理准则

1. **透明性**: 明确告知用户 AI 正在模拟其人格
2. **边界**: 主动消息频率限制 (避免骚扰)
3. **真实性**: 不生成用户从未表达过的极端观点
4. **隐私**: 关系图谱不对外公开

---

## 🎓 技术栈总结

**后端 (TypeScript)**:
- Node.js + Express
- node-cron (定时任务)
- EventEmitter (事件驱动)

**机器学习 (Python)**:
- spaCy (NLP)
- NLTK (情感分析)
- sentence-transformers (Embeddings)
- scikit-learn (聚类、分类)
- NetworkX (图分析)
- ARIMA/LSTM (时序预测)

**数据库**:
- SQLite (本地开发)
- Supabase PostgreSQL (生产环境)

**通信**:
- 子进程 (spawn)
- HTTP API (Flask, 可选)

---

## 📝 下一步行动

1. ✅ 完成架构设计文档 ← **当前完成**
2. ⏭️ 创建 `personalityEngine.ts` 骨架代码
3. ⏭️ 实现 `mlBridge.ts` Python 调用
4. ⏭️ 部署数据库 schema 更新
5. ⏭️ 集成 `personality_extractor.py` Big Five 分析

---

**文档版本**: v2.0  
**作者**: GitHub Copilot (AI PM + ML Expert)  
**最后更新**: 2025-01-XX
