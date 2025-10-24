# 🗄️ 数据库和大文件分析报告

**生成时间**: 2025-01-17  
**磁盘使用**: 99% 满 (10GB可用/228GB总容量)  
**项目总大小**: ~26GB

---

## 📊 核心发现

### 关键问题:
1. **self_agent.db 占用 4.7GB** - 这是最大的单一文件
2. **上传的ZIP文件 ~20GB** - 这些是临时备份
3. **已解压的导入数据 ~8GB** - 提取后的原始文件
4. **WeChat加密数据重复** - 同样的数据存在多个副本

---

## 🔍 详细分析

### 1. self_agent.db (4.7GB) - 主数据库

**位置**: `/Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent/self_agent.db`

#### 表结构:
```sql
users       - 用户账户 (5条记录)
documents   - 文档内容 (1,726条记录)
chunks      - 文本分块 (788,779条记录)
vectors     - 向量嵌入 (788,779条记录)
auth_users  - 认证用户 (0条记录)
```

#### 数据分布:
| 数据源 | 文档数 | 内容大小 | 说明 |
|--------|--------|---------|------|
| **wechat** | 632 | **736 MB** | ⚠️ **加密数据!未解密** |
| google | 916 | 54 MB | Google导入的数据 |
| chrome | 36 | 13 MB | Chrome历史 |
| search | 48 | 3 MB | 搜索历史 |
| location | 10 | 2 MB | 位置数据 |
| instagram | 61 | <1 MB | Instagram |
| youtube | 14 | <1 MB | YouTube |
| test-seed | 5 | <1 MB | 测试数据 |
| gmail | 4 | <1 MB | Gmail |

#### 为什么这么大?

**主要原因: 向量数据库**
```
788,779 个向量 × 1024 字节/向量 = 770 MB (向量数据)
+ 文档原始内容 (736 MB WeChat + 72 MB 其他)
+ 文本分块索引
+ SQLite 开销和索引
───────────────────────────────────────────────
≈ 4.7 GB 总大小
```

**问题1: WeChat数据是加密的!**
```sql
-- 示例: 最大的5个WeChat文档
doc_e7fe68p5ku71760674603591  41.5 MB  "RMFH̝=`~_4ߋr%N..." (乱码)
doc_itisevez0c1760674692017    18.8 MB  ")AdU!%^PLL_~49..." (乱码)
doc_5f8fl3v7f0q1760674406639    12.9 MB  "?S/j0?DfH=WDn..." (乱码)
```
这些是**加密的RMFH文件内容**,直接存入了数据库但未解密!

**问题2: 向量重复**
- 788,779个向量对应788,779个chunks
- 但很多可能是从加密数据生成的无意义向量
- 加密数据的向量对RAG没有价值

---

### 2. 上传文件 (~26GB)

**位置**: `/Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent/uploads/`

#### ZIP备份文件 (20GB):
```
files-1760644774454-364018136.zip    5.4 GB  ⚠️ 临时备份
files-1760725243938-865120551.zip    5.1 GB  ⚠️ 临时备份
files-1760644768257-863262391.zip    3.0 GB  ⚠️ 临时备份
files-1760725253144-275405175.zip    2.4 GB  ⚠️ 临时备份
files-1760684224576-391268455.zip    2.3 GB  ⚠️ 临时备份
```
**性质**: 用户上传的压缩包,已经解压,**可以删除**

#### 已解压数据 (8GB):
```
extracted_import_1760644792280_aj9yr92ogur/  4.9 GB  已导入,可删除
extracted_import_1760644792278_vaff08kljb/  3.0 GB  已导入,可删除
```
**性质**: 解压后的原始文件,已经导入数据库,**可以删除**

---

### 3. 其他数据库文件

```
self_agent.db-wal    47 MB   SQLite Write-Ahead Log (临时)
self_agent.db-shm    32 KB   SQLite Shared Memory (临时)
memories.db          0 B     空文件
```

**WAL和SHM文件**: SQLite事务日志,数据库关闭后会合并到主文件

---

## 🎯 数据分类

### ✅ 必须保留 - 核心代码 (~50MB)

```
src/                      前端源代码
Self_AI_Agent/src/        后端源代码
package.json              依赖配置
*.ts, *.tsx              TypeScript代码
*.md                     文档
配置文件                  .env, tsconfig.json等
```

### ⚠️ 需要清理 - self_agent.db (4.7GB)

**当前状态**: 包含大量加密的无用数据

**建议操作**:

#### 选项A: 删除重建 (推荐)
```bash
# 1. 备份数据库
cp self_agent.db self_agent.db.backup

