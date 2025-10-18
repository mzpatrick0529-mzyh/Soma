# Self_AI_Agent

A modular backend submodule to build a "self agent" trained from user memories (text/image/video/audio/link) to simulate user's language, thinking, experiences, voice, video, posting and chatting behaviors in Soma.

## Architecture

- src/types: Zod schemas and types (MemoryItem, PersonaProfile, TrainingJob)
- src/pipeline
  - dataset.ts: Converts raw memories and optional persona profile into a training dataset string
  - chunk.ts: Split long documents into overlapping chunks
  - embeddings.ts: Minimal local embeddings (hash-based, placeholder)
  - rag.ts: Semantic retrieval and context builder
  - train.ts: Manages training jobs and status, calls provider.trainPersona
- src/providers
  - provider.ts: Provider interface
  - openai.ts: Minimal stub provider (can be replaced with real OpenAI/others)
- src/server.ts: Express server exposing REST endpoints
- src/db: SQLite (better-sqlite3) persistence for users, documents, chunks, vectors
- src/importers/google.ts: Import Google Takeout data (Gmail/Drive/Calendar/etc)

## Endpoints

- POST /api/self-agent/train
  - body: { userId, memories: MemoryItem[], profile?: PersonaProfile }
  - returns: TrainingJob
- GET /api/self-agent/status/:jobId
  - returns: TrainingJob status
- POST /api/self-agent/generate/chat
  - body: { userId, history: {role, content}[], hint? }
  - returns: { text }
- POST /api/self-agent/generate/post
  - body: { userId, context?, mediaHint? }
  - returns: { text }

### New endpoints
- POST /api/self-agent/import/google
  - body: { userId: string, dir: string } (dir = Google Takeout 解压目录)
  - returns: { ok: true, stats: { files, docs, chunks } }
- GET /api/self-agent/search?userId=xxx&q=keyword
- GET /api/self-agent/retrieve?userId=xxx&q=question&topK=6

## Run locally

1. Copy .env.example to .env and fill in keys if needed
2. Install deps

```bash
npm --prefix Self_AI_Agent install
```

3. Start server (port 8787 by default)

```bash
npm run dev:self
```

Vite dev server proxies /api/self-agent/* to http://localhost:8787.

## Import your Google data (Takeout)

1. 从 https://takeout.google.com 导出数据并解压到本地目录，例如 /Users/me/Takeout
2. 调用导入接口（示例curl）：

```bash
curl -X POST http://localhost:8787/api/self-agent/import/google \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user_001",
    "dir": "/Users/me/Takeout"
  }'
```

响应将返回导入统计：文件数、文档数、分片数。导入过程会：
- 解析 .json/.html/.txt/.mbox
- 抽取纯文本 -> 分片 -> 生成本地向量 -> 入库(SQLite)

## Try RAG-augmented generation

Chat：
```bash
curl -X POST http://localhost:8787/api/self-agent/generate/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user_001",
    "history": [
      {"role":"user","content":"请用我的风格总结我最近的活动"}
    ]
  }'
```

Post：
```bash
curl -X POST http://localhost:8787/api/self-agent/generate/post \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user_001",
    "context": "发布一条日常动态"
  }'
```

## Notes
- 当前嵌入为本地占位实现，用于打通端到端流程；可替换为 OpenAI/OSS 向量模型
- 数据库存于 `self_agent.db`（或设置环境变量 SELF_AGENT_DB）
- 如需清空数据，删除该文件或使用 `:memory:` 模式

## Next steps
- Integrate real OpenAI fine-tune/assistants or other OSS models
- Add embeddings and retrieval from memories
- Add voice/video generation hooks
- Persist models and job states
