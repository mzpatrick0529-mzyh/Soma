-- Supabase Postgres schema for Soma Self AI Agent
-- 请在 Supabase SQL Editor 中执行此脚本

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (使用 TEXT 类型以兼容现有 SQLite 数据)
-- 注意: 不使用 Supabase Auth 的默认 users 表，而是创建独立的应用级用户表
CREATE TABLE IF NOT EXISTS soma_users (
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
  user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
  source TEXT,
  type TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_source ON documents(user_id, source);

-- Chunks with embedding (1536 维向量)
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
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

-- Vectors table (compatibility)
CREATE TABLE IF NOT EXISTS vectors (
  chunk_id TEXT PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
  dim INT NOT NULL,
  vec VECTOR(1536)
);
CREATE INDEX IF NOT EXISTS idx_vectors_user ON vectors(user_id);

-- User models
CREATE TABLE IF NOT EXISTS user_models (
  user_id TEXT PRIMARY KEY REFERENCES soma_users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  version TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_models_user ON user_models(user_id);

-- Personality training samples
CREATE TABLE IF NOT EXISTS personality_training_samples (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
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
  user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_training_jobs_user ON training_jobs(user_id);

-- 启用行级安全 (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_models ENABLE ROW LEVEL SECURITY;

-- RLS 策略: 基于 app.user_id 隔离数据
CREATE POLICY documents_isolate_per_user ON documents
  USING (user_id::text = current_setting('app.user_id', true));

CREATE POLICY chunks_isolate_per_user ON chunks
  USING (user_id::text = current_setting('app.user_id', true));

CREATE POLICY vectors_isolate_per_user ON vectors
  USING (user_id::text = current_setting('app.user_id', true));

CREATE POLICY training_samples_isolate_per_user ON personality_training_samples
  USING (user_id::text = current_setting('app.user_id', true));

CREATE POLICY training_jobs_isolate_per_user ON training_jobs
  USING (user_id::text = current_setting('app.user_id', true));

CREATE POLICY user_models_isolate_per_user ON user_models
  USING (user_id::text = current_setting('app.user_id', true));
