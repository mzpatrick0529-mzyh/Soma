# Self Agent 人格训练系统 - 完整优化方案

## 🎯 优化目标

基于顶尖 AI 工程和科学研究，打造端到端的人格模拟训练系统，实现：
1. **数据导入 → 自动向量化** ✅ 已完成
2. **会话解析 → 训练样本生成** ✅ 已完成  
3. **LoRA 微调 → 人格模型** ✅ 已完成
4. **RAG 增强推理 → 个性化回复** ✅ 已完成
5. **RLHF 持续优化** ⏳ 框架已就绪

---

## 📊 完成进度总览

### ✅ 已完成（70%）

#### 1. 数据导入系统优化

**文件**: `Self_AI_Agent/src/importers/instagram.ts`, `google.ts`

**关键修复**:
```typescript
// ❌ 旧版本：丢失 JSON 结构
content = extractInstagramJson(obj); // 转换为纯文本

// ✅ 新版本：保留 JSON 结构
content = raw; // 保存原始 JSON 字符串
metadata: {
  isJson: true,
  formattedText: extractInstagramJson(obj), // 格式化文本用于显示
  hasMessages: obj.messages ? true : false
}
```

**优化点**:
- ✅ JSON 文件保存原始结构（用于训练样本生成）
- ✅ 格式化文本保存在 metadata（用于 RAG 检索）
- ✅ 自动向量化（embedText + insertVector）
- ✅ 支持 Instagram/Google/WeChat 多数据源

#### 2. 训练样本生成器

**文件**: `Self_AI_Agent/src/services/trainingSampleGenerator.ts` (360行)

**核心功能**:
```typescript
// 1. 智能解析会话
parseInstagramMessages(jsonContent) → ConversationMessage[]
parseGoogleMessages(jsonContent) → ConversationMessage[]
parseWeChatMessages(jsonContent) → ConversationMessage[]

// 2. 质量评分算法
calculateQualityScore(message, context) → 0-1 score
// 评分因素:
// + 长度适中 (5-100词) +0.2
// + 有对话上下文 (≥2条) +0.2
// + 完整句子 (有标点) +0.1
// - 重复字符 (hahaha) -0.3
// - 过多emoji -0.2

// 3. 情感分析
detectEmotionalContext(message) → 'positive' | 'negative' | 'neutral'
```

**数据流**:
```
Instagram JSON → parse → 提取用户消息 + 上下文 →
计算质量分数 → 过滤低质量 (< 0.3) →
插入 personality_training_samples 表
```

#### 3. 训练 API 路由

**文件**: `Self_AI_Agent/src/routes/training.ts` (291行)

**端点**:

##### POST `/api/self-agent/training/generate-samples`
```bash
curl -X POST http://localhost:8787/api/self-agent/training/generate-samples \
  -H "Content-Type: application/json" \
  -d '{"userId": "user@email.com", "source": "instagram"}'

# Response:
{
  "success": true,
  "samplesCreated": 342,
  "stats": {
    "total": 342,
    "unused": 342,
    "bySource": {"instagram": 200, "google": 142},
    "avgQuality": 0.73
  }
}
```

##### POST `/api/self-agent/training/trigger`
```bash
curl -X POST http://localhost:8787/api/self-agent/training/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@email.com",
    "epochs": 3,
    "batchSize": 4,
    "minSamples": 50
  }'

# Response:
{
  "success": true,
  "trainingId": "training-user-1234567890",
  "status": "started",
  "sampleCount": 342,
  "estimatedDurationMinutes": 17
}
```

##### GET `/api/self-agent/training/status/:userId`
实时查询训练状态和模型信息

#### 4. LoRA 训练器优化

**文件**: `Self_AI_Agent/src/ml/personality_trainer.py` (533行)

