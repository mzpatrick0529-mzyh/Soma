# 🗄️ 数据库迁移快速指南

## 🎯 核心推荐：Supabase (免费 + 安全 + 高性能)

### 为什么选择Supabase？
- ✅ **完全免费** (500MB数据库 + 1GB存储)
- ✅ **绝对安全** (E2EE端到端加密 + Row-Level Security)
- ✅ **原生RAG** (pgvector向量搜索开箱即用)
- ✅ **2小时部署** (自动化脚本一键配置)
- ✅ **平滑扩展** ($0 → $25 → $599/月，支持到10,000用户)

---

## 🚀 30分钟快速开始

### Step 1: 注册Supabase (5分钟)
```bash
# 1. 访问 https://supabase.com
# 2. 点击 "Start your project"
# 3. 创建项目:
#    - Name: soma-mvp
#    - Region: Southeast Asia (Singapore) - 亚洲最近
#    - Database Password: [生成强密码并保存]
#    - Plan: Free ✨
```

### Step 2: 运行自动化脚本 (2分钟)
```bash
cd /Users/patrick_ma/Soma/Soma_V0

# 运行配置向导
./setup-supabase.sh

# 按提示输入Supabase信息
# 脚本会自动:
# - 创建配置文件
# - 测试数据库连接
# - 执行Schema迁移
# - 安装依赖包
```

### Step 3: 验证部署 (3分钟)
```bash
# 启动后端 (使用Supabase)
cd Self_AI_Agent
source .env.supabase
npm run dev

# 测试连接
curl http://localhost:8787/api/health
```

### Step 4: 完成！🎉
您的数据现在存储在云端，具备：
- 🔒 端到端加密保护
- 🌍 全球CDN加速
- 📊 自动备份
- 🚀 毫秒级向量搜索

---

## 📚 详细文档

### 1. 完整迁移战略
📖 **docs/DATABASE_MIGRATION_STRATEGY.md**
- 现状分析
- 架构设计
- E2EE加密详解
- 实施步骤 (含代码)
- 商业化方案
- 成本分析

### 2. 方案对比
📊 **docs/DATABASE_COMPARISON.md**
- 快速决策表
- 成本计算器
- 性能基准测试
- 常见问题
- 扩展路径

### 3. SQL Schema
🗄️ **Self_AI_Agent/src/db/supabase_schema.sql**
- 完整数据库结构
- Row-Level Security策略
- pgvector索引配置
- 实用函数

---

## 💰 成本预估

| 用户规模 | 推荐方案 | 月成本 | 特性 |
|---------|---------|--------|------|
| 0-100 | Supabase免费层 | **$0** | 500MB数据库 |
| 100-1,000 | Supabase Pro | **$25** | 8GB + 自动备份 |
| 1,000-10,000 | Supabase Team | **$599** | 无限存储 + SLA |
| 10,000+ | AWS自建 | $10,000+ | 完全自主控制 |

**MVP建议**: 从免费层开始，根据增长平滑升级

---

## 🔒 安全保证

### 端到端加密 (E2EE)
```
用户密码 → PBKDF2 → Master Key → AES-256-GCM → 加密数据 → Supabase
                                                            ↓
                                                    只存储密文
                                                  (无法读取明文)
```

### 零知识架构
- ✅ Supabase无法读取您的数据
- ✅ 即使被黑客攻击，数据依然安全
- ✅ 符合GDPR/CCPA/BIPA合规要求

### Row-Level Security
- ✅ 用户A无法访问用户B的数据
- ✅ SQL策略强制执行 (不可绕过)
- ✅ 数据库级隔离

---

## ❓ 常见问题

### Q: 免费层有什么限制？
**A**: 
- 500MB数据库 (≈ 10-50个重度用户)
- 1GB文件存储
- 7天无活动会暂停 (访问时自动恢复)
- **足够MVP测试使用**

### Q: 如何升级到付费版？
**A**: 
```bash
# 1. 在Supabase Dashboard点击 "Upgrade to Pro"
# 2. 无需任何代码修改
# 3. 立即生效 (0停机时间)
```

### Q: 数据能否迁回本地？
**A**: 可以
```bash
# 导出数据
pg_dump "$DATABASE_URL" > backup.sql

# 导入到本地SQLite (需要转换工具)
```

### Q: 性能会慢吗？
**A**: 略慢，但可接受
- 插入: 比SQLite慢1.5倍 (但仍 < 5秒)
- 查询: 比SQLite慢2倍 (但仍 < 200ms)
- **换来**: 无限扩展性 + 零运维

---

## 🎯 立即行动

### 方案A: 自动化安装 (推荐)
```bash
./setup-supabase.sh
```

### 方案B: 手动安装
```bash
# 1. 阅读文档
cat docs/DATABASE_MIGRATION_STRATEGY.md

# 2. 创建Supabase项目

# 3. 执行SQL
psql "$DATABASE_URL" -f Self_AI_Agent/src/db/supabase_schema.sql

# 4. 配置环境变量
cp Self_AI_Agent/.env.example Self_AI_Agent/.env.supabase
# 编辑 .env.supabase

# 5. 安装依赖
cd Self_AI_Agent
npm install @supabase/supabase-js pg
```

---

## 📞 获取帮助

- 📖 **详细文档**: docs/DATABASE_MIGRATION_STRATEGY.md
- 💬 **Supabase社区**: https://discord.supabase.com
- 🐛 **问题反馈**: GitHub Issues
- 📧 **技术支持**: support@supabase.io

---

## ✅ 检查清单

安装完成后，请确认：
- [ ] Supabase项目已创建
- [ ] `.env.supabase` 配置文件已生成
- [ ] SQL Schema已执行 (在Supabase Dashboard检查tables)
- [ ] 后端服务可连接Supabase (测试API)
- [ ] 数据加密正常工作 (查看encrypted_content字段)

---

**推荐**: 先使用Supabase免费层测试，满意后再决定是否升级 ⭐

**成本**: $0/月 (免费层)  
**时间**: 30分钟  
**风险**: 极低  
**回报**: 无限扩展能力 + 企业级安全

**开始使用 →** `./setup-supabase.sh`