# 2. 删除旧数据库
rm -f Self_AI_Agent/self_agent.db*

# 3. 重新初始化
cd Self_AI_Agent
npm run db:init  # 或你的初始化命令

# 4. 重新导入解密后的数据
# (等RMFH文件正确解析后)
```

**预期效果**: 从4.7GB降到 <100MB

#### 选项B: 清理加密数据
```sql
-- 删除WeChat的加密数据
DELETE FROM vectors WHERE chunk_id IN (
  SELECT c.id FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE d.source = 'wechat'
);

DELETE FROM chunks WHERE document_id IN (
  SELECT id FROM documents WHERE source = 'wechat'
);

DELETE FROM documents WHERE source = 'wechat';

-- 压缩数据库
VACUUM;
```

**预期效果**: 从4.7GB降到 ~800MB

### ❌ 可以删除 - 临时文件 (~28GB)

#### 立即可删除 (20GB):
```bash
# 删除ZIP备份
rm -f Self_AI_Agent/uploads/files-*.zip
```
**释放**: ~20GB

#### 已导入可删除 (8GB):
```bash
# 删除解压后的文件
rm -rf Self_AI_Agent/uploads/extracted_import_*
```
**释放**: ~8GB

#### 缓存文件 (~200MB):
```bash
# 删除npm缓存
rm -rf .npm-cache/
npm cache clean --force
```
**释放**: ~200MB

#### Git临时文件:
```bash
# 清理Git
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```
**释放**: 可能释放数百MB

---

## 📈 空间优化计划

### 立即执行 (释放 ~28GB):

```bash
cd /Users/patrick_ma/Soma/Soma_V0

# 1. 删除ZIP备份 (20GB)
echo "删除ZIP备份..."
rm -f Self_AI_Agent/uploads/files-*.zip

# 2. 删除已解压文件 (8GB)
echo "删除已导入的解压文件..."
rm -rf Self_AI_Agent/uploads/extracted_import_*

# 3. 清理npm缓存 (200MB)
echo "清理npm缓存..."
rm -rf .npm-cache/
npm cache clean --force

# 4. 清理Git (varies)
echo "清理Git历史..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 查看释放的空间
df -h /
```

**预期结果**: 磁盘使用从99%降到 ~87%

### 进阶优化 (释放 ~4GB):

```bash
# 选项1: 完全重建数据库
cd Self_AI_Agent
mv self_agent.db self_agent.db.old
npm run db:init

# 选项2: 只删除加密数据
sqlite3 self_agent.db << 'EOF'
DELETE FROM vectors WHERE chunk_id IN (
  SELECT c.id FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE d.source = 'wechat'
);
DELETE FROM chunks WHERE document_id IN (
  SELECT id FROM documents WHERE source = 'wechat'
);
DELETE FROM documents WHERE source = 'wechat';
VACUUM;
EOF
```

**预期结果**: self_agent.db从4.7GB降到 <1GB

---

## 🔧 推荐的数据管理策略

### 1. 上传文件处理
```
用户上传 → 解压 → 处理 → 导入数据库 → 删除原文件
         (ZIP)   (temp)   (process)  (DB)    (cleanup)
```

**自动清理脚本** (建议添加):
```typescript
// Self_AI_Agent/src/utils/cleanup.ts
export async function cleanupOldUploads() {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
  
  // 删除超过7天的ZIP文件
  const files = await fs.readdir(uploadsDir);
  for (const file of files) {
    if (file.endsWith('.zip')) {
      const stats = await fs.stat(path.join(uploadsDir, file));
      if (Date.now() - stats.mtimeMs > maxAge) {
        await fs.unlink(path.join(uploadsDir, file));
      }
    }
  }
  
  // 删除已导入的extracted_目录
  // ...
}
```

### 2. 数据库维护
```bash
# 定期压缩数据库
sqlite3 self_agent.db "VACUUM;"

# 重建索引
sqlite3 self_agent.db "REINDEX;"

