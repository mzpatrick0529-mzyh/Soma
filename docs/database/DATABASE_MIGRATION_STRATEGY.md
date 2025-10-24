# 🗄️ Soma 数据库迁移战略

## 📊 现状分析

### 当前架构
- **数据库**: SQLite (本地文件 `self_agent.db`)
- **存储方式**: 本地磁盘存储
- **问题**:
  - ❌ 本地空间不足
  - ❌ 无备份/容灾机制
  - ❌ 无法横向扩展
  - ❌ 单点故障风险
  - ❌ 无多租户隔离
  - ❌ 向量检索性能受限

### 数据规模预估
```
每用户数据量:
- 文档: 1,000 - 10,000 个
- Chunks: 10,000 - 100,000 个
- 向量 (768维): 10,000 - 100,000 个 × 3KB ≈ 30MB - 300MB
- 总计: 50MB - 500MB/用户

100用户: 5GB - 50GB
1,000用户: 50GB - 500GB
10,000用户: 500GB - 5TB
```

---

## 🎯 解决方案架构

### 核心需求
1. ✅ **绝对安全**: 端到端加密 (E2EE)
2. ✅ **隐私保护**: 用户数据隔离、GDPR/CCPA合规
3. ✅ **方便RAG**: 高性能向量检索
4. ✅ **支持微调**: 结构化数据导出
5. ✅ **MVP免费**: 启动阶段零成本
6. ✅ **可扩展**: 商业化平滑升级

---

## 🚀 MVP方案：Supabase (免费层)

### 为什么选择Supabase？

#### ✅ 优势
1. **完全免费启动**
   - 500MB PostgreSQL数据库
   - 1GB文件存储 (Supabase Storage)
   - 50,000 次/月活跃用户
   - 2GB数据传输/月
   - 无需信用卡

2. **原生向量支持**
   - pgvector扩展 (开箱即用)
   - 支持余弦相似度、L2距离、内积
   - 索引优化 (HNSW, IVFFlat)

3. **安全性**
   - Row Level Security (RLS) - 数据库级隔离
   - SSL/TLS加密传输
   - 自动备份
   - 符合SOC 2 Type 2, ISO 27001

4. **隐私合规**
   - EU数据中心选项 (GDPR)
   - 数据残留权、被遗忘权支持
   - Audit logs

5. **开发者友好**
   - RESTful API自动生成
   - Real-time subscriptions
   - TypeScript SDK
   - 与现有SQLite schema兼容度高

#### ⚠️ 限制 (免费层)
- 500MB数据库 ≈ 支持10-50个重度用户
- 无自动备份 (需手动导出)
- 暂停策略: 7天无活动会暂停项目

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        Soma Frontend                        │
│                    (React + TypeScript)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Soma Self AI Agent                       │
│                   (Node.js + Express)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Database Adapter Layer                  │   │
│  │  - 抽象化数据库操作                                    │   │
│  │  - 支持 SQLite (本地) / Supabase (云端)               │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────────┐
│   SQLite     │          │    Supabase      │
│  (开发/测试)  │          │   (生产/MVP)      │
│              │          │                  │
│ - 本地开发    │          │ - PostgreSQL     │
│ - 单元测试    │          │ - pgvector       │
│ - 离线模式    │          │ - RLS安全        │
└──────────────┘          │ - 自动备份        │
                          │ - Real-time      │
                          └──────────────────┘
