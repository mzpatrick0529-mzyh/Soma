-- Supabase Postgres schema for Soma (Option A)
-- Requirements:
--   CREATE EXTENSION IF NOT EXISTS vector;
--   CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid() if needed

-- Notes:
-- - Keep id columns as TEXT for compatibility with existing SQLite IDs.
-- - Enforce multi-tenant isolation with RLS via app.user_id GUC.
-- - Store embeddings in chunks.embedding (pgvector). Optional: vectors table for compatibility.

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auth users (app-level)
CREATE TABLE IF NOT EXISTS auth_users (
  email TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  avatar TEXT,
  password_hash TEXT,
  password_salt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT,
  type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_source ON documents(user_id, source);

-- Chunks with embedding
-- Adjust vector dimension to your embedding model (default 1536 for OpenAI text-embedding-3-large)
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idx INT,
  text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chunks_user ON chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat
  ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Compatibility vectors table (optional; keeps parity with existing code paths)
CREATE TABLE IF NOT EXISTS vectors (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dim INT NOT NULL,
  vec VECTOR(1536) -- stored as pgvector, not bytea
);
CREATE INDEX IF NOT EXISTS idx_vectors_user ON vectors(user_id);

-- User-specific AI models
CREATE TABLE IF NOT EXISTS user_models (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  version TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_models_user ON user_models(user_id);

-- Personality training samples (keep name parity with SQLite)
CREATE TABLE IF NOT EXISTS personality_training_samples (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_context TEXT,
  user_response TEXT,
  target_person TEXT,
  timestamp_context TIMESTAMPTZ,
  emotional_context TEXT,
  source_doc_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  quality_score REAL,
  used_for_training INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_training_samples_user 
  ON personality_training_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_training_samples_unused 
  ON personality_training_samples(user_id, used_for_training);

-- Training jobs
CREATE TABLE IF NOT EXISTS training_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_training_jobs_user ON training_jobs(user_id);

-- RLS: enable and isolate by app.user_id
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;

-- Helper: evaluate to true when current_setting('app.user_id', true) matches row.user_id
-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'documents'
  ) THEN
    CREATE POLICY documents_isolate_per_user ON documents
      USING (user_id::text = current_setting('app.user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'chunks'
  ) THEN
    CREATE POLICY chunks_isolate_per_user ON chunks
      USING (user_id::text = current_setting('app.user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'vectors'
  ) THEN
    CREATE POLICY vectors_isolate_per_user ON vectors
      USING (user_id::text = current_setting('app.user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'personality_training_samples'
  ) THEN
    CREATE POLICY training_samples_isolate_per_user ON personality_training_samples
      USING (user_id::text = current_setting('app.user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'training_jobs'
  ) THEN
    CREATE POLICY training_jobs_isolate_per_user ON training_jobs
      USING (user_id::text = current_setting('app.user_id', true));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'user_models'
  ) THEN
    CREATE POLICY user_models_isolate_per_user ON user_models
      USING (user_id::text = current_setting('app.user_id', true));
  END IF;
END $$;

COMMIT;

-- Example vector search (L2)
-- SELECT id, doc_id, text, 1 - (embedding <#> $1::vector) AS similarity
-- FROM chunks
-- WHERE user_id = $2
-- ORDER BY embedding <-> $1::vector
-- LIMIT 10;
-- ============================================
-- Soma Supabase Schema with E2EE & pgvector
-- Version: 1.0.0
-- Created: 2025-10-20
-- ============================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 用于文本模糊搜索

-- ============================================
-- 核心用户表
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 认证用户 (扩展Supabase Auth)
CREATE TABLE IF NOT EXISTS auth_users (
  email TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  avatar TEXT,
  -- 加密密钥派生盐值 (用于客户端E2EE)
  encryption_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 文档与内容表 (E2EE加密存储)
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT, -- 'google', 'wechat', 'instagram', etc.
  type TEXT, -- 'email', 'chat', 'photo', etc.
  title TEXT, -- 明文存储 (用于搜索)
  
  -- E2EE 加密字段 (AES-256-GCM)
  encrypted_content TEXT NOT NULL,
  content_iv TEXT NOT NULL, -- 初始化向量
  content_auth_tag TEXT NOT NULL, -- 认证标签
  
  -- 非敏感元数据 (明文JSON)
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type) WHERE type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);

-- ============================================
-- Chunks表 (文档分块，E2EE加密)
-- ============================================

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL, -- chunk在文档中的位置
  
  -- E2EE 加密字段
  encrypted_text TEXT NOT NULL,
  text_iv TEXT NOT NULL,
  text_auth_tag TEXT NOT NULL,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_chunks_user ON chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc_idx ON chunks(doc_id, idx);

-- ============================================
-- 向量表 (pgvector for RAG)
-- ============================================

CREATE TABLE IF NOT EXISTS vectors (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 768维向量 (sentence-transformers/all-mpnet-base-v2)
  embedding vector(768) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW索引 (快速近似最近邻搜索)
-- m=16: 每个节点的邻居数
-- ef_construction=64: 构建索引时的搜索深度
CREATE INDEX IF NOT EXISTS idx_vectors_embedding_hnsw ON vectors 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 用户索引
CREATE INDEX IF NOT EXISTS idx_vectors_user ON vectors(user_id);

-- ============================================
-- 用户专属AI模型
-- ============================================

CREATE TABLE IF NOT EXISTS user_models (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  version TEXT NOT NULL,
  
  -- E2EE: persona profile和训练元数据加密存储
  encrypted_metadata TEXT NOT NULL,
  metadata_iv TEXT NOT NULL,
  metadata_auth_tag TEXT NOT NULL,
  
  status TEXT DEFAULT 'training' CHECK (status IN ('training', 'ready', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_models_status ON user_models(status);

-- ============================================
-- 合规日志 (GDPR/CCPA/BIPA审计追踪)
-- ============================================

CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  log_type TEXT NOT NULL, -- 'biometric_consent', 'wechat_disclaimer', 'sensitive_info_limit', etc.
  action TEXT NOT NULL CHECK (action IN ('granted', 'declined', 'revoked')),
  
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_user ON compliance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_type ON compliance_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created ON compliance_logs(created_at DESC);

-- ============================================
-- Row-Level Security (RLS) 策略
-- 用户只能访问自己的数据
-- ============================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- 用户策略
CREATE POLICY IF NOT EXISTS "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY IF NOT EXISTS "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- 认证用户策略
CREATE POLICY IF NOT EXISTS "Auth users can view own profile" ON auth_users
  FOR SELECT USING (auth.uid()::text = email OR auth.email() = email);

CREATE POLICY IF NOT EXISTS "Auth users can update own profile" ON auth_users
  FOR UPDATE USING (auth.uid()::text = email OR auth.email() = email);

CREATE POLICY IF NOT EXISTS "Auth users can insert own profile" ON auth_users
  FOR INSERT WITH CHECK (auth.uid()::text = email);

-- 文档策略
CREATE POLICY IF NOT EXISTS "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid()::text = user_id);

-- Chunks策略
CREATE POLICY IF NOT EXISTS "Users can manage own chunks" ON chunks
  FOR ALL USING (auth.uid()::text = user_id);

-- 向量策略
CREATE POLICY IF NOT EXISTS "Users can manage own vectors" ON vectors
  FOR ALL USING (auth.uid()::text = user_id);

-- 用户模型策略
CREATE POLICY IF NOT EXISTS "Users can manage own models" ON user_models
  FOR ALL USING (auth.uid()::text = user_id);

-- 合规日志策略 (只读)
CREATE POLICY IF NOT EXISTS "Users can view own compliance logs" ON compliance_logs
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "System can insert compliance logs" ON compliance_logs
  FOR INSERT WITH CHECK (true); -- 允许系统插入

-- ============================================
-- 自动触发器
-- ============================================

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
CREATE TRIGGER update_auth_users_updated_at
  BEFORE UPDATE ON auth_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_models_updated_at ON user_models;
CREATE TRIGGER update_user_models_updated_at
  BEFORE UPDATE ON user_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 实用函数
-- ============================================

-- 1. 向量相似度搜索 (RAG核心功能)
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
  text_auth_tag TEXT,
  doc_title TEXT,
  doc_source TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.doc_id,
    1 - (v.embedding <=> query_embedding) AS similarity,
    c.encrypted_text,
    c.text_iv,
    c.text_auth_tag,
    d.title AS doc_title,
    d.source AS doc_source
  FROM vectors v
  JOIN chunks c ON c.id = v.chunk_id
  JOIN documents d ON d.id = c.doc_id
  WHERE v.user_id = query_user_id
    AND 1 - (v.embedding <=> query_embedding) > match_threshold
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 2. 获取用户统计信息
CREATE OR REPLACE FUNCTION get_user_stats(query_user_id TEXT)
RETURNS TABLE (
  total_documents BIGINT,
  total_chunks BIGINT,
  total_vectors BIGINT,
  data_sources TEXT[],
  has_model BOOLEAN,
  model_status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT d.id) AS total_documents,
    COUNT(DISTINCT c.id) AS total_chunks,
    COUNT(DISTINCT v.chunk_id) AS total_vectors,
    ARRAY_AGG(DISTINCT d.source) FILTER (WHERE d.source IS NOT NULL) AS data_sources,
    EXISTS(SELECT 1 FROM user_models WHERE user_id = query_user_id) AS has_model,
    (SELECT status FROM user_models WHERE user_id = query_user_id) AS model_status
  FROM users u
  LEFT JOIN documents d ON d.user_id = u.id
  LEFT JOIN chunks c ON c.user_id = u.id
  LEFT JOIN vectors v ON v.user_id = u.id
  WHERE u.id = query_user_id
  GROUP BY u.id;
END;
$$;

-- 3. 批量插入向量 (性能优化)
CREATE OR REPLACE FUNCTION batch_insert_vectors(
  p_vectors JSONB
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count INT := 0;
BEGIN
  INSERT INTO vectors (chunk_id, user_id, embedding)
  SELECT
    (v->>'chunk_id')::TEXT,
    (v->>'user_id')::TEXT,
    (v->>'embedding')::vector(768)
  FROM jsonb_array_elements(p_vectors) AS v;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- 4. 清理孤立数据 (维护任务)
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TABLE (
  orphaned_chunks BIGINT,
  orphaned_vectors BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_chunks BIGINT;
  deleted_vectors BIGINT;
BEGIN
  -- 删除没有关联文档的chunks
  WITH deleted AS (
    DELETE FROM chunks
    WHERE doc_id NOT IN (SELECT id FROM documents)
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_chunks FROM deleted;
  
  -- 删除没有关联chunks的vectors
  WITH deleted AS (
    DELETE FROM vectors
    WHERE chunk_id NOT IN (SELECT id FROM chunks)
    RETURNING chunk_id
  )
  SELECT COUNT(*) INTO deleted_vectors FROM deleted;
  
  RETURN QUERY SELECT deleted_chunks, deleted_vectors;
END;
$$;

-- ============================================
-- 表注释 (文档化)
-- ============================================

COMMENT ON TABLE users IS '用户主表';
COMMENT ON TABLE auth_users IS '认证用户扩展信息 (包含E2EE盐值)';
COMMENT ON TABLE documents IS '用户文档 (内容E2EE加密)';
COMMENT ON TABLE chunks IS '文档分块 (文本E2EE加密)';
COMMENT ON TABLE vectors IS '向量embeddings (pgvector)';
COMMENT ON TABLE user_models IS '用户专属AI模型 (元数据E2EE加密)';
COMMENT ON TABLE compliance_logs IS '合规审计日志 (GDPR/CCPA/BIPA)';

COMMENT ON COLUMN documents.encrypted_content IS 'AES-256-GCM加密的文档内容 (客户端加密)';
COMMENT ON COLUMN documents.content_iv IS 'AES初始化向量';
COMMENT ON COLUMN documents.content_auth_tag IS 'AES认证标签 (防篡改)';

COMMENT ON COLUMN chunks.encrypted_text IS 'AES-256-GCM加密的chunk文本';
COMMENT ON COLUMN vectors.embedding IS '768维sentence-transformer向量';

COMMENT ON FUNCTION search_similar_chunks IS '语义相似度搜索 (RAG核心功能)';
COMMENT ON FUNCTION get_user_stats IS '获取用户数据统计';
COMMENT ON FUNCTION batch_insert_vectors IS '批量插入向量 (性能优化)';
COMMENT ON FUNCTION cleanup_orphaned_data IS '清理孤立数据 (维护任务)';

-- ============================================
-- 初始化完成
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Soma Schema初始化完成!';
  RAISE NOTICE '📊 已创建 7 张表';
  RAISE NOTICE '🔒 已启用 Row-Level Security';
  RAISE NOTICE '🔍 已创建 pgvector 索引';
  RAISE NOTICE '⚡ 已创建 4 个实用函数';
  RAISE NOTICE '';
  RAISE NOTICE '下一步:';
  RAISE NOTICE '1. 验证扩展: SELECT * FROM pg_extension WHERE extname IN (''vector'', ''uuid-ossp'', ''pg_trgm'');';
  RAISE NOTICE '2. 测试向量搜索: SELECT * FROM search_similar_chunks(array_fill(0.1, ARRAY[768])::vector, ''test@example.com'', 0.5, 5);';
  RAISE NOTICE '3. 查看统计: SELECT * FROM get_user_stats(''test@example.com'');';
END $$;