**架构**:
```python
class PersonalityModelTrainer:
    # 基础模型: google/gemma-2b (2B parameters)
    # 训练方法: LoRA fine-tuning
    # 可训练参数: 0.1-1% (仅 attention 层)
    
    def prepare_training_data(min_samples=50):
        # 从 personality_training_samples 表加载
        # 构建 instruction-following 格式
        
    def initialize_model(lora_config):
        # LoRA 配置:
        # - rank: 16
        # - alpha: 32
        # - target_modules: ['q_proj', 'v_proj']
        # - dropout: 0.1
        
    def train(dataset, epochs=3, batch_size=4):
        # HuggingFace Trainer
        # FP16 混合精度训练
        # 梯度累积 (4 steps)
        # 自动保存 checkpoints
```

**关键修复**:
- ✅ 修复数据库表名 (`personality_model_versions` → `personality_models`)
- ✅ 修复列名匹配 (`version_number` → `model_version`)
- ✅ 添加毫秒时间戳支持
- ✅ 处理 `training_loss` 可能不存在的情况

#### 5. 推理引擎

**文件**: `Self_AI_Agent/src/ml/personality_inference.py` (新增, 340行)

**功能**:
```python
class PersonalityInferenceEngine:
    def __init__(user_id, model_path=None):
        # 自动加载最新训练的模型
        # 基础模型 + LoRA adapter
        
    def generate_response(
        message,
        conversation_history=None,
        relevant_memories=None
    ):
        # 1. 构建 prompt (记忆 + 历史 + 当前消息)
        # 2. Tokenize + Generate
        # 3. 提取回复（去除 prompt）
        # 4. 返回 response + metadata
        
    def batch_generate(messages):
        # 批量生成（用于评估）
```

**测试命令**:
```bash
python3 src/ml/personality_inference.py \
  --user-id user@email.com \
  --message "你好，最近怎么样？" \
  --temperature 0.8
```

#### 6. 推理 API 路由

**文件**: `Self_AI_Agent/src/routes/chatInference.ts` (新增, 320行)

**端点**:

##### POST `/api/self-agent/chat/inference`
```bash
curl -X POST http://localhost:8787/api/self-agent/chat/inference \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user@email.com",
    "message": "周末有什么计划？",
    "conversationHistory": [...],
    "useRAG": true,
    "temperature": 0.8
  }'

# Response:
{
  "success": true,
  "response": "周末我打算去爬山，好久没运动了",
  "metadata": {
    "modelVersion": 1,
    "usedMemories": 3,
    "temperature": 0.8,
    "prompt_length": 256,
    "response_length": 42
  }
}
```

##### GET `/api/self-agent/chat/model-status/:userId`
查询模型训练状态和统计信息

#### 7. 自动化集成

**文件**: `Self_AI_Agent/src/routes/upload.ts`

**修改**:
```typescript
// 导入完成后自动触发
async processUploadedFile(...) {
  // 1-4. 原有流程...
  
  // 5. ✨ 新增：生成训练样本
  const samplesCreated = await generateTrainingSamples(userId, dataSource);
  const stats = getTrainingSampleStats(userId);
  
  // 6. 如果样本足够，可以自动触发训练
  if (stats.unused >= 50) {
    console.log(`✅ User ${userId} has ${stats.unused} samples ready for training`);
    // 可选：自动调用 training/trigger API
  }
}
```

**新增进度阶段**: `"generating_samples"`

---

## 🏗️ 系统架构