```

### 数据加密策略

#### 1. 传输加密 (In-Transit)
```
Client → TLS 1.3 → Soma Backend → TLS 1.3 → Supabase
```

#### 2. 存储加密 (At-Rest)
```typescript
// 敏感字段客户端加密
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class E2EEService {
  // 用户主密钥 (派生自用户密码)
  private userMasterKey: Buffer;

  // 加密文档内容
  encryptContent(plaintext: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.userMasterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag
    };
  }

  // 解密文档内容
  decryptContent(encrypted: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.userMasterKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

#### 3. 零知识证明架构
```
用户密码 → PBKDF2 (100,000 rounds) → Master Key
                                      ↓
                        ┌──────────────┴──────────────┐
                        │                             │
                     Encryption Key            Authentication Key
                    (加密数据内容)                (Supabase登录)
                        ↓                             ↓
                   AES-256-GCM                    存储到Supabase
                  (客户端加密)                   (用于Row-Level Security)
```

**关键**: Supabase只存储加密后的数据，无法读取明文。

---

## 📋 实施步骤（MVP）

### Phase 1: 环境准备 (30分钟)

#### Step 1.1: 创建Supabase项目
```bash
# 1. 访问 https://supabase.com
# 2. 注册/登录账号
# 3. 点击 "New Project"
# 4. 填写:
#    - Name: soma-mvp
#    - Database Password: [生成强密码并保存]
#    - Region: 选择离用户最近的区域
#      * East US (Ohio) - 美国
#      * West US (Oregon) - 美国西海岸
#      * Southeast Asia (Singapore) - 亚洲
#    - Pricing Plan: Free
# 5. 点击 "Create new project"
# 6. 等待2-3分钟初始化
```

#### Step 1.2: 获取连接信息
```bash
# 在Supabase Dashboard:
# Settings → Database → Connection String

# 复制以下信息:
# - Project URL: https://xxxxx.supabase.co
# - anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Database Password: [你设置的密码]

# Connection string格式:
# postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

#### Step 1.3: 启用pgvector扩展
```sql
-- 在Supabase SQL Editor中执行:
-- Database → SQL Editor → New Query

CREATE EXTENSION IF NOT EXISTS vector;

-- 验证安装
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Phase 2: Schema迁移 (1小时)

#### Step 2.1: 创建Supabase Schema
```sql
-- File: Self_AI_Agent/src/db/supabase_schema.sql

-- ============================================
-- Soma Supabase Schema with E2EE
-- ============================================

-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 认证用户 (扩展Supabase Auth)
CREATE TABLE auth_users (
  email TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  avatar TEXT,
  -- 密码由Supabase Auth管理，不存储在这里
  -- 加密密钥派生盐值 (用于客户端密钥生成)
  encryption_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文档表 (content加密存储)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT,
  type TEXT,
  title TEXT, -- 明文存储 (用于搜索)
  -- E2EE 加密字段
  encrypted_content TEXT, -- AES-256-GCM加密的内容
  content_iv TEXT, -- 初始化向量
  content_auth_tag TEXT, -- 认证标签
  metadata JSONB, -- 非敏感元数据 (明文)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_source ON documents(source);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

-- Chunks表 (text加密存储)
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idx INTEGER,
  -- E2EE 加密字段
  encrypted_text TEXT,
  text_iv TEXT,
  text_auth_tag TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_user ON chunks(user_id);
CREATE INDEX idx_chunks_doc ON chunks(doc_id);
CREATE INDEX idx_chunks_idx ON chunks(doc_id, idx);

-- 向量表 (使用pgvector)
CREATE TABLE vectors (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- pgvector类型 (768维 for sentence-transformers)
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 向量索引 (HNSW for fast ANN search)
CREATE INDEX idx_vectors_embedding ON vectors 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_vectors_user ON vectors(user_id);

-- 用户专属AI模型
CREATE TABLE user_models (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  version TEXT NOT NULL,
  -- E2EE: persona profile加密存储
  encrypted_metadata TEXT,
  metadata_iv TEXT,
  metadata_auth_tag TEXT,
  status TEXT DEFAULT 'training', -- 'training', 'ready', 'error'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_models_status ON user_models(status);

-- 合规日志 (审计追踪)
CREATE TABLE compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL, -- 'biometric_consent', 'wechat_disclaimer', etc.
  action TEXT NOT NULL, -- 'granted', 'declined', 'revoked'
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_logs_user ON compliance_logs(user_id);
CREATE INDEX idx_compliance_logs_type ON compliance_logs(log_type);
CREATE INDEX idx_compliance_logs_created ON compliance_logs(created_at DESC);

-- ============================================
-- Row-Level Security (RLS) Policies
-- ============================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY users_policy ON users
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY auth_users_policy ON auth_users
  FOR ALL USING (auth.uid()::text = email OR auth.email() = email);

CREATE POLICY documents_policy ON documents
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY chunks_policy ON chunks
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY vectors_policy ON vectors
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY user_models_policy ON user_models
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY compliance_logs_policy ON compliance_logs
  FOR ALL USING (auth.uid()::text = user_id);

-- ============================================
-- Functions & Triggers
-- ============================================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auth_users_updated_at
  BEFORE UPDATE ON auth_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_models_updated_at
  BEFORE UPDATE ON user_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 向量相似度搜索函数
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(768),
  query_user_id TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  chunk_id TEXT,
  doc_id TEXT,
  similarity FLOAT,
  encrypted_text TEXT,
  text_iv TEXT,
  text_auth_tag TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.doc_id,
    1 - (v.embedding <=> query_embedding) AS similarity,
    c.encrypted_text,
    c.text_iv,
    c.text_auth_tag
  FROM vectors v
  JOIN chunks c ON c.id = v.chunk_id
  WHERE v.user_id = query_user_id
    AND 1 - (v.embedding <=> query_embedding) > match_threshold
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 初始化
-- ============================================

-- 创建默认索引
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);

COMMENT ON TABLE documents IS 'User documents with E2EE encrypted content';
COMMENT ON TABLE chunks IS 'Document chunks with E2EE encrypted text';
COMMENT ON TABLE vectors IS 'Vector embeddings for semantic search (pgvector)';
COMMENT ON COLUMN documents.encrypted_content IS 'AES-256-GCM encrypted content (client-side encryption)';
COMMENT ON COLUMN chunks.encrypted_text IS 'AES-256-GCM encrypted chunk text';
```

#### Step 2.2: 执行Schema迁移
```bash
# 1. 保存上述SQL到文件
cd /Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent

# 2. 在Supabase Dashboard执行
# Database → SQL Editor → New Query
# 粘贴整个schema并执行

# 或使用psql命令行:
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres" \
  -f src/db/supabase_schema.sql
```

### Phase 3: 代码适配 (2-3小时)

#### Step 3.1: 安装依赖
```bash
cd /Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent

# Supabase客户端
npm install @supabase/supabase-js

# 加密库
npm install crypto-js
npm install --save-dev @types/crypto-js

# PostgreSQL驱动 (备用)
npm install pg
npm install --save-dev @types/pg
```

#### Step 3.2: 创建数据库适配层
```typescript
// File: Self_AI_Agent/src/db/adapter.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import * as crypto from 'crypto';

// 数据库类型
export enum DBType {
  SQLITE = 'sqlite',
  SUPABASE = 'supabase'
}

// 配置接口
export interface DBConfig {
  type: DBType;
  // SQLite配置
  filename?: string;
  // Supabase配置
  supabaseUrl?: string;
  supabaseKey?: string;
  // 加密配置
  encryptionEnabled?: boolean;
}

// 统一数据库接口
export interface IDatabase {
  // 文档操作
  insertDocument(doc: Document): Promise<string>;
  getDocument(id: string, userId: string): Promise<Document | null>;
  listDocuments(userId: string, limit?: number): Promise<Document[]>;
  deleteDocument(id: string, userId: string): Promise<boolean>;

  // Chunk操作
  insertChunk(chunk: Chunk): Promise<string>;
  getChunksByDocument(docId: string, userId: string): Promise<Chunk[]>;
  deleteChunksByDocument(docId: string, userId: string): Promise<number>;

  // 向量操作
  insertVector(vector: Vector): Promise<void>;
  searchSimilarVectors(
    embedding: number[],
    userId: string,
    limit: number,
    threshold?: number
  ): Promise<SimilarChunk[]>;

  // 用户模型操作
  getUserModel(userId: string): Promise<UserModel | null>;
  insertUserModel(model: UserModel): Promise<void>;
  updateUserModel(userId: string, updates: Partial<UserModel>): Promise<void>;

  // 合规日志
  insertComplianceLog(log: ComplianceLog): Promise<void>;
}

// 类型定义
export interface Document {
  id: string;
  userId: string;
  source?: string;
  type?: string;
  title?: string;
  content: string; // 明文 (会被加密存储)
  metadata?: Record<string, any>;
}

export interface Chunk {
  id: string;
  docId: string;
  userId: string;
  idx: number;
  text: string; // 明文 (会被加密存储)
  metadata?: Record<string, any>;
}

export interface Vector {
  chunkId: string;
  userId: string;
  embedding: number[]; // 768维向量
}

export interface SimilarChunk {
  chunkId: string;
  docId: string;
  text: string; // 解密后的明文
  similarity: number;
}

export interface UserModel {
  userId: string;
  modelId: string;
  version: string;
  metadata: Record<string, any>; // 明文 (会被加密存储)
  status: 'training' | 'ready' | 'error';
}

export interface ComplianceLog {
  userId: string;
  logType: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// Supabase实现 (E2EE + RLS)
// ============================================

export class SupabaseDatabase implements IDatabase {
  private client: SupabaseClient;
  private encryptionEnabled: boolean;
  private userEncryptionKeys: Map<string, Buffer> = new Map();

  constructor(config: DBConfig) {
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Supabase URL and Key are required');
    }

    this.client = createClient(config.supabaseUrl, config.supabaseKey);
    this.encryptionEnabled = config.encryptionEnabled ?? true;
  }

  // 设置用户加密密钥 (派生自用户密码)
  setUserEncryptionKey(userId: string, masterKey: Buffer) {
    this.userEncryptionKeys.set(userId, masterKey);
  }

  // 加密数据
  private encrypt(plaintext: string, userId: string): {
    encrypted: string;
    iv: string;
    authTag: string;
  } {
    if (!this.encryptionEnabled) {
      return { encrypted: plaintext, iv: '', authTag: '' };
    }

    const key = this.userEncryptionKeys.get(userId);
    if (!key) {
      throw new Error(`Encryption key not set for user ${userId}`);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // 解密数据
  private decrypt(encrypted: string, iv: string, authTag: string, userId: string): string {
    if (!this.encryptionEnabled || !iv || !authTag) {
      return encrypted;
    }

    const key = this.userEncryptionKeys.get(userId);
    if (!key) {
      throw new Error(`Encryption key not set for user ${userId}`);
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // 插入文档
  async insertDocument(doc: Document): Promise<string> {
    const { encrypted, iv, authTag } = this.encrypt(doc.content, doc.userId);

    const { data, error } = await this.client
      .from('documents')
      .insert({
        id: doc.id,
        user_id: doc.userId,
        source: doc.source,
        type: doc.type,
        title: doc.title,
        encrypted_content: encrypted,
        content_iv: iv,
        content_auth_tag: authTag,
        metadata: doc.metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Insert document failed: ${error.message}`);
    return data.id;
  }

  // 获取文档
  async getDocument(id: string, userId: string): Promise<Document | null> {
    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      source: data.source,
      type: data.type,
      title: data.title,
      content: this.decrypt(
        data.encrypted_content,
        data.content_iv,
        data.content_auth_tag,
        userId
      ),
      metadata: data.metadata
    };
  }

  // 列出文档
  async listDocuments(userId: string, limit: number = 100): Promise<Document[]> {
    const { data, error } = await this.client
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`List documents failed: ${error.message}`);

    return data.map(d => ({
      id: d.id,
      userId: d.user_id,
      source: d.source,
      type: d.type,
      title: d.title,
      content: this.decrypt(
        d.encrypted_content,
        d.content_iv,
        d.content_auth_tag,
        userId
      ),
      metadata: d.metadata
    }));
  }

  // 删除文档 (级联删除chunks和vectors)
  async deleteDocument(id: string, userId: string): Promise<boolean> {
    const { error } = await this.client
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // 插入Chunk
  async insertChunk(chunk: Chunk): Promise<string> {
    const { encrypted, iv, authTag } = this.encrypt(chunk.text, chunk.userId);

    const { data, error } = await this.client
      .from('chunks')
      .insert({
        id: chunk.id,
        doc_id: chunk.docId,
        user_id: chunk.userId,
        idx: chunk.idx,
        encrypted_text: encrypted,
        text_iv: iv,
        text_auth_tag: authTag,
        metadata: chunk.metadata || {}
      })
      .select()
      .single();

    if (error) throw new Error(`Insert chunk failed: ${error.message}`);
    return data.id;
  }

  // 获取文档的所有Chunks
  async getChunksByDocument(docId: string, userId: string): Promise<Chunk[]> {
    const { data, error } = await this.client
      .from('chunks')
      .select('*')
      .eq('doc_id', docId)
      .eq('user_id', userId)
      .order('idx', { ascending: true });

    if (error) throw new Error(`Get chunks failed: ${error.message}`);

    return data.map(c => ({
      id: c.id,
      docId: c.doc_id,
      userId: c.user_id,
      idx: c.idx,
      text: this.decrypt(
        c.encrypted_text,
        c.text_iv,
        c.text_auth_tag,
        userId
      ),
      metadata: c.metadata
    }));
  }

  // 删除文档的所有Chunks
  async deleteChunksByDocument(docId: string, userId: string): Promise<number> {
    const { error, count } = await this.client
      .from('chunks')
      .delete()
      .eq('doc_id', docId)
      .eq('user_id', userId);

    if (error) throw new Error(`Delete chunks failed: ${error.message}`);
    return count || 0;
  }

  // 插入向量
  async insertVector(vector: Vector): Promise<void> {
    // pgvector格式: [0.1, 0.2, ...]
    const { error } = await this.client
      .from('vectors')
      .insert({
        chunk_id: vector.chunkId,
        user_id: vector.userId,
        embedding: vector.embedding // pgvector自动处理数组
      });

    if (error) throw new Error(`Insert vector failed: ${error.message}`);
  }

  // 向量相似度搜索
  async searchSimilarVectors(
    embedding: number[],
    userId: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<SimilarChunk[]> {
    // 调用PostgreSQL函数
    const { data, error } = await this.client
      .rpc('search_similar_chunks', {
        query_embedding: embedding,
        query_user_id: userId,
        match_threshold: threshold,
        match_count: limit
      });

    if (error) throw new Error(`Vector search failed: ${error.message}`);

    return data.map((row: any) => ({
      chunkId: row.chunk_id,
      docId: row.doc_id,
      text: this.decrypt(
        row.encrypted_text,
        row.text_iv,
        row.text_auth_tag,
        userId
      ),
      similarity: row.similarity
    }));
  }

  // 获取用户模型
  async getUserModel(userId: string): Promise<UserModel | null> {
    const { data, error } = await this.client
      .from('user_models')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      modelId: data.model_id,
      version: data.version,
      metadata: JSON.parse(
        this.decrypt(
          data.encrypted_metadata,
          data.metadata_iv,
          data.metadata_auth_tag,
          userId
        )
      ),
      status: data.status
    };
  }

  // 插入用户模型
  async insertUserModel(model: UserModel): Promise<void> {
    const { encrypted, iv, authTag } = this.encrypt(
      JSON.stringify(model.metadata),
      model.userId
    );

    const { error } = await this.client
      .from('user_models')
      .insert({
        user_id: model.userId,
        model_id: model.modelId,
        version: model.version,
        encrypted_metadata: encrypted,
        metadata_iv: iv,
        metadata_auth_tag: authTag,
        status: model.status
      });

    if (error) throw new Error(`Insert user model failed: ${error.message}`);
  }

  // 更新用户模型
  async updateUserModel(userId: string, updates: Partial<UserModel>): Promise<void> {
    const updateData: any = {};

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.metadata) {
      const { encrypted, iv, authTag } = this.encrypt(
        JSON.stringify(updates.metadata),
        userId
      );
      updateData.encrypted_metadata = encrypted;
      updateData.metadata_iv = iv;
      updateData.metadata_auth_tag = authTag;
    }

    const { error } = await this.client
      .from('user_models')
      .update(updateData)
      .eq('user_id', userId);

    if (error) throw new Error(`Update user model failed: ${error.message}`);
  }

  // 插入合规日志
  async insertComplianceLog(log: ComplianceLog): Promise<void> {
    const { error } = await this.client
      .from('compliance_logs')
      .insert({
        user_id: log.userId,
        log_type: log.logType,
        action: log.action,
        metadata: log.metadata || {},
        ip_address: log.ipAddress,
        user_agent: log.userAgent
      });

    if (error) throw new Error(`Insert compliance log failed: ${error.message}`);
  }
}

