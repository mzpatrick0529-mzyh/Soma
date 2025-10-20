# Personality V2.0 部署指南

> **目标**: 95%+ Turing Test Pass Rate  
> **架构**: AI-Native Memory (HMM + Me-Alignment)  
> **版本**: 2.0.0

---

## 快速开始 (5分钟)

### 1. 数据库初始化

```bash
cd /Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent

# 创建V2.0表结构
sqlite3 self_agent.db < src/db/ai_native_memory_schema.sql

# 验证表创建
sqlite3 self_agent.db "SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE 'l0_%' OR name LIKE 'l1_%' OR name LIKE 'l2_%');"
```

预期输出: 13个表名 (l0_raw_memories, l1_memory_clusters, l2_biography, etc.)

### 2. 安装Python依赖

```bash
# 安装ML/NLP库
pip3 install scikit-learn umap-learn sentence-transformers spacy textblob hdbscan

# 下载spaCy语言模型
python3 -m spacy download en_core_web_sm

# 下载NLTK数据
python3 -m nltk.downloader vader_lexicon
```

### 3. 测试HMM系统

```bash
# 测试L0记忆存储
python3 src/ml/hierarchical_memory_manager.py \
  --db-path ./self_agent.db \
  --user-id test@example.com \
  --action store \
  --content "I love hiking in the mountains" \
  --source "test"

# 运行聚类
python3 src/ml/hierarchical_memory_manager.py \
  --db-path ./self_agent.db \
  --user-id test@example.com \
  --action cluster

# 生成传记
python3 src/ml/hierarchical_memory_manager.py \
  --db-path ./self_agent.db \
  --user-id test@example.com \
  --action biography
```

### 4. 测试Me-Alignment引擎

```bash
python3 src/ml/me_alignment_engine.py \
  --db-path ./self_agent.db \
  --user-id test@example.com \
  --input "What do you think about nature?"
```

预期输出: 生成回复 + 4维一致性评分

---

## 完整部署流程

### Phase 1: 基础架构 (Week 1)

#### 步骤1.1: 数据库迁移

**目标**: 将V1.0数据迁移到V2.0架构

```bash
# 创建迁移脚本
cat > migrate_v1_to_v2.py << 'EOF'
import sqlite3
import json
from datetime import datetime

def migrate():
    conn = sqlite3.connect('self_agent.db')
    cursor = conn.cursor()
    
    # 从V1.0的chunks表迁移到L0
    cursor.execute("""
        INSERT INTO l0_raw_memories (
            id, user_id, content, timestamp, source, 
            conversation_id, importance
        )
        SELECT 
            'migrated_' || id,
            user_id,
            content,
            created_at,
            'v1_migration',
            'migration_batch_1',
            0.5
        FROM chunks
        WHERE user_id IS NOT NULL
    """)
    
    migrated = cursor.rowcount
    conn.commit()
    conn.close()
    
    print(f"✅ Migrated {migrated} memories from V1.0 to L0")

if __name__ == "__main__":
    migrate()
EOF

python3 migrate_v1_to_v2.py
```

#### 步骤1.2: 生成初始记忆层次

```bash
# 为每个用户构建完整层次
python3 src/ml/hierarchical_memory_manager.py \
  --db-path ./self_agent.db \
  --user-id mzpatrick0529@gmail.com \
  --action full
```

预期: 
- L0: 所有历史记忆 (200+ memories)
- L1: 10-30个主题聚类
- L2: 完整传记 (quality_score > 0.8)

#### 步骤1.3: 集成LLM

**修改**: `hierarchical_memory_manager.py` 和 `me_alignment_engine.py`

```python
# 替换mock函数为真实Gemini调用
def llm_generate(prompt: str) -> str:
    import google.generativeai as genai
    
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-pro')
    
    response = model.generate_content(prompt)
    return response.text
```

### Phase 2: API集成 (Week 2)

#### 步骤2.1: 注册V2.0路由

**修改**: `src/server.ts`

```typescript
import memoryV2Routes from './routes/memoryV2.js';

// 添加路由
app.use('/api/memory/v2', memoryV2Routes);
```

