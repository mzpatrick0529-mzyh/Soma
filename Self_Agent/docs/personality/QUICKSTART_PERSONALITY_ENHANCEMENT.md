# 🚀 人格增强系统快速开始指南

## 📦 已创建的文件

### 1. 核心代码 (TypeScript)

| 文件 | 行数 | 功能 | 状态 |
|------|------|------|------|
| `src/services/personalityEngine.ts` | 450 | 增强型人格分析引擎 | ✅ 完成 |
| `src/services/mlBridge.ts` | 160 | Python ↔ TypeScript 通信桥 | ✅ 完成 |
| `src/services/proactiveAgent.ts` | 350 | 主动行为引擎 | ✅ 完成 |

### 2. 数据库 Schema

| 文件 | 行数 | 功能 | 状态 |
|------|------|------|------|
| `src/db/enhanced_persona_schema.sql` | 300+ | 8张新表 + 触发器 + 视图 | ✅ 完成 |

### 3. 文档

| 文件 | 字数 | 功能 | 状态 |
|------|------|------|------|
| `PERSONALITY_ENHANCEMENT_ARCHITECTURE.md` | 8000+ | 完整架构设计文档 | ✅ 完成 |

---

## 🛠️ 安装依赖

### TypeScript 依赖

```bash
cd Self_AI_Agent
npm install node-cron @types/node-cron
```

### Python 依赖 (如果尚未安装)

```bash
pip3 install spacy nltk textblob scikit-learn networkx sentence-transformers umap-learn

# 下载 spaCy 语言模型
python3 -m spacy download en_core_web_sm

# 下载 NLTK 数据
python3 -c "import nltk; nltk.download('vader_lexicon')"
```

---

## 📊 数据库迁移

### 方式 1: 直接执行 SQL

```bash
cd Self_AI_Agent
sqlite3 ./self_agent.db < src/db/enhanced_persona_schema.sql
```

### 方式 2: 在 TypeScript 中执行

在 `src/db/index.ts` 添加迁移函数:

```typescript
import fs from 'fs';
import path from 'path';

export function runEnhancedPersonaMigration() {
  const db = getDb();
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, 'enhanced_persona_schema.sql'),
    'utf-8'
  );
  
  db.exec(schemaSQL);
  console.log('✓ Enhanced persona schema migrated successfully');
}
```

然后在 `src/server.ts` 启动时调用:

```typescript
import { runEnhancedPersonaMigration } from './db/index.js';

// 在 app.listen() 之前
runEnhancedPersonaMigration();
```

---

## 🧪 快速测试

### 测试 1: ML Bridge 连通性

创建测试文件 `src/test_ml_bridge.ts`:

```typescript
import { checkPythonEnvironment, callPythonML } from './services/mlBridge.js';

async function testMLBridge() {
  // 1. 检查 Python 环境
  console.log('Checking Python environment...');
  const envStatus = await checkPythonEnvironment();
  console.log('Python environment:', envStatus);

  // 2. 测试简单调用
  console.log('\nTesting Python call...');
  const testData = { test: 'hello from TypeScript' };
  
  // 需要先创建简单的测试脚本
  const result = await callPythonML('test_echo', testData);
  console.log('Python result:', result);
}

testMLBridge().catch(console.error);
```

创建 Python 测试脚本 `src/ml/test_echo.py`:

```python
#!/usr/bin/env python3
import sys
import json

# 从命令行参数读取 JSON
args = json.loads(sys.argv[1])

# 简单回显
result = {
    'received': args,
    'message': 'Python bridge is working!',
    'status': 'success'
}

# 输出 JSON (必须输出到 stdout)
print(json.stringify(result))
```

运行测试:

```bash
npx tsx src/test_ml_bridge.ts
```

### 测试 2: 构建增强型人格档案

创建测试文件 `src/test_persona_engine.ts`:

```typescript
import { buildEnhancedPersonaProfile } from './services/personalityEngine.js';

async function testPersonaEngine() {
  const userId = 'test_user_123'; // 替换为真实用户ID
  
  console.log('Building enhanced persona profile...');
  const profile = await buildEnhancedPersonaProfile(userId, {
    includeBigFive: true,
    includeRelationshipGraph: true,
    includeTemporalAnalysis: true,
  });

  console.log('\n=== Enhanced Persona Profile ===');
  console.log('Quality Score:', profile.qualityScore);
  console.log('Big Five:', profile.bigFive);
  console.log('Linguistic Signature:', profile.linguisticSignature);
  console.log('Temporal Patterns:', profile.temporalPatterns);
  console.log('Cross-Platform Consistency:', profile.crossPlatformConsistency);
}

testPersonaEngine().catch(console.error);
```

### 测试 3: 主动 Agent 引擎

创建测试文件 `src/test_proactive_agent.ts`:

