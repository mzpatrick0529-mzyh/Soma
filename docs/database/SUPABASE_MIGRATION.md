# Supabase 方案（Option A）迁移指南

本指南帮助你将 SQLite 数据迁移到 Supabase Postgres（带 pgvector），并为后续在运行时切换到 Postgres 做准备。

## 1. 创建 Supabase 项目并启用扩展

- 在 Supabase 控制台创建项目，获取数据库连接串（`SUPABASE_DB_URL`）。
- 在 SQL Editor 执行：
  - `CREATE EXTENSION IF NOT EXISTS vector;`
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- 运行仓库中的初始化脚本：
  - `Self_AI_Agent/src/db/supabase_schema.sql`

## 2. 配置环境变量

复制 `.env.example` 为 `.env`（在 `Self_AI_Agent` 目录内），设置：

- `SUPABASE_DB_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME`
- `EMBEDDING_DIM=1536`（按你的模型维度调整）
- `SELF_AGENT_DB=./self_agent.db`（当前本地 SQLite 路径）

## 3. 迁移数据（SQLite → Supabase）

脚本位置：`Self_AI_Agent/scripts/migrate_sqlite_to_supabase.ts`

示例运行（在 `Self_AI_Agent` 目录）：

```bash
# 可选：先安装依赖
npm i

# 迁移（也可通过环境变量提供连接串）
npm run migrate:supabase -- \
  --sqlite ./self_agent.db \
  --pg "$SUPABASE_DB_URL" \
  --dim 1536 \
  --batch 1000
```

脚本会迁移：
- `users`、`documents`、`chunks`（含元数据）
- `vectors` → 写入 `chunks.embedding`（pgvector）以及兼容的 `vectors(vec)` 表
- `personality_training_samples`

所有写入采用 upsert，支持幂等重试；向量维度不一致的条目会被跳过并在控制台提示。

## 4. RLS（行级安全）与会话变量

- Schema 脚本已启用 RLS 并配置策略：要求 `row.user_id = current_setting('app.user_id')`。
- 服务端连接数据库后，需先执行：`SET app.user_id = '<当前用户ID>'`。
- 示例 Node 工具：`Self_AI_Agent/src/db/pgClient.ts`，提供 `withUserClient(userId, fn)` 封装。

## 5. 运行时切换建议（逐步）

- 第一步：仅将 RAG 的向量检索改成查询 Supabase（先读 Postgres 的 `chunks.embedding`）。
- 第二步：导入器/切片/向量化直接写 Postgres（避免双写/不一致）。
- 第三步：训练样本、训练任务也切换到 Postgres 读写。
- 注意：切换期间保留 SQLite 只读作为回退；完成后可清理本地 DB。

## 6. 向量检索 SQL 示例（pgvector）

```sql
-- 参数：$1::vector 为输入向量，$2 为 user_id
SELECT id, doc_id, text, 1 - (embedding <#> $1::vector) AS similarity
FROM chunks
WHERE user_id = $2
ORDER BY embedding <-> $1::vector
LIMIT 10;
```

## 7. 安全与备份

- 强制 TLS（Supabase 默认启用）。
- 应用层加密（Envelope）：对高敏感文本做字段级加密，存 JSONB metadata 标注 key 版本。
- 备份与恢复：Supabase 提供备份；也可定期导出数据快照。

## 8. 常见问题

- 维度不一致：确认你的嵌入模型维度并统一，必要时重算向量再迁移。
- 性能与成本：早期使用免费额度，后期按量升级；若向量规模很大，再考虑迁移到 Qdrant Cloud（方案 B）。