# 分析查询优化
sqlite3 self_agent.db "ANALYZE;"
```

### 3. 向量存储优化
**当前**: 所有向量存在SQLite (不高效)

**建议**: 使用专门的向量数据库
```
选项1: Qdrant (推荐)
选项2: Milvus
选项3: Chroma
选项4: Pinecone (云服务)
```

**预期优化**:
- 查询速度提升10-100倍
- 磁盘占用减少30-50%
- 更好的向量搜索算法

---

## 📋 WeChat数据问题总结

### 当前状态:
1. ❌ **632个WeChat文档在数据库中但是加密的**
   - 总大小: 736 MB
   - 内容: RMFH加密数据(乱码)
   - 问题: 向量化的是加密内容,对RAG无用

2. ✅ **484个RMFH文件可以解密**
   - 位置: `uploads/extracted_import_*/`
   - 密钥: `687c38f284f0d9c778fb3e1b3492536b`
   - 状态: 已解密但是Protobuf格式

3. ⚠️ **数据重复存储**
   - 原始ZIP备份 (20GB)
   - 解压后文件 (8GB)
   - 数据库中的加密副本 (736MB)
   - 实际只需要一份!

### 正确的流程应该是:
```
1. 上传ZIP → 2. 解压RMFH → 3. 解密RMFH → 4. 解析Protobuf
                                        ↓
5. 提取文本 → 6. 清理原文件 → 7. 导入数据库 → 8. 向量化
```

**当前卡在**: 步骤4 (Protobuf解析)

---

## 🎯 立即行动清单

### 高优先级 (立即):
- [ ] **删除ZIP备份** (释放20GB)
  ```bash
  rm -f Self_AI_Agent/uploads/files-*.zip
  ```

- [ ] **删除已解压目录** (释放8GB)
  ```bash
  rm -rf Self_AI_Agent/uploads/extracted_import_*
  ```
  **注意**: 先确保数据已备份到其他地方!

- [ ] **清理npm缓存** (释放200MB)
  ```bash
  npm cache clean --force
  rm -rf .npm-cache/
  ```

### 中优先级 (本周):
- [ ] **清理数据库中的加密数据**
  ```sql
  DELETE FROM documents WHERE source = 'wechat';
  -- 及相关的chunks和vectors
  VACUUM;
  ```

- [ ] **解析RMFH Protobuf结构**
  - 分析Protobuf schema
  - 提取可读文本
  - 重新导入数据库

### 低优先级 (未来):
- [ ] 迁移到专用向量数据库
- [ ] 实现自动清理任务
- [ ] 优化存储架构

---

## 💡 关键建议

### 1. 数据不要重复存储
**错误做法**: ZIP → 解压 → 数据库 → 都保留
**正确做法**: ZIP → 解压 → 处理 → 数据库 → 删除ZIP和解压

### 2. 不要存储加密数据
**错误**: 把加密的RMFH内容直接存入数据库
**正确**: 先解密 → 解析 → 提取文本 → 再存储

### 3. 定期清理
设置cron任务或后台任务定期清理:
- 7天前的上传文件
- 已导入的临时数据
- 数据库VACUUM

### 4. 监控磁盘空间
```typescript
// 添加监控
if (diskUsage > 90%) {
  logger.warn('Disk space critical, triggering cleanup');
  await cleanupOldUploads();
}
```

---

## 📊 预期效果

### 清理前:
```
磁盘总容量: 228 GB
已使用:     218 GB (99%)
可用:       10 GB

项目大小:   ~26 GB
├─ uploads:       20 GB (ZIP + extracted)
├─ self_agent.db: 4.7 GB
├─ node_modules:  0.8 GB
└─ 源代码:        0.05 GB
```

### 清理后:
```
磁盘总容量: 228 GB
已使用:     190 GB (83%)
可用:       38 GB ✅

项目大小:   ~1 GB
├─ uploads:       0 GB (已清理)
├─ self_agent.db: 0.8 GB (清理WeChat)
├─ node_modules:  0.8 GB
└─ 源代码:        0.05 GB
```

**释放空间**: ~28 GB  
**磁盘健康度**: 从危险(99%)恢复到健康(83%)

---

**最后更新**: 2025-01-17  
**建议操作**: 立即删除ZIP和extracted目录,释放28GB空间
