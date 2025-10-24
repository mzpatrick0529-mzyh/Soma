# ⚠️ Supabase 部署 - 下一步操作指南

## 当前状态
✅ Supabase 项目已创建  
✅ 代码和脚本已准备就绪  
⏳ 需要完成配置和初始化

---

## 第1步：获取数据库密码

你提供的 `DATABASE_URL` 中有 `[YOUR_PASSWORD]` 占位符，需要替换为实际密码。

### 如何获取密码？

**方式1：使用项目创建时的密码**
- 在创建 Supabase 项目时，你设置了一个数据库密码
- 如果记得这个密码，直接使用即可

**方式2：在 Supabase Dashboard 重置密码**
1. 访问：https://supabase.com/dashboard/project/jhgmatufxamudhjkkwsp/settings/database
2. 找到 "Database Password" 部分
3. 点击 "Reset Database Password"（会生成新密码）
4. **立即复制并保存** 这个密码（只显示一次）

**方式3：使用 Connection String 页面**
1. 访问：https://supabase.com/dashboard/project/jhgmatufxamudhjkkwsp/settings/database
2. 在 "Connection String" 标签
3. 选择 "URI" 格式
4. 复制完整的连接串（密码已包含在内）

---

## 第2步：更新 .env 文件

在 `Self_AI_Agent/.env` 文件中添加以下配置：

\`\`\`bash
# ===================================
# Supabase 配置
# ===================================

# Supabase URL
SUPABASE_URL=https://jhgmatufxamudhjkkwsp.supabase.co

# Supabase 匿名密钥（用于客户端）
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZ21hdHVmeGFtdWRoamtrd3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODAxMjQsImV4cCI6MjA3NjY1NjEyNH0.vBViB03z2Yi2N58kDO6k6-SIc3s-H0xv4RuGIk1w90E

# Supabase 服务密钥（用于服务端，权限更高）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZ21hdHVmeGFtdWRoamtrd3NwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA4MDEyNCwiZXhwIjoyMDc2NjU2MTI0fQ.Ne6r2MKZPsmgr6E-75OlMJ0i2JuswD-y8ZjJNMIlvbA

# ⚠️ 数据库连接串（需要替换密码）
# 格式：postgresql://postgres:<你的密码>@db.jhgmatufxamudhjkkwsp.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD_HERE@db.jhgmatufxamudhjkkwsp.supabase.co:5432/postgres

# 向量维度（保持1536，除非你使用其他模型）
EMBEDDING_DIM=1536

# 本地 SQLite 路径（用于迁移）
SELF_AGENT_DB=./self_agent.db
\`\`\`

**重要提示：**
- 将 `YOUR_ACTUAL_PASSWORD_HERE` 替换为你的真实密码
- 密码中如果有特殊字符（如 `@#$%` 等），需要进行 URL 编码

---

## 第3步：初始化 Supabase Schema

### 3.1 访问 SQL Editor
1. 打开：https://supabase.com/dashboard/project/jhgmatufxamudhjkkwsp/sql/new
2. 或在你的项目中点击左侧菜单 "SQL Editor"

### 3.2 执行初始化脚本
1. 清空编辑器中的内容
2. 打开本地文件：`Self_AI_Agent/src/db/supabase_schema.sql`
3. 复制全部内容（约180行）
4. 粘贴到 Supabase SQL Editor
5. 点击右下角 "Run" 按钮（或按 Ctrl/Cmd + Enter）

**预期结果：**
- ✅ 显示 "Success. No rows returned"
- ✅ 创建了以下扩展：vector, pgcrypto
- ✅ 创建了以下表：users, auth_users, documents, chunks, vectors, personality_training_samples, training_jobs, user_models
- ✅ 启用了 RLS（Row Level Security）

### 3.3 验证表是否创建成功
在 SQL Editor 中运行：
\`\`\`sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
\`\`\`

应该看到至少这些表：
- auth_users
- chunks
- documents
- personality_training_samples
- training_jobs
- user_models
- users
- vectors

---

## 第4步：执行数据迁移

### 4.1 确认本地 SQLite 数据库存在
\`\`\`bash
cd /Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent
ls -lh self_agent.db
\`\`\`

### 4.2 运行迁移脚本
\`\`\`bash
npm run migrate:supabase
\`\`\`

**迁移过程：**
- 会读取本地 SQLite 的所有数据
- 分批（每批1000条）写入 Supabase
- 向量会转换为 pgvector 格式
- 所有操作都是幂等的（可安全重试）

**预期输出：**
\`\`\`
Migrating from SQLite=./self_agent.db to PG=postgresql://..., dim=1536, batch=1000
Users: X
Inserted users: X
Documents: Y
Upserted documents: Y/Y
Chunks: Z
Upserted chunks: Z/Z
Vectors: Z
Migrated vectors: Z/Z
Training samples: W
Upserted training_samples: W/W
✅ Migration completed.
\`\`\`

---

## 第5步：验证迁移结果

### 5.1 检查数据行数
在 Supabase SQL Editor 运行：
\`\`\`sql
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'chunks', COUNT(*) FROM chunks
UNION ALL
SELECT 'vectors', COUNT(*) FROM vectors
UNION ALL
SELECT 'training_samples', COUNT(*) FROM personality_training_samples
ORDER BY table_name;
\`\`\`

### 5.2 对比本地 SQLite
\`\`\`bash
sqlite3 self_agent.db "SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'documents', COUNT(*) FROM documents UNION ALL SELECT 'chunks', COUNT(*) FROM chunks UNION ALL SELECT 'vectors', COUNT(*) FROM vectors;"
\`\`\`

两者的行数应该一致（允许少量差异，如向量维度不匹配的会被跳过）。

---

## 第6步：测试连接

### 6.1 测试 Postgres 连接
创建测试脚本 `test_pg_connection.ts`：
\`\`\`typescript
import { getPgPool } from './src/db/pgClient.js';

async function test() {
  const pool = getPgPool();
  const res = await pool.query('SELECT COUNT(*) as count FROM documents');
  console.log('✅ Postgres 连接成功！');
  console.log('文档数量:', res.rows[0].count);
  await pool.end();
}

test().catch(console.error);
\`\`\`

运行：
\`\`\`bash
npx tsx test_pg_connection.ts
\`\`\`

---

## 常见问题

### Q: 密码包含特殊字符怎么办？
A: 使用 URL 编码，例如：
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### Q: 迁移脚本报错 "connection refused"
A: 检查：
1. 密码是否正确
2. 网络是否能访问 Supabase（可能需要 VPN）
3. 连接串格式是否正确

### Q: 迁移后发现数据少了
A: 检查迁移日志：
- 向量维度不一致的会被跳过
- 外键约束错误的会跳过
- 重跑迁移（幂等，安全）

---

## 下一步（迁移完成后）

1. **修改代码切换到 Postgres**
   - RAG 查询改用 pgClient
   - 导入器写入改为 Postgres
   - 训练样本读取改为 Postgres

2. **灰度测试**
   - 先在开发环境测试
   - 验证功能正常后再部署生产

3. **监控与优化**
   - 观察 Supabase Dashboard 指标
   - 定期 ANALYZE 表以优化查询

---

**准备好了吗？告诉我你完成了哪一步，我会继续帮你！**