### 数据流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户数据                                 │
│  Instagram Messages | Google Takeout | WeChat Export            │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      数据导入层 ✅                                │
│  detectDataSource() → importInstagramData() / importGoogleTakeout()  
│  ├── 保存原始 JSON (content)                                     │
│  ├── 格式化文本 (metadata.formattedText)                         │
│  └── 自动向量化 (embedText + insertVector)                       │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                   训练样本生成层 ✅                               │
│  generateTrainingSamples(userId, source)                        │
│  ├── 解析 JSON → 提取会话消息                                    │
│  ├── 识别用户消息 vs 对方消息                                    │
│  ├── 提取对话上下文 (前5条消息)                                  │
│  ├── 质量评分 (0-1 scale)                                       │
│  ├── 情感分析 (positive/negative/neutral)                       │
│  └── 插入 personality_training_samples 表                       │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                     LoRA 训练层 ✅                                │
│  PersonalityModelTrainer (Python)                               │
│  ├── 加载训练样本 (≥50条)                                        │
│  ├── 格式化为 instruction-following                             │
│  ├── Tokenization (max_length=512)                             │
│  ├── LoRA config (rank=16, alpha=32)                           │
│  ├── HuggingFace Trainer (3 epochs, batch=4)                   │
│  └── 保存模型 → ./models/personality/{userId}/                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      推理引擎 ✅                                  │
│  PersonalityInferenceEngine (Python)                            │
│  ├── 加载 base model + LoRA adapter                             │
│  ├── 接收输入: message + history + memories                     │
│  ├── 构建 prompt (上下文组装)                                    │
│  ├── Generate (temperature=0.8, max_tokens=150)                │
│  └── 返回个性化回复                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API 层 ✅                                    │
│  POST /api/self-agent/chat/inference                            │
│  ├── 检查用户模型是否存在                                        │
│  ├── RAG 检索相关记忆 (topK=3)                                   │
│  ├── 调用 Python 推理脚本                                        │
│  └── 返回 JSON response + metadata                             │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库架构

```sql
-- 训练样本表
CREATE TABLE personality_training_samples (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_context TEXT,      -- JSON: 前5条消息
  user_response TEXT,              -- 用户的回复（训练目标）
  target_person TEXT,              -- 对话对象
  timestamp_context INTEGER,
  emotional_context TEXT,          -- positive/negative/neutral
  source_doc_id TEXT,              -- 来源文档ID
  quality_score REAL,              -- 0-1 质量分数
  used_for_training INTEGER DEFAULT 0,
  created_at INTEGER
);

-- 模型版本表
CREATE TABLE personality_models (
  user_id TEXT PRIMARY KEY,
  model_version INTEGER NOT NULL,
  model_type TEXT DEFAULT 'lora',
  model_path TEXT,                 -- ./models/personality/{userId}/
  training_samples_count INTEGER,
  training_duration_seconds REAL,
  training_loss REAL,
  is_active INTEGER DEFAULT 1,
  hyperparameters TEXT,            -- JSON
  created_at INTEGER
);

-- 训练任务表
CREATE TABLE training_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'queued',    -- queued/running/completed/failed
  started_at INTEGER,
  finished_at INTEGER,
  error_message TEXT
);
```

---

## 🧪 测试指南

### 方式 1: 使用端到端测试脚本

```bash
cd Self_AI_Agent
./test-end-to-end.sh
```

**脚本功能**:
1. ✅ 检查数据库状态（文档、向量）
2. ✅ 生成训练样本
3. ✅ 检查 Python 环境
4. ✅ 触发模型训练（可选）
5. ✅ 监控训练进度
6. ✅ 测试推理 API

### 方式 2: 手动测试

#### Step 1: 生成训练样本
```bash
curl -X POST http://localhost:8787/api/self-agent/training/generate-samples \
  -H "Content-Type: application/json" \
  -d '{"userId": "mzpatrick0529@gmail.com", "source": "all"}' | jq '.'
```

#### Step 2: 查看统计
```bash
curl http://localhost:8787/api/self-agent/training/stats/mzpatrick0529@gmail.com | jq '.'
```

#### Step 3: 触发训练
```bash
curl -X POST http://localhost:8787/api/self-agent/training/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "mzpatrick0529@gmail.com",
    "epochs": 3,
    "batchSize": 4
  }' | jq '.'
```

#### Step 4: 监控状态
```bash
watch -n 5 'curl -s http://localhost:8787/api/self-agent/training/status/mzpatrick0529@gmail.com | jq "."'
```

#### Step 5: 测试推理
```bash
curl -X POST http://localhost:8787/api/self-agent/chat/inference \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "mzpatrick0529@gmail.com",
    "message": "你好，最近怎么样？",
    "useRAG": true,
    "temperature": 0.8
  }' | jq '.'
```

---

## ⏳ 待完成功能（30%）

### 1. 前端集成

**文件**: `src/hooks/useSelfAgent.ts` (待创建)