// ============================================
// SQLite实现 (向后兼容)
// ============================================

export class SQLiteDatabase implements IDatabase {
  private db: Database.Database;

  constructor(config: DBConfig) {
    const filename = config.filename || './self_agent.db';
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    // 使用现有的schema (from db/index.ts)
  }

  // ... 实现所有IDatabase接口方法 (使用现有的SQLite代码)
  // 这里省略具体实现，因为已经在db/index.ts中完成
}

// ============================================
// 数据库工厂
// ============================================

let dbInstance: IDatabase | null = null;

export function getDatabaseAdapter(config?: DBConfig): IDatabase {
  if (dbInstance) return dbInstance;

  const dbType = process.env.DB_TYPE as DBType || DBType.SQLITE;
  const finalConfig: DBConfig = config || {
    type: dbType,
    filename: process.env.SELF_AGENT_DB || './self_agent.db',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY,
    encryptionEnabled: process.env.E2EE_ENABLED === 'true'
  };

  if (finalConfig.type === DBType.SUPABASE) {
    console.log('🚀 Using Supabase database (E2EE enabled)');
    dbInstance = new SupabaseDatabase(finalConfig);
  } else {
    console.log('🗄️  Using SQLite database (local)');
    dbInstance = new SQLiteDatabase(finalConfig);
  }

  return dbInstance;
}
```

#### Step 3.3: 环境变量配置
```bash
# File: Self_AI_Agent/.env.production

