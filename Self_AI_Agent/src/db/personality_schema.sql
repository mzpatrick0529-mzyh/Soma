-- ==========================================
-- 人格模拟系统数据库 Schema
-- ==========================================

-- 1. 用户人格向量表
CREATE TABLE IF NOT EXISTS user_personality_vectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    
    -- 语言风格特征
    vocab_complexity REAL DEFAULT 0.5,
    sentence_length_pref REAL DEFAULT 0.5,
    formality_level REAL DEFAULT 0.5,
    humor_frequency REAL DEFAULT 0.3,
    emoji_usage_rate REAL DEFAULT 0.3,
    catchphrases TEXT,  -- JSON array
    punctuation_style TEXT,  -- JSON object
    
    -- 情感模式
    baseline_sentiment REAL DEFAULT 0.0,
    emotional_volatility REAL DEFAULT 0.5,
    empathy_level REAL DEFAULT 0.5,
    optimism_score REAL DEFAULT 0.5,
    anxiety_tendency REAL DEFAULT 0.3,
    anger_threshold REAL DEFAULT 0.7,
    emotion_expression_style TEXT,
    
    -- 认知风格
    analytical_vs_intuitive REAL DEFAULT 0.5,
    detail_oriented REAL DEFAULT 0.5,
    abstract_thinking REAL DEFAULT 0.5,
    decision_speed REAL DEFAULT 0.5,
    risk_tolerance REAL DEFAULT 0.5,
    open_mindedness REAL DEFAULT 0.7,
    
    -- 社交模式
    extraversion_score REAL DEFAULT 0.5,
    response_time_pattern TEXT,  -- JSON object
    conflict_resolution_style TEXT,
    
    -- 行为习惯
    daily_routine TEXT,  -- JSON object
    hobby_interests TEXT,  -- JSON array
    
    -- 元数据
    version INTEGER DEFAULT 1,
    last_trained_at TIMESTAMP,
    training_samples_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. 价值观系统表
CREATE TABLE IF NOT EXISTS user_value_systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    priority_key TEXT NOT NULL,
    priority_value REAL NOT NULL,
    
    confidence_score REAL DEFAULT 0.5,  -- 推断置信度
    evidence_count INTEGER DEFAULT 0,   -- 支持证据数量
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, priority_key)
);

-- 3. 关系图谱表
CREATE TABLE IF NOT EXISTS user_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    person_identifier TEXT NOT NULL,  -- 名字、昵称或ID
    person_name TEXT,
    relationship_type TEXT,  -- family/friend/colleague/stranger
    
    -- 关系指标
    intimacy_level REAL DEFAULT 0.3,
    interaction_frequency REAL DEFAULT 0.1,
    emotional_tone REAL DEFAULT 0.0,  -- -1(negative) to 1(positive)
    
    -- 沟通模式
    topics_discussed TEXT,  -- JSON array
    communication_style_adjustments TEXT,  -- JSON object
    
    -- 统计信息
    total_interactions INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP,
    first_interaction_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, person_identifier)
);

-- 4. 人格训练样本表
CREATE TABLE IF NOT EXISTS personality_training_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    -- 输入上下文
    conversation_context TEXT NOT NULL,  -- 对话历史
    target_person TEXT,  -- 对话对象
    timestamp_context TIMESTAMP,  -- 时间上下文
    emotional_context TEXT,  -- 情绪上下文
    
    -- 目标输出
    user_response TEXT NOT NULL,  -- 用户的实际回复
    
    -- 元数据
    source_doc_id TEXT,  -- 来源文档ID
    quality_score REAL,  -- 样本质量评分
    used_for_training BOOLEAN DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. 人格模型版本表