```typescript
export function useSelfAgent(userId: string) {
  const [isTraining, setIsTraining] = useState(false);
  const [hasModel, setHasModel] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  
  // 查询模型状态
  const checkModelStatus = async () => {
    const res = await fetch(`/api/self-agent/chat/model-status/${userId}`);
    const data = await res.json();
    setHasModel(data.hasModel);
    setModelStatus(data);
  };
  
  // 发送消息
  const sendMessage = async (message: string, history: any[]) => {
    const res = await fetch('/api/self-agent/chat/inference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message,
        conversationHistory: history,
        useRAG: true
      })
    });
    return await res.json();
  };
  
  // 触发训练
  const startTraining = async () => {
    setIsTraining(true);
    const res = await fetch('/api/self-agent/training/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    // 轮询状态...
  };
  
  return {
    hasModel,
    isTraining,
    modelStatus,
    sendMessage,
    startTraining,
    checkModelStatus
  };
}
```

**Chat 页面集成**:
```typescript
// src/pages/Chat.tsx
const { hasModel, sendMessage, startTraining } = useSelfAgent(userId);

{!hasModel && (
  <Alert>
    <AlertTitle>Self Agent 未训练</AlertTitle>
    <AlertDescription>
      导入数据后自动生成训练样本。
      <Button onClick={startTraining}>开始训练</Button>
    </AlertDescription>
  </Alert>
)}

{hasModel && (
  <ChatInterface onSend={async (msg) => {
    const result = await sendMessage(msg, history);
    return result.response;
  }} />
)}
```

### 2. RLHF 反馈收集

**文件**: `Self_AI_Agent/src/routes/feedback.ts` (待创建)

```typescript
// POST /api/self-agent/feedback/submit
// 用户对模型回复的评分和反馈
router.post('/submit', (req, res) => {
  const {
    userId,
    conversationId,
    messageId,
    agentResponse,
    rating, // 1-5
    feedbackType, // style/accuracy/emotion/relationship
    feedbackText,
    suggestedResponse
  } = req.body;
  
  // 插入 personality_feedback 表
  // 用于后续 RLHF 训练
});
```

### 3. 持续学习机制

**自动重训练触发**:
- 新数据达到阈值（如新增 100 条会话）
- 用户反馈达到阈值（如 50 条负面反馈）
- 定期重训练（每月一次）

**增量训练**:
```python
# 加载现有模型
existing_model = PeftModel.from_pretrained(base_model, model_path)

# 继续训练新数据
trainer = Trainer(model=existing_model, ...)
trainer.train()
```

### 4. 多模型版本管理

**模型切换**:
```sql
-- 激活特定版本
UPDATE personality_models
SET is_active = CASE 
  WHEN model_version = 3 THEN 1 
  ELSE 0 
END
WHERE user_id = 'user@email.com';
```

**A/B 测试**:
- 同时部署多个版本
- 随机选择模型回复
- 收集用户偏好数据

### 5. 性能优化

**推理加速**:
- ✅ FP16 混合精度
- ⏳ 模型量化 (INT8/INT4)
- ⏳ TensorRT 优化
- ⏳ 批处理推理

**缓存机制**:
```typescript
// 缓存常见问题的回复
const responseCache = new Map<string, {response: string, timestamp: number}>();

if (responseCache.has(message)) {
  const cached = responseCache.get(message);
  if (Date.now() - cached.timestamp < 3600000) { // 1小时有效
    return cached.response;
  }
}
```

---

## 📈 性能指标

### 目标

| 指标 | 目标值 | 当前状态 |
|------|--------|----------|
| 训练样本生成成功率 | >80% | ⏳ 待测试 |
| 单次训练时间 (50样本) | <5分钟 (GPU) | ⏳ 待测试 |
| 推理延迟 (单次) | <2秒 | ⏳ 待测试 |
| 模型大小 (LoRA adapter) | <50MB | ✅ ~10-20MB |
| 图灵测试通过率 | >70% | ⏳ 待评估 |
| 用户满意度 | >4.0/5.0 | ⏳ 需收集反馈 |

### 监控