#### 步骤2.2: 测试API端点

```bash
# 健康检查
curl http://localhost:3001/api/memory/v2/health

# L0存储
curl -X POST http://localhost:3001/api/memory/v2/test@example.com/l0/store \
  -H "Content-Type: application/json" \
  -d '{"content": "Test memory", "source": "api_test"}'

# L1聚类
curl -X POST http://localhost:3001/api/memory/v2/test@example.com/l1/cluster

# L2传记
curl http://localhost:3001/api/memory/v2/test@example.com/l2/biography

# Me-Alignment生成
curl -X POST http://localhost:3001/api/memory/v2/test@example.com/generate \
  -H "Content-Type: application/json" \
  -d '{"currentInput": "What do you like to do?"}'
```

#### 步骤2.3: 修复TypeScript导入错误

**问题**: `memoryV2Service.ts` line 10 - `db` not exported

**解决方案**:

```typescript
// 方案1: 使用Database类
import Database from 'better-sqlite3';
export class MemoryV2Service {
  private db: Database.Database;
  
  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'self_agent.db');
    this.db = new Database(this.dbPath);
  }
}

// 方案2: 创建单独的db连接
import { createDbConnection } from '../db/index.js';
const db = createDbConnection();
```

### Phase 3: 图灵测试验证 (Week 3-4)

#### 步骤3.1: 准备测试集

创建 `turing_test_samples.json`:

```json
[
  {
    "user_id": "mzpatrick0529@gmail.com",
    "context": "朋友问周末计划",
    "input": "周末有空吗？要不要出去玩？",
    "expected_traits": ["语言风格: 随意", "情感: 积极", "决策: 基于兴趣"]
  },
  {
    "user_id": "mzpatrick0529@gmail.com",
    "context": "工作讨论",
    "input": "这个项目deadline太紧了，怎么办？",
    "expected_traits": ["语言风格: 专业", "情感: 冷静", "思维: 分析型"]
  }
]
```

#### 步骤3.2: 运行测试

```python
import json
from me_alignment_engine import MeAlignmentEngine, GenerationContext

# 加载测试集
with open('turing_test_samples.json') as f:
    samples = json.load(f)

engine = MeAlignmentEngine('self_agent.db', llm_generate)

results = []
for sample in samples:
    context = GenerationContext(
        user_id=sample['user_id'],
        current_input=sample['input'],
        conversation_history=[],
        scene=sample['context']
    )
    
    result = engine.generate_response(context)
    
    # 评估
    passed = (
        result.alignment_score.total_score > 0.95 and
        result.alignment_score.linguistic_score > 0.95 and
        result.alignment_score.emotional_score > 0.92 and
        result.alignment_score.value_score > 0.95 and
        result.alignment_score.factual_score > 0.98
    )
    
    results.append({
        'input': sample['input'],
        'response': result.response,
        'alignment_score': result.alignment_score.total_score,
        'passed': passed
    })

pass_rate = sum(r['passed'] for r in results) / len(results)
print(f"Turing Test Pass Rate: {pass_rate * 100:.1f}%")
```

**目标**: Pass Rate > 95%

### Phase 4: RLHF优化 (Week 5-6)

#### 步骤4.1: 收集用户反馈

**前端集成**:

```typescript
// 在聊天界面添加评分组件
async function submitFeedback(
  response: string, 
  rating: number, 
  feedbackText?: string
) {
  await fetch(`/api/memory/v2/${userId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response,
      context: { currentInput, conversationHistory },
      rating,
      feedbackText
    })
  });
}
```

#### 步骤4.2: RLHF训练

```python
# 创建 rlhf_trainer.py
from transformers import AutoModelForCausalLM, Trainer
import torch

class RLHFTrainer:
    def __init__(self, db_path):
        self.db_path = db_path
        self.model = AutoModelForCausalLM.from_pretrained("gpt2")
    
    def collect_samples(self):
        """从me_alignment_samples收集训练数据"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT context_memories, conversation_history, 
                   current_input, generated_response, reward
            FROM me_alignment_samples
            WHERE reward IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1000
        """)
        
        samples = cursor.fetchall()
        conn.close()
        return samples
    
    def train(self):
        """PPO训练"""
        samples = self.collect_samples()
        # TODO: 实现PPO训练循环
        pass