CREATE TABLE IF NOT EXISTS personality_model_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    version_number INTEGER NOT NULL,
    model_type TEXT,  -- 'prompt_based', 'lora', 'full_finetune'
    model_path TEXT,  -- 模型文件路径
    
    -- 训练信息
    training_samples_count INTEGER,
    training_duration_seconds INTEGER,
    training_loss REAL,
    
    -- 评估指标
    personality_similarity_score REAL,
    turing_test_pass_rate REAL,
    user_satisfaction_avg REAL,
    consistency_score REAL,
    
    -- 配置
    hyperparameters TEXT,  -- JSON
    
    is_active BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, version_number)
);

-- 6. 用户反馈表（RLHF）
CREATE TABLE IF NOT EXISTS personality_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    conversation_id TEXT,
    agent_response TEXT NOT NULL,
    
    -- 用户反馈
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),  -- 1-5星
    feedback_type TEXT,  -- 'style', 'accuracy', 'emotion', 'relationship'
    feedback_text TEXT,
    
    -- 改进建议
    suggested_response TEXT,  -- 用户提供的改进版本
    
    -- 上下文
    context_snapshot TEXT,  -- JSON: 当时的人格参数、对话对象等
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. 人格特征提取任务队列
CREATE TABLE IF NOT EXISTS personality_extraction_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    job_type TEXT NOT NULL,  -- 'linguistic', 'emotional', 'social', 'full'
    status TEXT DEFAULT 'pending',  -- pending/running/completed/failed
    
    input_data_range TEXT,  -- JSON: 处理的数据范围
    output_features TEXT,  -- JSON: 提取的特征
    
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. 人格向量嵌入表（用于快速检索）
CREATE TABLE IF NOT EXISTS personality_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    embedding_type TEXT NOT NULL,  -- 'full', 'linguistic', 'emotional', etc.
    embedding_vector BLOB NOT NULL,  -- 768维向量（序列化）
    embedding_dimension INTEGER DEFAULT 768,
    
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, embedding_type, version)
);

-- ==========================================
-- 索引优化
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_personality_vectors_user 
ON user_personality_vectors(user_id);

CREATE INDEX IF NOT EXISTS idx_relationships_user 
ON user_relationships(user_id);

CREATE INDEX IF NOT EXISTS idx_relationships_person 
ON user_relationships(user_id, person_identifier);

CREATE INDEX IF NOT EXISTS idx_training_samples_user 
ON personality_training_samples(user_id);

CREATE INDEX IF NOT EXISTS idx_training_samples_quality 
ON personality_training_samples(user_id, quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_user 
ON personality_feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_rating 
ON personality_feedback(user_id, rating);

CREATE INDEX IF NOT EXISTS idx_model_versions_active 
ON personality_model_versions(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status 
ON personality_extraction_jobs(user_id, status);

-- ==========================================
-- 触发器：自动更新时间戳
-- ==========================================

CREATE TRIGGER IF NOT EXISTS update_personality_vectors_timestamp 
AFTER UPDATE ON user_personality_vectors
BEGIN
    UPDATE user_personality_vectors 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_relationships_timestamp 
AFTER UPDATE ON user_relationships
BEGIN
    UPDATE user_relationships 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_value_systems_timestamp 
AFTER UPDATE ON user_value_systems
BEGIN
    UPDATE user_value_systems 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ==========================================
-- 初始化视图：用户人格概览
-- ==========================================

CREATE VIEW IF NOT EXISTS user_personality_overview AS
SELECT 
    u.id as user_id,
    u.email,
    pv.formality_level,
    pv.extraversion_score,
    pv.empathy_level,
    pv.baseline_sentiment,
    COUNT(DISTINCT r.id) as relationship_count,
    COUNT(DISTINCT ts.id) as training_samples_count,
    AVG(f.rating) as avg_feedback_rating,
    pv.last_trained_at,
    pv.version as personality_version
FROM users u
LEFT JOIN user_personality_vectors pv ON u.id = pv.user_id
LEFT JOIN user_relationships r ON u.id = r.user_id
LEFT JOIN personality_training_samples ts ON u.id = ts.user_id
LEFT JOIN personality_feedback f ON u.id = f.user_id
GROUP BY u.id;