```typescript
import { createProactiveAgent } from './services/proactiveAgent.js';

async function testProactiveAgent() {
  const userId = 'test_user_123';
  const geminiApiKey = process.env.GOOGLE_API_KEY || '';

  console.log('Initializing proactive agent...');
  const agent = await createProactiveAgent(userId, geminiApiKey);

  // 监听主动消息事件
  agent.on('proactive_message', (event) => {
    console.log('\n🎉 Proactive Message Generated:');
    console.log('Type:', event.type);
    console.log('Target:', event.targetPerson);
    console.log('Message:', event.message);
  });

  // 手动触发测试事件
  console.log('\nTriggering test birthday event...');
  await agent.triggerEvent('birthday', {
    targetPerson: '张三',
    context: { date: '05-20' }
  });

  // 保持运行监听定时任务 (可选)
  console.log('\nAgent is running... Press Ctrl+C to stop');
}

testProactiveAgent().catch(console.error);
```

---

## 🔧 需要完成的 Python ML 模块

目前 TypeScript 层已经准备好调用以下 Python 脚本,但需要创建 CLI 包装器:

### 1. `src/ml/personality_extractor.py` CLI 包装

在文件末尾添加:

```python
if __name__ == '__main__':
    import sys
    import json
    
    # 解析命令行参数
    args = json.loads(sys.argv[1])
    user_id = args['user_id']
    method = args['method']
    conversations = args['conversations']
    
    # 初始化提取器
    extractor = PersonalityFeatureExtractor()
    
    if method == 'extract_big_five':
        features = extractor.extract_all_features(conversations, user_id)
        big_five = features['cognitive'].get('big_five', {})
        print(json.dumps(big_five))
    
    elif method == 'extract_linguistic_signature':
        linguistic = extractor.extract_linguistic_features(conversations)
        print(json.dumps(linguistic))
    
    else:
        print(json.dumps({'error': f'Unknown method: {method}'}))
        sys.exit(1)
```

### 2. 创建 `src/ml/temporal_analyzer.py`

```python
#!/usr/bin/env python3
"""
时序行为模式分析器
"""

import json
import sys
from typing import List, Dict, Any
from datetime import datetime
from collections import Counter, defaultdict

class TemporalPatternAnalyzer:
    def analyze(self, messages: List[Dict]) -> Dict[str, Any]:
        """主分析函数"""
        return {
            'dailyRoutine': self.extract_daily_routine(messages),
            'weeklyPatterns': self.extract_weekly_patterns(messages),
            'importantDates': self.extract_important_dates(messages),
            'activeHours': self.analyze_active_hours(messages),
            'cyclicPatterns': self.detect_cyclic_patterns(messages)
        }
    
    def extract_daily_routine(self, messages: List[Dict]) -> List[Dict]:
        # TODO: 实现
        return []
    
    def extract_weekly_patterns(self, messages: List[Dict]) -> Dict:
        # TODO: 实现
        return {}
    
    def extract_important_dates(self, messages: List[Dict]) -> List[Dict]:
        # 简单示例: 检测 "生日快乐" 关键词
        important_dates = []
        for msg in messages:
            content = msg.get('content', '')
            if '生日快乐' in content or 'happy birthday' in content.lower():
                timestamp = msg.get('timestamp')
                if timestamp:
                    date = datetime.fromisoformat(timestamp).strftime('%m-%d')
                    important_dates.append({
                        'date': date,
                        'type': 'birthday',
                        'description': '生日',
                        'confidence': 0.9
                    })
        return important_dates
    
    def analyze_active_hours(self, messages: List[Dict]) -> Dict:
        hours = {'morning': 0, 'afternoon': 0, 'evening': 0, 'night': 0}
        for msg in messages:
            timestamp = msg.get('timestamp')
            if timestamp:
                hour = datetime.fromisoformat(timestamp).hour
                if 6 <= hour < 12:
                    hours['morning'] += 1
                elif 12 <= hour < 18:
                    hours['afternoon'] += 1
                elif 18 <= hour < 24:
                    hours['evening'] += 1
                else:
                    hours['night'] += 1
        
        total = sum(hours.values())
        if total > 0:
            hours = {k: v / total for k, v in hours.items()}
        return hours
    
    def detect_cyclic_patterns(self, messages: List[Dict]) -> List[Dict]:
        # TODO: 使用 FFT 或 ARIMA 检测周期性
        return []

if __name__ == '__main__':
    args = json.loads(sys.argv[1])
    messages = args['messages']
    
    analyzer = TemporalPatternAnalyzer()
    result = analyzer.analyze(messages)
    
    print(json.dumps(result))
```

### 3. 创建 `src/ml/relationship_graph.py`