```sql
-- 训练统计
SELECT 
  COUNT(*) as total_models,
  AVG(training_loss) as avg_loss,
  AVG(training_samples_count) as avg_samples
FROM personality_models;

-- 推理统计
SELECT 
  COUNT(*) as total_inferences,
  AVG(response_time_ms) as avg_latency
FROM inference_logs
WHERE created_at > datetime('now', '-7 days');
```

---

## 🚀 部署清单

### Python 依赖

```bash
pip install torch transformers peft datasets accelerate
```

### 服务器配置

```bash
# 环境变量
export SELF_AGENT_DB="./self_agent.db"
export BASE_MODEL="google/gemma-2b"
export MODEL_OUTPUT_DIR="./models/personality"

# 启动服务
cd Self_AI_Agent
npm run dev
```

### 目录结构

```
Self_AI_Agent/
├── self_agent.db (2.9GB)
├── models/
│   └── personality/
│       └── {userId}/
│           ├── adapter_config.json
│           ├── adapter_model.bin
│           └── tokenizer/
├── src/
│   ├── ml/
│   │   ├── personality_trainer.py ✅
│   │   ├── personality_inference.py ✅
│   │   ├── personality_extractor.py
│   │   └── me_alignment_engine.py
│   ├── routes/
│   │   ├── training.ts ✅
│   │   ├── chatInference.ts ✅
│   │   └── upload.ts (已修改)
│   ├── services/
│   │   └── trainingSampleGenerator.ts ✅
│   └── importers/
│       ├── instagram.ts ✅
│       ├── google.ts ✅
│       └── wechat.ts
└── test-end-to-end.sh ✅
```

---

## 📚 相关文档

1. **SELF_AGENT_TRAINING_IMPLEMENTATION_REPORT.md** - 完整实现报告
2. **PERSONALITY_V2_ARCHITECTURE.md** - V2.0 架构设计
3. **PERSONALITY_ML_ARCHITECTURE.md** - ML 系统架构
4. **test-end-to-end.sh** - 端到端测试脚本

---

## 🎓 技术栈

- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite + better-sqlite3
- **ML 框架**: Python + PyTorch + HuggingFace Transformers
- **微调方法**: LoRA (Low-Rank Adaptation)
- **基础模型**: google/gemma-2b (2B parameters)
- **向量化**: sentence-transformers (all-MiniLM-L6-v2)
- **RAG**: Cosine similarity search

---

## 🔬 科学原理

### LoRA (Low-Rank Adaptation)

**核心思想**: 
- 冻结预训练模型的所有参数
- 只在 attention 层添加小规模的可训练矩阵
- 训练参数量: 0.1-1% (相比全参数微调)

**数学表示**:
```
W = W₀ + BA
其中:
W₀: 预训练权重 (冻结)
B: rank × d_model
A: d_model × rank
rank << d_model (通常 rank=8-16)
```

**优势**:
- 训练快 (减少 90% 计算量)
- 存储小 (模型文件 <50MB)
- 多任务切换 (只需切换 LoRA adapter)

### RAG (Retrieval-Augmented Generation)

**流程**:
```
用户消息 → 
Embedding (384-dim vector) → 
Cosine Similarity Search (top-K) → 
检索相关记忆 → 
拼接到 Prompt → 
生成回复
```

**效果**:
- 提供上下文信息
- 减少幻觉（hallucination）
- 增强个性化一致性

---

## 🎯 下一步行动

### 立即执行（P0）

1. ✅ **修复数据格式** - 完成
2. ✅ **修复向量化** - 完成
3. ✅ **优化训练器** - 完成
4. ✅ **创建推理引擎** - 完成
5. ⏳ **测试端到端流程** - 执行 `./test-end-to-end.sh`

### 本周完成（P1）

6. ⏳ 前端 `useSelfAgent` hook
7. ⏳ Chat 页面集成
8. ⏳ 训练状态 UI
9. ⏳ 反馈收集接口

### 下周完成（P2）

10. ⏳ RLHF 实现
11. ⏳ 持续学习机制
12. ⏳ 性能监控仪表板
13. ⏳ A/B 测试框架

---

**报告时间**: 2024-10-22  
**版本**: v2.0 Complete  
**完成度**: 70% (核心系统完成，前端集成待开发)