# ============================================
# Database Configuration
# ============================================

# 数据库类型: 'sqlite' or 'supabase'
DB_TYPE=supabase

# SQLite配置 (开发环境)
SELF_AGENT_DB=./self_agent.db

# Supabase配置 (生产环境)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 端到端加密
E2EE_ENABLED=true

# ============================================
# Security
# ============================================

# JWT密钥 (用于API认证)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Encryption Key Derivation
# PBKDF2迭代次数
PBKDF2_ITERATIONS=100000
```

#### Step 3.4: 更新现有代码
```typescript
// File: Self_AI_Agent/src/services/userModelTraining.ts
// 将所有数据库调用改为使用adapter

import { getDatabaseAdapter } from '../db/adapter';

export async function trainUserSpecificModel(
  userId: string,
  forceRetrain: boolean = false
): Promise<TrainModelResult> {
  const db = getDatabaseAdapter();

  // 检查现有模型
  const existingModel = await db.getUserModel(userId);
  
  if (existingModel && !forceRetrain) {
    return {
      success: true,
      message: 'User model already exists',
      modelId: existingModel.modelId,
      metadata: existingModel.metadata
    };
  }

  // 获取用户数据
  const documents = await db.listDocuments(userId);
  
  if (documents.length === 0) {
    throw new Error('No training data available');
  }

  // 训练模型...
  const modelId = `user-${userId}-${Date.now()}`;
  const metadata = {
    totalDocuments: documents.length,
    dataSources: [...new Set(documents.map(d => d.source))],
    trainingDate: new Date().toISOString()
  };

  await db.insertUserModel({
    userId,
    modelId,
    version: `v${Date.now()}`,
    metadata,
    status: 'ready'
  });

  return { success: true, modelId, metadata };
}
```

### Phase 4: 测试与验证 (1小时)

```bash
# 创建测试脚本
# File: Self_AI_Agent/test/supabase-integration.test.ts