```python
#!/usr/bin/env python3
"""
关系图谱分析器
"""

import json
import sys
from typing import List, Dict
import networkx as nx

class RelationshipGraphBuilder:
    def build_graph(self, conversations: List[Dict]) -> Dict[str, Any]:
        """构建关系图谱"""
        G = nx.Graph()
        user_id = conversations[0].get('user_id', 'user')
        
        # 构建图
        for conv in conversations:
            sender = conv.get('sender', 'user')
            target = conv.get('target_person') or conv.get('receiver')
            
            if target:
                if G.has_edge(user_id, target):
                    G[user_id][target]['weight'] += 1
                else:
                    G.add_edge(user_id, target, weight=1, sentiment_sum=0)
        
        # 提取关系上下文人格变化
        contextual_shifts = []
        for neighbor in G.neighbors(user_id):
            weight = G[user_id][neighbor]['weight']
            contextual_shifts.append({
                'target_person': neighbor,
                'relationship_type': 'friend',  # TODO: 智能分类
                'persona_shift': {
                    'formality': 0.0,
                    'emotional_openness': 0.8,
                    'humor_level': 0.7,
                    'response_speed': 10,
                    'message_length': 50
                },
                'interaction_count': weight,
                'last_interaction': 0
            })
        
        return {'contextual_shifts': contextual_shifts}

if __name__ == '__main__':
    args = json.loads(sys.argv[1])
    conversations = args['conversations']
    user_id = args['user_id']
    
    builder = RelationshipGraphBuilder()
    result = builder.build_graph(conversations)
    
    print(json.dumps(result))
```

---

## ✅ 下一步行动清单

### Phase 1: 基础集成 (今天)

- [ ] 安装 npm 依赖 (`node-cron`)
- [ ] 执行数据库迁移 (运行 `enhanced_persona_schema.sql`)
- [ ] 创建 Python CLI 包装器 (上述3个文件)
- [ ] 运行 `test_ml_bridge.ts` 验证通信

### Phase 2: 功能验证 (明天)

- [ ] 运行 `test_persona_engine.ts` 构建增强档案
- [ ] 运行 `test_proactive_agent.ts` 测试主动消息生成
- [ ] 检查数据库中的 `enhanced_persona_profiles` 表数据
- [ ] 检查 `proactive_events` 表记录

### Phase 3: 生产集成 (2-3天)

- [ ] 在 `src/server.ts` 集成 `buildEnhancedPersonaProfile()`
- [ ] 为每个用户启动 `ProactiveAgentEngine`
- [ ] 创建 API 端点: `GET /api/persona/:userId` (获取增强档案)
- [ ] 创建 API 端点: `POST /api/proactive/trigger` (手动触发主动消息)
- [ ] 前端展示用户人格档案 (Big Five 雷达图)

### Phase 4: 优化 & 监控 (持续)

- [ ] 添加日志和性能监控
- [ ] 优化 Python 调用性能 (缓存、批处理)
- [ ] 用户反馈收集 (主动消息评分)
- [ ] A/B 测试不同的消息生成策略

---

## 📈 成功指标

**定量指标**:
- [ ] Big Five 提取成功率 > 95%
- [ ] 主动消息生成延迟 < 2秒
- [ ] 跨平台一致性分数 > 0.8
- [ ] 用户满意度 (主动消息) > 4/5

**定性指标**:
- [ ] 用户认为生成的消息"非常像我会说的话"
- [ ] 主动消息被认为"及时且贴心"
- [ ] 语言风格高度一致

---

## 🆘 故障排查

### 问题 1: Python 调用失败

**错误**: `Failed to spawn Python process`

**解决**:
```bash
# 检查 Python 是否安装
which python3

# 检查版本
python3 --version

# 如果使用 conda, 激活环境
conda activate your_env
```

### 问题 2: 数据库迁移失败

**错误**: `table already exists`

**解决**:
```bash
# 删除旧表 (谨慎!)
sqlite3 self_agent.db "DROP TABLE IF EXISTS enhanced_persona_profiles;"

# 重新运行迁移
sqlite3 self_agent.db < src/db/enhanced_persona_schema.sql
```

### 问题 3: node-cron 不工作

**错误**: 定时任务不触发

**解决**:
```typescript
// 检查 cron 表达式
const task = cron.schedule('*/1 * * * *', () => {
  console.log('Running every minute');
}, {
  scheduled: true,  // 确保设置为 true
  timezone: 'Asia/Shanghai'
});

// 手动启动
task.start();
```

---

## 📚 参考资料

- **架构设计**: `PERSONALITY_ENHANCEMENT_ARCHITECTURE.md`
- **数据库 Schema**: `src/db/enhanced_persona_schema.sql`
- **代码注释**: 每个文件顶部都有详细说明

**外部文档**:
- [node-cron](https://github.com/node-cron/node-cron)
- [NetworkX](https://networkx.org/documentation/stable/)
- [spaCy](https://spacy.io/api)

---

**文档版本**: v1.0  
**作者**: GitHub Copilot AI PM  
**最后更新**: 2025-01-XX
