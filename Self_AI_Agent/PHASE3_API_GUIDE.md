# Phase 3: Context-Aware API Integration Guide

## Quick Start

### 1. 启动服务

```bash
cd Self_AI_Agent
npm install
npm run dev
```

服务将在 `http://localhost:8787` 启动。

---

## API端点详解

### 1. 上下文感知对话生成

**端点**: `POST /api/self-agent/context-aware/chat`

**功能**: 生成上下文感知的个性化响应

**请求示例**:
```bash
curl -X POST http://localhost:8787/api/self-agent/context-aware/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default",
    "conversationId": "conv_20241024_001",
    "message": "今天天气真不错,要不要出去走走?",
    "targetPerson": "小明",
    "metadata": {
      "timestamp": 1698160000000,
      "location": "家",
      "participants": ["小明", "我"]
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "response": "好啊!难得这么好的天气😊 去哪里呢?公园还是海边?",
    "confidence": 0.87,
    "styleConsistency": true,
    "factConsistency": true,
    "context": {
      "temporal": {
        "timeOfDay": "afternoon",
        "dayOfWeek": "weekend",
        "season": "autumn"
      },
      "social": {
        "targetPerson": "小明",
        "relationshipType": "close_friend",
        "intimacyLevel": 0.85,
        "socialSetting": "personal"
      },
      "emotional": {
        "detectedMood": "happy",
        "moodIntensity": 0.7,
        "conversationTone": "light"
      }
    },
    "persona": {
      "coreIdentity": { ... },
      "linguisticSignature": { ... },
      "contextualAdjustments": [
        "使用更轻松自然的语言",
        "可以表达更多情感",
        "匹配对方的兴奋程度"
      ]
    },
    "memory": {
      "shortTerm": [ ... ],
      "currentTopic": {
        "topic": "entertainment",
        "keyPoints": [ ... ]
      },
      "longTerm": {
        "totalConversations": 23,
        "averageIntimacy": 0.85,
        "commonTopics": ["life", "entertainment", "tech"]
      }
    }
  }
}
```

---

### 2. 获取对话上下文

**端点**: `GET /api/self-agent/context-aware/context/:conversationId`

**功能**: 查询当前对话的上下文信息

**请求示例**:
```bash
curl "http://localhost:8787/api/self-agent/context-aware/context/conv_20241024_001?userId=default"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "context": {
      "temporal": { ... },
      "spatial": { ... },
      "social": { ... },
      "emotional": { ... }
    },
    "memory": {
      "shortTerm": [ ... ],
      "currentTopic": { ... }
    }
  }
}
```

---

### 3. 获取记忆快照

**端点**: `GET /api/self-agent/context-aware/memory/:conversationId`

**功能**: 查询对话的三层记忆快照

**请求示例**:
```bash
curl "http://localhost:8787/api/self-agent/context-aware/memory/conv_20241024_001?userId=default&targetPerson=小明"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "shortTerm": [
      {
        "role": "user",
        "content": "今天天气真不错",
        "timestamp": 1698160000000
      },
      {
        "role": "assistant",
        "content": "是啊,难得的好天气😊",
        "timestamp": 1698160005000
      }
    ],
    "currentTopic": {
      "topic": "life",
      "keyPoints": ["天气", "出去走走"],
      "turnCount": 5
    },
    "longTerm": {
      "targetPerson": "小明",
      "totalConversations": 23,
      "averageIntimacy": 0.85,
      "commonTopics": ["life", "entertainment"],
      "communicationStyle": "casual"
    }
  }
}
```

---

### 4. 风格一致性检查

**端点**: `POST /api/self-agent/context-aware/style-check`

**功能**: 检查文本风格是否符合目标特征

**请求示例**:
```bash
curl -X POST http://localhost:8787/api/self-agent/context-aware/style-check \
  -H "Content-Type: application/json" \
  -d '{
    "text": "嘿!周末一起打球吧😄",
    "targetStyle": {
      "emojiCount": 2,
      "punctuationDensity": 0.05,
      "averageLength": 50,
      "slangCount": 1,
      "formalityScore": 0.3
    }
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "isConsistent": false,
    "deviations": [
      "emoji数量偏差: 当前1, 目标2"
    ],
    "calibratedText": "嘿!周末一起打球吧😄 👍"
  }
}
```

---

### 5. 事实一致性检查

**端点**: `POST /api/self-agent/context-aware/fact-check`

**功能**: 验证生成文本与用户记忆的一致性

**请求示例**:
```bash
curl -X POST http://localhost:8787/api/self-agent/context-aware/fact-check \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default",
    "text": "我上周去过那家新开的咖啡厅,环境很不错",
    "context": "关于咖啡厅的讨论"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "isConsistent": true,
    "conflicts": [],
    "confidence": 0.92
  }
}
```

---

### 6. 清理对话记忆

**端点**: `DELETE /api/self-agent/context-aware/memory/:conversationId`