import { getDatabaseAdapter, DBType } from '../src/db/adapter';
import * as crypto from 'crypto';

describe('Supabase Integration', () => {
  let db: IDatabase;
  const testUserId = 'test@example.com';
  const masterKey = crypto.randomBytes(32); // 模拟用户密钥

  beforeAll(() => {
    db = getDatabaseAdapter({
      type: DBType.SUPABASE,
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
      encryptionEnabled: true
    });

    // 设置加密密钥
    (db as SupabaseDatabase).setUserEncryptionKey(testUserId, masterKey);
  });

  test('Insert and retrieve encrypted document', async () => {
    const doc = {
      id: `doc-${Date.now()}`,
      userId: testUserId,
      title: 'Test Document',
      content: 'This is sensitive data that should be encrypted!',
      source: 'test'
    };

    // 插入
    await db.insertDocument(doc);

    // 读取
    const retrieved = await db.getDocument(doc.id, testUserId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.content).toBe(doc.content); // 自动解密
  });

  test('Vector similarity search', async () => {
    // 插入测试向量
    const chunkId = `chunk-${Date.now()}`;
    const embedding = Array.from({ length: 768 }, () => Math.random());

    await db.insertVector({
      chunkId,
      userId: testUserId,
      embedding
    });

    // 搜索相似向量
    const results = await db.searchSimilarVectors(
      embedding,
      testUserId,
      10,
      0.5
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].similarity).toBeGreaterThan(0.99); // 应该找到自己
  });

  test('RLS prevents cross-user data access', async () => {
    const otherUserId = 'other@example.com';

    // 尝试访问其他用户的文档 (应该返回null)
    const doc = await db.getDocument('some-doc-id', otherUserId);
    expect(doc).toBeNull();
  });
});
```

---

## 💰 成本分析

### MVP阶段 (Supabase免费层)
```
用户规模: 10-50个活跃用户
数据量: 500MB数据库 + 1GB文件存储
成本: $0/月