```

---

## 前端UI集成

### 记忆可视化组件

创建 `src/components/MemoryVisualization.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { memoryV2Service } from '../services/memoryV2Service';

export function MemoryTimeline({ userId }: { userId: string }) {
  const [memories, setMemories] = useState([]);
  
  useEffect(() => {
    fetch(`/api/memory/v2/${userId}/l0/retrieve?limit=50`)
      .then(res => res.json())
      .then(data => setMemories(data.memories));
  }, [userId]);
  
  return (
    <div className="memory-timeline">
      {memories.map(mem => (
        <div key={mem.id} className="memory-card">
          <div className="timestamp">{mem.timestamp}</div>
          <div className="content">{mem.content}</div>
          <div className="metadata">
            <span className="sentiment">{mem.sentiment_score > 0 ? '😊' : '😐'}</span>
            <span className="source">{mem.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopicGraph({ userId }: { userId: string }) {
  const [clusters, setClusters] = useState([]);
  
  useEffect(() => {
    fetch(`/api/memory/v2/${userId}/l1/clusters`)
      .then(res => res.json())
      .then(data => setClusters(data.clusters));
  }, [userId]);
  
  return (
    <div className="topic-graph">
      {clusters.map(cluster => (
        <div key={cluster.id} className="topic-node">
          <h3>{cluster.clusterName}</h3>
          <div className="keywords">
            {cluster.keywords.map(kw => (
              <span key={kw.word} className="keyword">{kw.word}</span>
            ))}
          </div>
          <div className="stats">
            {cluster.memoryCount} memories
          </div>
        </div>
      ))}
    </div>
  );
}

export function BiographyCard({ userId }: { userId: string }) {
  const [biography, setBiography] = useState(null);
  
  useEffect(() => {
    fetch(`/api/memory/v2/${userId}/l2/biography`)
      .then(res => res.json())
      .then(data => setBiography(data.biography));
  }, [userId]);
  
  if (!biography) return <div>Loading biography...</div>;
  
  return (
    <div className="biography-card">
      <h2>Personal Biography</h2>
      
      <section>
        <h3>Identity</h3>
        <p>{biography.identitySummary}</p>
        <div className="tags">
          {biography.identityCore.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </section>
      
      <section>
        <h3>Core Values</h3>
        <ul>
          {biography.coreValues.map(v => (
            <li key={v.value}>{v.value} ({v.score.toFixed(2)})</li>
          ))}
        </ul>
      </section>
      
      <section>
        <h3>Life Narrative</h3>
        <p>{biography.narrativeFirstPerson}</p>
      </section>
      
      <div className="metadata">
        Version: {biography.version} | Quality: {biography.qualityScore.toFixed(2)}
      </div>
    </div>
  );
}
```

---

## 性能优化

### 1. 向量相似度搜索加速

```bash
# 安装sqlite-vss扩展
pip3 install sqlite-vss

# 或使用ChromaDB
pip3 install chromadb
```

**修改**: `hierarchical_memory_manager.py`

```python
import chromadb

class L0MemoryManager:
    def __init__(self, db_path):
        self.db_path = db_path
        self.chroma_client = chromadb.Client()
        self.collection = self.chroma_client.create_collection("memories")
    
    def retrieve_memories(self, user_id, query, limit=20):
        # 向量搜索
        query_embedding = self._generate_embedding(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            where={"user_id": user_id}
        )
        return results
```

### 2. 缓存策略

```python
from functools import lru_cache
import redis

# Redis缓存
redis_client = redis.Redis(host='localhost', port=6379, db=0)

@lru_cache(maxsize=100)
def get_cached_biography(user_id):
    cached = redis_client.get(f"bio:{user_id}")
    if cached:
        return json.loads(cached)
    
    bio = fetch_biography_from_db(user_id)
    redis_client.setex(f"bio:{user_id}", 3600, json.dumps(bio))
    return bio
```

### 3. 异步聚类

```typescript
// 后台任务队列
import Bull from 'bull';

const clusteringQueue = new Bull('clustering', {
  redis: { host: 'localhost', port: 6379 }
});

clusteringQueue.process(async (job) => {
  const { userId } = job.data;
  await memoryV2Service.runClustering(userId);
});

// 添加任务
clusteringQueue.add({ userId: 'user123' }, { delay: 60000 });
```

---

## 监控指标

### Grafana Dashboard配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'personality_v2'
    static_configs:
      - targets: ['localhost:3001']
```

**关键指标**:

1. **Alignment Score**
   - Linguistic: > 0.95
   - Emotional: > 0.92
   - Value: > 0.95
   - Factual: > 0.98

2. **Generation Performance**
   - Latency: < 2.0s (P95)
   - Throughput: > 10 req/s

3. **Memory Quality**
   - L1 Cluster Count: 10-50 per user
   - L2 Quality Score: > 0.8
   - L0 Memory Retention: 100%

---

## 故障排查

### 常见问题

#### 1. "No module named 'sentence_transformers'"

```bash
pip3 install sentence-transformers
```

#### 2. "HDBSCAN clustering failed"

原因: 记忆数量不足 (<30条)

```python
# 降低min_cluster_size
clusterer = hdbscan.HDBSCAN(
    min_cluster_size=5,  # 从10降到5
    min_samples=2        # 从3降到2
)
```

#### 3. "Biography quality_score < 0.5"

原因: 聚类质量低 or LLM生成失败

```python
# 检查聚类
clusters = l1_manager.get_clusters(user_id)
print(f"Cluster count: {len(clusters)}")

# 检查LLM响应
result = llm_generate("Test prompt")
print(f"LLM response: {result}")
```

#### 4. "Alignment score stuck at 0.5"

原因: L2传记不存在

```bash
# 重新生成传记
python3 src/ml/hierarchical_memory_manager.py \
  --db-path ./self_agent.db \
  --user-id USER_ID \
  --action biography
```

---

## 验收标准

### V2.0上线要求

- [x] 数据库表创建成功 (13 tables)
- [x] Python依赖安装完成
- [ ] LLM集成完成 (Gemini API)
- [ ] API端点全部通过测试 (15 endpoints)
- [ ] 至少1个用户完成L0→L1→L2管线
- [ ] Turing Test Pass Rate > 95%
- [ ] 前端UI: 至少3个可视化组件
- [ ] 监控指标配置完成

### 性能目标

| 指标 | V1.0 | V2.0 (目标) |
|-----|------|-------------|
| 图灵测试通过率 | 65-70% | **95%+** |
| 语言一致性 | 70% | **95%** |
| 情感准确性 | 65% | **92%** |
| 价值观匹配 | 60% | **95%** |
| 事实准确性 | 80% | **98%** |
| 响应延迟 (P95) | <1.0s | <2.0s |

---

## 下一步计划

### Week 7-8: 高级功能

1. **多模态记忆**
   - 图片记忆 (CLIP embeddings)
   - 语音记忆 (Whisper transcription)
   - 视频记忆 (frame sampling)

2. **联邦学习**
   - 设备端模型训练
   - 差分隐私保护
   - 模型聚合

3. **实时同步**
   - WebSocket推送
   - 增量更新
   - 冲突解决

---

## 参考资料

- [Second-Me GitHub](https://github.com/mindverse/Second-Me) - 14.4k stars
- [AI-Native Memory Paper](https://arxiv.org/pdf/2503.08102) - 理论基础
- [HDBSCAN Documentation](https://hdbscan.readthedocs.io/) - 聚类算法
- [Sentence-Transformers](https://www.sbert.net/) - 向量嵌入

---

**版本历史**:
- 2.0.0 (2025-01-XX): AI-Native Memory架构 (HMM + Me-Alignment)
- 1.0.0 (2025-01-XX): Feature-based架构 (65-70% pass rate)
