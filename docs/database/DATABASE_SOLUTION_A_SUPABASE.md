# 方案A：Supabase 一体化数据库解决方案

## 概述

将 Soma 的用户数据、训练数据等运营数据迁移到 Supabase（Postgres + pgvector + Storage），实现：
- 🔐 安全加密（传输层 TLS + 存储加密 + 可选应用层加密）
- 🚀 顺畅读取与调用（用于 Self Agent 训练和 RAG）
- 💰 成本友好（免费起步，按需扩展）
- 🛡️ 行级安全（RLS）多租户隔离

---

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Supabase 平台                         │
├─────────────────────────────────────────────────────────┤
│  Postgres (关系数据)                                     │
│    ├── users, auth_users                                │
│    ├── documents (source, type, content, metadata)     │
│    ├── chunks (text, embedding vector(1536))           │
│    ├── personality_training_samples                     │
│    └── training_jobs, user_models                      │
├─────────────────────────────────────────────────────────┤
│  pgvector (向量检索)                                     │
│    └── chunks.embedding + ivfflat 索引                  │
├─────────────────────────────────────────────────────────┤
│  Storage (对象存储)                                      │
│    └── 媒体文件、训练模型权重、附件                       │
├─────────────────────────────────────────────────────────┤
│  RLS (行级安全)                                          │
│    └── app.user_id 会话变量 + 策略隔离                   │
└─────────────────────────────────────────────────────────┘
```

---

## 核心特性

### 1. 数据模型

**表结构：**
- `users` - 租户/用户基础表
- `auth_users` - 应用级认证（email, password_hash, username等）
- `documents` - 原始文档（wechat/instagram/google等来源）
- `chunks` - 切片文本 + embedding vector(1536)
- `vectors` - 兼容层（可选，保持与 SQLite 接口一致性）
- `personality_training_samples` - 人格训练样本（含质量分、上下文、情感）
- `training_jobs` - 训练任务追踪
- `user_models` - 用户专属模型元数据

**向量字段：**
- `chunks.embedding` - pgvector 类型，支持 L2/内积/余弦距离
- 索引：ivfflat（列表数=100，适合中等规模；大规模可调整）

### 2. 安全机制

**传输加密：**
- 强制 TLS（Supabase 默认）

**存储加密：**
- 磁盘加密（Supabase 托管默认）

**应用层加密（可选）：**
- 信封加密（Envelope Encryption）
  - 每用户/每租户生成 DEK（数据加密密钥）
  - 用 KEK（密钥加密密钥，来自环境变量或 KMS）加密 DEK
  - 高敏感字段（如私聊内容）用 DEK 加密后存 JSONB metadata
  - 支持密钥轮换（版本化 KEK）

**行级安全（RLS）：**
- 所有多租户表启用 RLS
- 策略：`user_id::text = current_setting('app.user_id', true)`
- 连接时设置：`SET app.user_id = '<当前用户ID>'`
- Node 封装：`withUserClient(userId, async (client) => { ... })`

### 3. 向量检索（RAG）

**查询示例（L2 距离 Top-K）：**
```sql
SELECT id, doc_id, text, 1 - (embedding <#> $1::vector) AS similarity
FROM chunks
WHERE user_id = $2
ORDER BY embedding <-> $1::vector
LIMIT 10;
```

**索引类型：**
- `ivfflat` - 适合中大规模（需先 ANALYZE）
- `hnsw` - pgvector 0.6+ 支持，更快但内存占用高

---

## 部署步骤

### 前置准备

1. **创建 Supabase 项目**
   - 访问 [Supabase Dashboard](https://app.supabase.com/)
   - 创建新项目，记录数据库连接串

2. **启用扩展**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

3. **初始化 Schema**
   - 在 Supabase SQL Editor 运行：
     ```
     Self_AI_Agent/src/db/supabase_schema.sql
     ```

### 环境配置

复制 `.env.example` 为 `.env`（在 `Self_AI_Agent` 目录）：

```bash
cp Self_AI_Agent/.env.example Self_AI_Agent/.env
```

编辑 `.env`：
```env
SUPABASE_DB_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
EMBEDDING_DIM=1536
SELF_AGENT_DB=./self_agent.db
```

### 数据迁移

运行迁移脚本（在 `Self_AI_Agent` 目录）：

```bash
cd Self_AI_Agent

# 安装依赖（如未安装）
npm install

# 执行迁移
npm run migrate:supabase -- \
  --sqlite ./self_agent.db \
  --pg "$SUPABASE_DB_URL" \
  --dim 1536 \
  --batch 1000
```

**迁移内容：**
- ✅ users（用户基础表）
- ✅ documents（文档，含 source/type/content/metadata）
- ✅ chunks（切片文本）
- ✅ vectors → chunks.embedding（pgvector）+ vectors 兼容表
- ✅ personality_training_samples（训练样本）

**幂等性：**
- 所有写入采用 `ON CONFLICT DO UPDATE` 或 `DO NOTHING`
- 可安全重试

**校验：**
```bash
# 检查迁移后的行数
psql "$SUPABASE_DB_URL" -c "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'documents', COUNT(*) FROM documents UNION ALL SELECT 'chunks', COUNT(*) FROM chunks UNION ALL SELECT 'vectors', COUNT(*) FROM vectors UNION ALL SELECT 'training_samples', COUNT(*) FROM personality_training_samples;"
```

---

## 代码集成

### 1. 连接与 RLS

**使用 pgClient 封装：**
```typescript
import { withUserClient } from './src/db/pgClient.js';

// 查询时自动设置 app.user_id
const chunks = await withUserClient(userId, async (client) => {
  const res = await client.query(
    'SELECT * FROM chunks WHERE user_id = $1 LIMIT 10',
    [userId]
  );
  return res.rows;
});
```

**手动设置（若不用封装）：**
```typescript
import { getPgPool } from './src/db/pgClient.js';

const pool = getPgPool();
const client = await pool.connect();
try {
  await client.query('SET app.user_id = $1', [userId]);
  // 后续查询自动受 RLS 保护
  const res = await client.query('SELECT * FROM documents');
  return res.rows;
} finally {
  client.release();
}
```

### 2. 向量检索（替换 SQLite）

**原 SQLite 代码（better-sqlite3）：**
```typescript
const vectors = db.prepare('SELECT chunk_id, vec FROM vectors WHERE user_id = ?').all(userId);
// 手动计算距离...
```

**新 Postgres 代码（pg + pgvector）：**
```typescript
import { withUserClient } from './src/db/pgClient.js';

const inputVec = [0.1, 0.2, ...]; // 1536维
const vecLiteral = `[${inputVec.join(',')}]`;

const results = await withUserClient(userId, async (client) => {
  const res = await client.query(
    `SELECT id, doc_id, text, 1 - (embedding <#> $1::vector) AS similarity
     FROM chunks
     WHERE user_id = $2
     ORDER BY embedding <-> $1::vector
     LIMIT $3`,
    [vecLiteral, userId, 10]
  );
  return res.rows;
});
```

### 3. 导入器写入（示例：Instagram）

**新增/更新文档：**
```typescript
await withUserClient(userId, async (client) => {
  // Insert document
  await client.query(
    `INSERT INTO documents(id, user_id, source, type, content, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content`,
    [docId, userId, 'instagram', 'conversation', content, JSON.stringify(meta)]
  );

  // Insert chunks with embeddings
  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${docId}-chunk-${i}`;
    const embedding = await computeEmbedding(chunks[i]);
    const vecLit = `[${embedding.join(',')}]`;
    
    await client.query(
      `INSERT INTO chunks(id, doc_id, user_id, idx, text, embedding, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::vector, NOW())
       ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text, embedding=EXCLUDED.embedding`,
      [chunkId, docId, userId, i, chunks[i], vecLit]
    );
  }
});
```

---

## 运行时切换策略（灰度）

### 阶段 1：双写验证（可选）
- 保留 SQLite 写入
- 同时写 Supabase
- 读取仍从 SQLite
- 目的：验证数据一致性

### 阶段 2：读切换
- RAG 向量检索改为查 Supabase
- 训练样本读取改为查 Supabase
- SQLite 降为只读备份

### 阶段 3：完全切换
- 所有写入指向 Supabase
- 停用 SQLite（或保留为冷备份）

**环境变量控制：**
```env
USE_POSTGRES=true  # 启用 Postgres 读写
FALLBACK_SQLITE=false  # 禁用 SQLite 回退
```

---

## 成本与扩展

### 免费额度（Supabase Free Tier）
- **数据库：** 500MB 存储
- **带宽：** 5GB/月
- **Storage：** 1GB
- **适用场景：** MVP、早期测试、小规模用户

### 付费升级（Pro Tier，$25/月起）
- **数据库：** 8GB 存储（可扩展至 TB 级）
- **带宽：** 50GB/月
- **Storage：** 100GB
- **额外功能：** 每日备份、PITR、自定义域名

### 扩展路径
- **向量规模 < 100万：** Supabase pgvector 足够
- **向量规模 > 100万：** 考虑迁移向量到 Qdrant Cloud（方案B），Postgres 保留关系数据

---

## 安全最佳实践

### 1. 连接安全
- ✅ 强制 TLS（Supabase 默认）
- ✅ IP 白名单（可选，Supabase 项目设置）
- ✅ 数据库角色权限最小化（应用用 `authenticated` 角色，管理员用 `postgres`）

### 2. 应用层加密（高敏感数据）

**Envelope Encryption 示例：**
```typescript
import crypto from 'crypto';

// 主密钥（从环境变量或 KMS 获取）
const KEK = Buffer.from(process.env.APP_ENCRYPTION_KEY!, 'base64');

// 生成/获取用户 DEK
function getUserDEK(userId: string): Buffer {
  // 实际场景：从数据库读取加密后的 DEK，用 KEK 解密
  // 这里简化示例
  return crypto.randomBytes(32);
}

// 加密字段
function encryptField(plaintext: string, userId: string): { ciphertext: string; keyVersion: string } {
  const dek = getUserDEK(userId);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  
  return {
    ciphertext: JSON.stringify({ iv: iv.toString('base64'), data: encrypted, authTag }),
    keyVersion: 'v1'
  };
}

// 存储时：
const { ciphertext, keyVersion } = encryptField(sensitiveContent, userId);
await client.query(
  'INSERT INTO documents(..., metadata) VALUES (..., $1)',
  [JSON.stringify({ encrypted: ciphertext, keyVersion })]
);
```

### 3. RLS 策略测试

**验证隔离：**
```sql
-- 设置用户 A
SET app.user_id = 'user-a';
SELECT COUNT(*) FROM documents; -- 应只返回 user-a 的文档

-- 切换到用户 B
SET app.user_id = 'user-b';
SELECT COUNT(*) FROM documents; -- 应只返回 user-b 的文档

-- 尝试越权访问（应失败或返回空）
SELECT * FROM documents WHERE user_id = 'user-a'; -- RLS 阻止
```

---

## 备份与恢复

### 自动备份（Supabase）
- **频率：** 每日（Pro 及以上）
- **保留：** 7 天（可配置）
- **PITR：** 时间点恢复（Pro+）

### 手动备份
```bash
# 导出整个数据库
pg_dump "$SUPABASE_DB_URL" > backup_$(date +%Y%m%d).sql

# 仅导出特定表
pg_dump "$SUPABASE_DB_URL" -t documents -t chunks > partial_backup.sql
```

### 恢复
```bash
# 从备份恢复（需先清空或创建新库）
psql "$SUPABASE_DB_URL" < backup_20251023.sql
```

---

## 监控与调优

### 1. 查询性能

**EXPLAIN ANALYZE：**
```sql
EXPLAIN ANALYZE
SELECT id, text FROM chunks
WHERE user_id = 'user-123'
ORDER BY embedding <-> '[0.1,0.2,...]'::vector
LIMIT 10;
```

**优化建议：**
- 确保 `chunks.embedding` 有 ivfflat/hnsw 索引
- 定期 `ANALYZE chunks;` 更新统计信息
- 调整 ivfflat `lists` 参数（默认 100，大规模可设 1000+）

### 2. 连接池

**当前配置（pgClient.ts）：**
```typescript
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
```

**生产环境调优：**
```typescript
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,              // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. Supabase 仪表盘指标
- **Database Usage：** 存储、连接数、查询延迟
- **API Requests：** QPS、错误率
- **Storage：** 对象数量、带宽

---

## 常见问题 (FAQ)

### Q1: 向量维度不一致怎么办？
**A:** 
- 确认你的 embedding 模型维度（如 OpenAI text-embedding-3-large 是 3072，-small 是 1536）
- 修改 `supabase_schema.sql` 中的 `vector(1536)` 为实际维度
- 重新运行 schema 和迁移

### Q2: 迁移后数据量对不上？
**A:**
- 检查迁移脚本日志，查看是否有跳过的记录（如向量维度不匹配）
- 手动校验：`SELECT COUNT(*) FROM documents;` 对比 SQLite 和 Postgres
- 重跑迁移（幂等，安全）

### Q3: RLS 导致查询返回空？
**A:**
- 确认连接时已设置 `SET app.user_id = '<正确的user_id>'`
- 检查策略是否正确：`SELECT * FROM pg_policies WHERE tablename = 'documents';`
- 临时禁用 RLS 测试：`ALTER TABLE documents DISABLE ROW LEVEL SECURITY;`（仅测试环境）

### Q4: 如何从方案A迁移到方案B（Qdrant）？
**A:**
- 保留 Supabase Postgres（关系数据）
- 将 `chunks.embedding` 导出到 Qdrant（批量写入）
- 修改 RAG 查询逻辑：向量检索调 Qdrant API，回表查 Postgres
- 详见 `docs/DATABASE_MIGRATION_STRATEGY.md`

### Q5: 免费额度用完后怎么办？
**A:**
- **升级 Pro Tier：** $25/月，8GB 存储 + 50GB 带宽
- **优化数据：** 清理旧文档、压缩 metadata、定期归档
- **分表：** 按时间分区（如 documents_2025_10）
- **迁移部分数据：** 冷数据导出到 S3/R2

---

## 技术栈清单

| 组件 | 技术 | 用途 |
|------|------|------|
| 数据库 | Postgres 15+ | 关系数据、事务 |
| 向量扩展 | pgvector | 向量存储与检索 |
| 托管平台 | Supabase | 一体化 BaaS |
| Node 驱动 | pg | Postgres 客户端 |
| 安全 | RLS + TLS | 多租户隔离 + 传输加密 |
| 迁移工具 | better-sqlite3 + pg | SQLite → Postgres ETL |
| 加密（可选）| crypto (Node) | Envelope Encryption |

---

## 下一步行动

- [ ] 创建 Supabase 项目并获取连接串
- [ ] 运行 `supabase_schema.sql` 初始化表结构
- [ ] 配置 `.env` 文件
- [ ] 执行 `npm run migrate:supabase` 迁移数据
- [ ] 验证迁移后的数据完整性（行数、抽样检查）
- [ ] 修改代码：RAG 查询切换到 Postgres
- [ ] 灰度测试：内网或小流量验证
- [ ] 监控指标：延迟、错误率、RLS 隔离
- [ ] 清理旧 SQLite 文件（保留备份）

---

## 相关文档

- [Supabase 迁移指南](./SUPABASE_MIGRATION.md)
- [数据库对比分析](./DATABASE_COMPARISON.md)
- [方案 B（Neon + Qdrant）](./DATABASE_SOLUTION_B.md)
- [方案 C（自托管）](./DATABASE_SOLUTION_C.md)

---

**版本：** 1.0  
**更新时间：** 2025-10-23  
**维护者：** Soma Team
