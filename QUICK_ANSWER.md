# 📦 大文件快速解答

## 🎯 核心问题回答

### Q1: self_agent.db为什么这么大(4.7GB)?

**答案**: 因为存储了**78万个向量**和**加密的WeChat数据**

```
788,779个向量 × 1KB/个 = 770 MB  (向量嵌入)
736 MB                        (加密的WeChat内容 - 乱码!)
72 MB                         (其他数据: Google, Chrome等)
+ SQLite索引和开销
────────────────────────────────────────
= 4.7 GB
```

**问题**: WeChat的632个文档是**未解密的加密数据**,存入数据库后生成的向量对RAG无用!

---

### Q2: 哪些是临时数据?

#### ❌ 可以立即删除 (释放28GB):

| 文件 | 大小 | 说明 | 删除命令 |
|------|------|------|----------|
| **ZIP备份** | 20GB | 上传后的原始压缩包,已解压 | `rm uploads/files-*.zip` |
| **解压目录** | 8GB | 已导入数据库的原始文件 | `rm -rf uploads/extracted_*` |
| **npm缓存** | 200MB | 可重新下载 | `npm cache clean --force` |

**总释放**: ~28GB → 磁盘从99%降到83%

---

### Q3: 哪些必须保留?

#### ✅ 核心代码 (50MB):
```
src/                      前端源代码 ✅
Self_AI_Agent/src/        后端源代码 ✅
package.json              依赖配置 ✅
*.ts, *.tsx              TypeScript文件 ✅
*.md                     文档 ✅
.env                     配置(不含密钥的) ✅
```

#### ⚠️ 需要清理的数据库 (4.7GB):
```
self_agent.db            主数据库 ⚠️ 需清理WeChat加密数据
├─ 632个WeChat文档      736MB 加密内容(无用)
├─ 78万个向量           770MB 大部分来自加密数据(无用)
└─ 其他数据             72MB  Google/Chrome等(有用)
```

**建议**: 删除数据库中的WeChat加密数据,可从4.7GB降到800MB

---

### Q4: 哪些是临时的数据库文件?

```
self_agent.db          4.7GB  主数据库 (永久)
self_agent.db-wal      47MB   写入日志 (临时,数据库关闭后自动合并)
self_agent.db-shm      32KB   共享内存 (临时,数据库关闭后自动删除)
memories.db            0B     空文件 (可删除)
```

**WAL和SHM**: SQLite事务文件,正常存在,不需要手动删除

---

## 🚀 立即行动方案

### 方案1: 快速清理 (1分钟,释放28GB)

```bash
cd /Users/patrick_ma/Soma/Soma_V0
./clean-large-files.sh
```

**删除内容**:
- ✓ ZIP备份 (20GB)
- ✓ 解压目录 (8GB)  
- ✓ npm缓存 (200MB)
- ✓ Git临时文件

**保留内容**:
- ✓ 所有源代码
- ✓ self_agent.db (待进一步清理)
- ✓ node_modules

### 方案2: 深度清理 (5分钟,再释放4GB)

清理数据库中的加密数据:

```bash
# 备份数据库
cp Self_AI_Agent/self_agent.db Self_AI_Agent/self_agent.db.backup

# 删除WeChat加密数据
sqlite3 Self_AI_Agent/self_agent.db << 'EOF'
-- 删除向量
DELETE FROM vectors WHERE chunk_id IN (
  SELECT c.id FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE d.source = 'wechat'
);

-- 删除分块
DELETE FROM chunks WHERE document_id IN (
  SELECT id FROM documents WHERE source = 'wechat'
);

-- 删除文档
DELETE FROM documents WHERE source = 'wechat';

-- 压缩数据库
VACUUM;
EOF

# 查看新大小
du -sh Self_AI_Agent/self_agent.db
```

**效果**: 4.7GB → 800MB

---

## 📊 数据流程问题

### 当前的错误流程:
```
上传ZIP → 解压 → 直接导入加密内容到数据库 ❌
  ↓         ↓              ↓
保留20GB   保留8GB    加密数据736MB + 无用向量770MB
```
**问题**: 数据重复3次,且都是加密的无用数据!

### 正确的流程应该是:
```
上传ZIP → 解压 → 解密RMFH → 解析Protobuf → 提取文本 → 导入DB
  ↓         ↓         ↓           ↓            ↓          ↓
删除     删除      删除        删除         纯文本    有用数据
```
**结果**: 只保留最终的可用数据,不重复存储

---

## 💡 核心发现

### 1. 数据重复问题
同样的WeChat数据存了3份:
- ZIP备份: 5GB × 4个 = 20GB
- 解压文件: 3GB + 5GB = 8GB  
- 数据库: 736MB (加密)
**实际只需要**: 最终解密后的文本(<100MB)

### 2. 加密数据在数据库
**问题**: 632个WeChat文档是加密的RMFH内容
```sql
SELECT title, SUBSTR(content, 1, 50) FROM documents WHERE source='wechat' LIMIT 3;

3619697487108340620_m  |  RMFH̝=`~_4ߋr%N˕74;...  (乱码)
7631717626641136876_m  |  )AdU!%^PLL_~49H;[ԏ...  (乱码)
5132897795145766865_m  |  ?S/j0?DfH=WDn鷦ɲZ...  (乱码)
```
这些向量化后对RAG完全无用!

### 3. 向量存储效率低
**当前**: 78万向量存在SQLite = 4.7GB
**建议**: 使用专用向量数据库(Qdrant/Milvus) = <1GB + 快100倍

---

## 🎯 优先级建议

### 🔴 立即 (今天):
```bash
# 1. 清理大文件 (释放28GB)
./clean-large-files.sh

# 2. 确认磁盘空间恢复
df -h /
```

### 🟡 重要 (本周):
```bash
# 3. 清理数据库加密数据 (释放4GB)
# 见上面的SQL命令

# 4. 解决RMFH Protobuf解析
# 正确提取WeChat文本数据
```

### 🟢 优化 (未来):
- 迁移到专用向量数据库
- 实现自动清理任务
- 优化数据导入流程

---

## 📝 检查清单

执行清理前确认:

- [ ] 检查数据库是否有其他重要数据
  ```bash
  sqlite3 Self_AI_Agent/self_agent.db "SELECT source, COUNT(*) FROM documents GROUP BY source;"
  ```

- [ ] 备份重要数据(如果有)
  ```bash
  cp Self_AI_Agent/self_agent.db ~/Backups/self_agent.db.backup
  ```

- [ ] 确认ZIP已解压
  ```bash
  ls Self_AI_Agent/uploads/extracted_*
  ```

- [ ] 运行清理脚本
  ```bash
  ./clean-large-files.sh
  ```

- [ ] 验证结果
  ```bash
  df -h /
  du -sh Self_AI_Agent/uploads/
  ```

---

**总结**: 
- **问题根源**: WeChat加密数据未正确处理就导入了数据库
- **核心解决**: 删除28GB临时文件 + 清理4GB加密数据库内容
- **预期效果**: 磁盘从99%降到<85%,项目从26GB降到<2GB
- **下一步**: 正确解析RMFH文件,重新导入可用数据

**查看完整分析**: `DATABASE_ANALYSIS_REPORT.md`