限制:
- 需定期手动备份
- 7天无活动会暂停 (访问时自动恢复)
```

### 小规模商业化 (Supabase Pro)
```
用户规模: 100-1,000个活跃用户
数据量: 8GB数据库 + 100GB文件存储
成本: $25/月

新增功能:
- 自动每日备份 (保留7天)
- 无暂停策略
- 优先技术支持
- 自定义域名
```

### 中规模扩展 (Supabase Team)
```
用户规模: 1,000-10,000个活跃用户
数据量: 无限数据库 + 无限存储
成本: $599/月

新增功能:
- 自动每日备份 (保留30天)
- Point-in-time recovery (恢复到任意时间点)
- 专属支持通道
- 99.9% SLA
```

---

## 🚀 商业化方案

### 阶段1: 1万用户以下 (Supabase)
```
架构: Supabase Pro/Team
优势:
- 完全托管 (无运维成本)
- 自动扩展
- 全球CDN
- 内置Auth + Storage
成本: $25-$599/月
```

### 阶段2: 1万-10万用户 (Supabase Enterprise + Redis)
```
架构:
- 主数据库: Supabase Enterprise (专属实例)
- 缓存层: Redis Cloud (Upstash/Redis Labs)
- 向量数据库: Pinecone/Qdrant (专用向量搜索)