**功能**: 删除指定时间之前的对话记忆

**请求示例**:
```bash
curl -X DELETE "http://localhost:8787/api/self-agent/context-aware/memory/conv_old?userId=default&olderThanDays=90"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "deletedCount": 127,
    "daysKept": 90
  }
}
```

---

### 7. 系统统计信息

**端点**: `GET /api/self-agent/context-aware/stats`

**功能**: 获取上下文感知系统的统计数据

**请求示例**:
```bash
curl "http://localhost:8787/api/self-agent/context-aware/stats?userId=default"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": "default",
    "totalConversations": 45,
    "totalTurns": 523,
    "totalRelationships": 12,
    "averageTurnsPerConversation": "11.62"
  }
}
```

---

## 集成示例

### JavaScript/TypeScript集成

```typescript
// contextAwareClient.ts
import fetch from 'node-fetch';

export class ContextAwareClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8787') {
    this.baseUrl = baseUrl;
  }

  async chat(params: {
    userId: string;
    conversationId: string;
    message: string;
    targetPerson?: string;
    metadata?: any;
  }) {
    const response = await fetch(`${this.baseUrl}/api/self-agent/context-aware/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  }

  async getMemory(conversationId: string, userId: string = 'default') {
    const response = await fetch(
      `${this.baseUrl}/api/self-agent/context-aware/memory/${conversationId}?userId=${userId}`
    );
    return response.json();
  }

  async checkStyle(text: string, targetStyle: any) {
    const response = await fetch(`${this.baseUrl}/api/self-agent/context-aware/style-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetStyle }),
    });
    return response.json();
  }
}

// 使用示例
const client = new ContextAwareClient();

const result = await client.chat({
  userId: 'default',
  conversationId: 'conv_test',
  message: '今天心情不错!',
  targetPerson: '小明',
});

console.log('AI Response:', result.data.response);
console.log('Confidence:', result.data.confidence);
console.log('Context:', result.data.context);
```

### Python集成

```python
# context_aware_client.py
import requests
from typing import Optional, Dict, Any

class ContextAwareClient:
    def __init__(self, base_url: str = "http://localhost:8787"):
        self.base_url = base_url
    
    def chat(
        self,
        user_id: str,
        conversation_id: str,
        message: str,
        target_person: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        response = requests.post(
            f"{self.base_url}/api/self-agent/context-aware/chat",
            json={
                "userId": user_id,
                "conversationId": conversation_id,
                "message": message,
                "targetPerson": target_person,
                "metadata": metadata
            }
        )
        return response.json()
    
    def get_memory(self, conversation_id: str, user_id: str = "default") -> Dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/api/self-agent/context-aware/memory/{conversation_id}",
            params={"userId": user_id}
        )
        return response.json()
    
    def get_stats(self, user_id: str = "default") -> Dict[str, Any]:
        response = requests.get(
            f"{self.base_url}/api/self-agent/context-aware/stats",
            params={"userId": user_id}
        )
        return response.json()

# 使用示例
client = ContextAwareClient()

result = client.chat(
    user_id="default",
    conversation_id="conv_test",
    message="今天天气不错!",
    target_person="小明"
)

print(f"AI Response: {result['data']['response']}")
print(f"Confidence: {result['data']['confidence']}")
```

---

## 性能优化建议

### 1. 缓存策略
- PersonaSelector内置1小时缓存
- 建议在应用层缓存频繁访问的记忆快照
- 使用Redis缓存热点对话上下文

### 2. 批量处理
- 支持批量检测历史上下文 (`contextDetector.detectHistoricalContexts()`)
- 定期批量清理旧记忆 (建议每天1次)

### 3. 数据库优化
- conversation_memory表已建立索引
- 建议定期VACUUM优化SQLite性能
- 考虑分表存储超过100万条记忆

### 4. 并发控制
- ContextAwareInferenceEngine支持多实例
- 数据库使用WAL模式支持并发读写
- 建议使用连接池管理数据库连接

---

## 错误处理

所有API端点统一错误格式:

```json
{
  "error": "错误描述",
  "details": "详细错误信息"
}
```

常见HTTP状态码:
- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

---

## 监控指标

建议监控以下指标:

1. **响应时间**
   - P50: < 500ms
   - P95: < 2000ms
   - P99: < 5000ms

2. **置信度**
   - 平均置信度 > 0.80
   - 低置信度比例 < 10%

3. **风格一致性**
   - 一致性比例 > 90%

4. **事实准确性**
   - 准确性比例 > 85%

---

## 下一步

1. **集成LLM**: 在`contextAwareInferenceEngine.ts`的`generateResponse()`方法中集成Gemini 2.0 Flash API
2. **增加测试**: 编写单元测试和集成测试
3. **性能测试**: 压测API响应时间和并发能力
4. **监控部署**: 部署Prometheus/Grafana监控面板

---

*Last Updated: 2024-10-24*