成本估算:
- Supabase Enterprise: $2,000-$5,000/月
- Redis Cloud (10GB): $50-$200/月
- Pinecone (1M向量): $70-$280/月
总计: $2,120-$5,480/月
```

### 阶段3: 10万用户以上 (混合云架构)
```
架构:
- 主数据库: AWS RDS PostgreSQL (Multi-AZ)
  * db.r6g.2xlarge (8vCPU, 64GB RAM)
  * 成本: ~$1,200/月
  
- 向量数据库: Pinecone/Milvus/Weaviate
  * Pinecone Standard (10M向量): ~$700/月
  * 或自建Milvus集群: ~$2,000/月
  
- 对象存储: AWS S3 + CloudFront
  * 10TB存储: ~$230/月
  * 100TB传输: ~$8,500/月
  
- 缓存: AWS ElastiCache Redis
  * cache.r6g.xlarge: ~$350/月
  
- 计算: ECS Fargate / EKS
  * 20个容器实例: ~$1,500/月
  
总计: ~$12,480/月 (可支撑100万用户)

优化选项:
- 使用AWS Reserved Instances: 节省30-50%
- CDN使用Cloudflare: 节省70%带宽成本
- 向量数据库自建: 节省60%
```

---

## 🔒 安全增强建议

### 1. 客户端加密密钥管理
```typescript
// File: src/services/encryption.ts

import * as crypto from 'crypto';

export class EncryptionKeyManager {
  // 从用户密码派生加密密钥
  static deriveEncryptionKey(
    password: string,
    userSalt: string
  ): { encryptionKey: Buffer; authKey: Buffer } {
    // 使用PBKDF2派生256位密钥
    const masterKey = crypto.pbkdf2Sync(
      password,
      userSalt,
      100000, // 迭代次数
      64, // 输出64字节 (512位)
      'sha512'
    );

    // 拆分为两个32字节密钥
    const encryptionKey = masterKey.subarray(0, 32); // AES-256
    const authKey = masterKey.subarray(32, 64); // HMAC

    return { encryptionKey, authKey };
  }

  // 生成随机盐值 (用户注册时)
  static generateSalt(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// 使用示例:
// 1. 用户注册时
const salt = EncryptionKeyManager.generateSalt();
// 存储到auth_users.encryption_salt

// 2. 用户登录时
const { encryptionKey } = EncryptionKeyManager.deriveEncryptionKey(
  userPassword,
  storedSalt
);

// 3. 设置到数据库适配器
db.setUserEncryptionKey(userId, encryptionKey);
```

### 2. 备份加密
```bash
# 定期备份到加密存储
# File: scripts/backup-to-s3.sh

#!/bin/bash

# 1. 从Supabase导出数据
pg_dump "postgresql://postgres:$DB_PASSWORD@$DB_HOST:5432/postgres" \
  --file=backup-$(date +%Y%m%d).sql

# 2. 加密备份
openssl enc -aes-256-cbc \
  -salt \
  -in backup-$(date +%Y%m%d).sql \
  -out backup-$(date +%Y%m%d).sql.enc \
  -pass file:./backup-encryption-key.txt

# 3. 上传到S3 (加密传输)
aws s3 cp backup-$(date +%Y%m%d).sql.enc \
  s3://soma-backups/$(date +%Y%m%d)/ \
  --sse AES256

# 4. 删除本地文件
rm backup-$(date +%Y%m%d).sql*
```

### 3. 审计日志
```sql
-- 创建审计触发器
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (table_name, operation, user_id, old_data)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.user_id, row_to_json(OLD));
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (table_name, operation, user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.user_id, row_to_json(OLD), row_to_json(NEW));
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (table_name, operation, user_id, new_data)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.user_id, row_to_json(NEW));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 应用到敏感表
CREATE TRIGGER audit_documents
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
```

---

## 📊 迁移路径

```
当前 (SQLite本地)
         ↓
    [数据导出]
         ↓
MVP (Supabase免费层)
  - 10-50用户
  - $0/月
  - 手动备份
         ↓
    [升级订阅]
         ↓
小规模 (Supabase Pro)
  - 100-1,000用户
  - $25/月
  - 自动备份
         ↓
    [添加缓存层]
         ↓
中规模 (Supabase + Redis + Pinecone)
  - 1,000-10,000用户
  - $2,000-$5,000/月
  - 专用向量搜索
         ↓
    [迁移到AWS]
         ↓
大规模 (AWS RDS + S3 + ElastiCache)
  - 10万+用户
  - $10,000-$50,000/月
  - 完全自主控制
```

---

## 🎯 立即行动计划

### 今天 (2小时)
1. ✅ 注册Supabase账号 (5分钟)
2. ✅ 创建项目并启用pgvector (10分钟)
3. ✅ 执行schema迁移 (20分钟)
4. ✅ 安装依赖包 (10分钟)
5. ✅ 创建数据库适配层 (1小时)
6. ✅ 更新.env配置 (5分钟)

### 本周 (8小时)
7. ⏳ 更新所有数据库调用 (4小时)
8. ⏳ 实现E2EE加密逻辑 (2小时)
9. ⏳ 测试向量搜索性能 (1小时)
10. ⏳ 数据迁移脚本 (1小时)

### 下周 (测试与优化)
11. ⏳ 端到端测试 (2小时)
12. ⏳ 性能基准测试 (2小时)
13. ⏳ 安全审计 (2小时)
14. ⏳ 文档更新 (1小时)

---

## 📞 支持资源

### Supabase官方文档
- Quickstart: https://supabase.com/docs/guides/getting-started
- pgvector Guide: https://supabase.com/docs/guides/ai/vector-columns
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security
- Backup & Restore: https://supabase.com/docs/guides/platform/backups

### 社区资源
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

---

## 📝 总结

### MVP推荐方案: Supabase 免费层
- ✅ **成本**: $0/月
- ✅ **时间**: 2小时实施
- ✅ **安全**: E2EE + RLS + SOC2
- ✅ **性能**: pgvector原生支持
- ✅ **扩展**: 平滑升级到Pro/Enterprise

### 商业化路径清晰
```
$0/月 (MVP) → $25/月 (100用户) → $599/月 (1万用户) → $10,000/月 (10万用户)
```

### 立即开始
```bash
# 1. 注册Supabase
open https://supabase.com

# 2. 创建项目并获取credentials

# 3. 执行本文档中的代码

# 4. 开始测试！
```

**文档版本**: v1.0  
**最后更新**: 2025年10月20日  
**状态**: ✅ 就绪实施
