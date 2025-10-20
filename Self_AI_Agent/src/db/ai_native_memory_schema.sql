-- ============================================
-- Self Agent V2.0: AI-Native Memory Database
-- Hierarchical Memory Modeling (HMM)
-- ============================================

-- ============================================
-- LAYER 0: 原始记忆层 (Raw Memory)
-- ============================================

CREATE TABLE IF NOT EXISTS l0_raw_memories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    
    -- 内容
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,           -- text/image/audio/video/file
    source TEXT NOT NULL,                 -- wechat/instagram/google/manual
    
    -- 时间戳
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 会话上下文
    conversation_id TEXT,
    message_sequence INT,                 -- 消息顺序
    participants TEXT,                    -- JSON数组: ["user", "friend_a"]
    
    -- 位置和场景
    location TEXT,                        -- 地理位置
    scene_context TEXT,                   -- 场景标签: home/office/outdoor
    
    -- 嵌入向量 (存储为BLOB)
    embedding_768 BLOB,                   -- Sentence-Transformers嵌入
    embedding_1536 BLOB,                  -- OpenAI/Cohere高维嵌入
    
    -- 情感分析
    sentiment_score REAL,                 -- [-1.0, 1.0]
    sentiment_label TEXT,                 -- positive/neutral/negative
    emotion_labels TEXT,                  -- JSON: {"joy": 0.8, "sadness": 0.1, ...}
    
    -- 意图和主题
    intent_tags TEXT,                     -- JSON: ["asking", "sharing", "joking"]
    topic_tags TEXT,                      -- JSON: ["work", "hobby", "family"]
    
    -- 实体提取
    entities TEXT,                        -- JSON: [{"text": "北京", "type": "LOCATION"}, ...]
    keywords TEXT,                        -- JSON: ["关键词1", "关键词2"]
    
    -- 元数据
    metadata TEXT,                        -- JSON: 原始数据的元数据
    raw_data TEXT,                        -- 原始JSON (如果需要)
    
    -- 处理状态
    processed BOOLEAN DEFAULT 0,
    indexed BOOLEAN DEFAULT 0,
    clustered BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_l0_user_time ON l0_raw_memories(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_l0_conversation ON l0_raw_memories(conversation_id, message_sequence);
CREATE INDEX IF NOT EXISTS idx_l0_source ON l0_raw_memories(source, user_id);
CREATE INDEX IF NOT EXISTS idx_l0_processed ON l0_raw_memories(user_id, processed);

-- 全文搜索 (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS l0_memories_fts USING fts5(
    id UNINDEXED,
    user_id UNINDEXED,
    content,
    keywords,
    entities,
    content='l0_raw_memories',
    content_rowid='rowid'
);

-- FTS触发器
CREATE TRIGGER IF NOT EXISTS l0_memories_ai AFTER INSERT ON l0_raw_memories BEGIN
    INSERT INTO l0_memories_fts(rowid, id, user_id, content, keywords, entities)
    VALUES (new.rowid, new.id, new.user_id, new.content, new.keywords, new.entities);
END;

CREATE TRIGGER IF NOT EXISTS l0_memories_ad AFTER DELETE ON l0_raw_memories BEGIN
    DELETE FROM l0_memories_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS l0_memories_au AFTER UPDATE ON l0_raw_memories BEGIN
    UPDATE l0_memories_fts 
    SET content = new.content, keywords = new.keywords, entities = new.entities
    WHERE rowid = new.rowid;
END;


-- ============================================
-- LAYER 1: 主题聚类层 (Topic Clusters)
-- ============================================

CREATE TABLE IF NOT EXISTS l1_memory_clusters (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    
    -- 聚类信息
    cluster_name TEXT,                    -- 自动生成的主题名称
    cluster_name_zh TEXT,                 -- 中文主题名
    cluster_name_en TEXT,                 -- 英文主题名
    cluster_description TEXT,             -- 主题描述
    
    -- 聚类中心
    cluster_center BLOB,                  -- 向量中心 (768维)
    cluster_radius REAL,                  -- 聚类半径 (离散度)
    
    -- 成员记忆
    memory_ids TEXT NOT NULL,             -- JSON: [id1, id2, ...]
    memory_count INT DEFAULT 0,
    
    -- 关键特征
    keywords TEXT,                        -- JSON: [{"word": "工作", "weight": 0.85}, ...]
    entities TEXT,                        -- JSON: [{"name": "张三", "type": "PERSON", "count": 5}, ...]
    topics TEXT,                          -- JSON: ["职场", "项目管理"]
    
    -- 时间特征
    time_range_start DATETIME,
    time_range_end DATETIME,
    first_occurrence DATETIME,
    last_occurrence DATETIME,
    frequency_pattern TEXT,               -- JSON: {"daily": 0.3, "weekly": 0.5, ...}
    
    -- 关系网络
    related_clusters TEXT,                -- JSON: [{"cluster_id": "xxx", "similarity": 0.82}, ...]
    participant_network TEXT,             -- JSON: [{"person": "朋友A", "interactions": 15}, ...]
    
    -- 情感特征
    emotional_tone TEXT,                  -- dominant emotion: positive/neutral/negative
    sentiment_distribution TEXT,          -- JSON: histogram of sentiments
    avg_sentiment REAL,
    sentiment_volatility REAL,            -- 情感波动性
    
    -- 重要性评分
    importance_score REAL DEFAULT 0.5,    -- [0, 1] 聚类重要性
    representativeness REAL DEFAULT 0.5,  -- 代表性得分
    
    -- 元数据
    version INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_l1_user ON l1_memory_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_l1_importance ON l1_memory_clusters(user_id, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_l1_time ON l1_memory_clusters(user_id, last_occurrence DESC);


-- L1 Shades (记忆碎片 - 存储聚类中的典型样本)
CREATE TABLE IF NOT EXISTS l1_memory_shades (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cluster_id TEXT NOT NULL,
    memory_id TEXT NOT NULL,              -- 指向 L0
    
    -- 代表性
    representativeness REAL DEFAULT 0.5,  -- 该记忆对聚类的代表性
    centrality REAL DEFAULT 0.5,          -- 与聚类中心的距离
    
    -- 摘要
    summary TEXT,                         -- 记忆摘要
    significance TEXT,                    -- 意义说明
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cluster_id) REFERENCES l1_memory_clusters(id) ON DELETE CASCADE,
    FOREIGN KEY (memory_id) REFERENCES l0_raw_memories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_l1_shades_cluster ON l1_memory_shades(cluster_id, representativeness DESC);
CREATE INDEX IF NOT EXISTS idx_l1_shades_memory ON l1_memory_shades(memory_id);


-- 主题演化追踪
CREATE TABLE IF NOT EXISTS l1_topic_evolution (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cluster_id TEXT NOT NULL,
    snapshot_date DATE NOT NULL,
    
    -- 快照指标
    memory_count INT,
    avg_sentiment REAL,
    activity_level REAL,                  -- 活跃度 (记忆频率)
    
    -- 变化趋势
    growth_rate REAL,                     -- 增长率
    sentiment_change REAL,                -- 情感变化
    
    metrics TEXT,                         -- JSON: 其他指标
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cluster_id) REFERENCES l1_memory_clusters(id) ON DELETE CASCADE,
    UNIQUE(cluster_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_l1_evolution ON l1_topic_evolution(cluster_id, snapshot_date DESC);


-- ============================================
-- LAYER 2: 个人传记层 (Biography)
-- ============================================

CREATE TABLE IF NOT EXISTS l2_biography (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL UNIQUE,
    
    -- 核心身份
    identity_core TEXT,                   -- JSON: ["开发者", "游戏玩家", "咖啡爱好者"]
    identity_summary TEXT,                -- 一句话身份描述
    life_stage TEXT,                      -- teenager/young_adult/adult/senior
    personality_type TEXT,                -- MBTI或Big5人格类型
    
    -- 人生叙事 (三视角)
    narrative_first_person TEXT,          -- 第一人称叙事 (500-800字)
    narrative_third_person TEXT,          -- 第三人称叙事
    narrative_timeline TEXT,              -- JSON: [{period, events, significance}]
    life_philosophy TEXT,                 -- 人生哲学
    
    -- 价值观体系
    core_values TEXT,                     -- JSON: [{"value": "家庭", "score": 0.95, "evidence": [...]}]
    belief_system TEXT,                   -- JSON: {worldview, principles}
    priorities TEXT,                      -- JSON: {family: 0.9, career: 0.8, ...}
    
    -- 关系网络
    relationship_map TEXT,                -- JSON: [{"person": "张三", "role": "好友", "intimacy": 0.85, ...}]
    social_circles TEXT,                  -- JSON: [{"circle": "大学同学", "members": [...]}]
    social_identity TEXT,                 -- JSON: {roles, communities}
    
    -- 认知风格
    thinking_patterns TEXT,               -- JSON: {analytical: 0.7, creative: 0.6, ...}
    decision_making_style TEXT,           -- JSON: {rational: 0.8, intuitive: 0.4, ...}
    learning_style TEXT,                  -- visual/auditory/kinesthetic
    problem_solving_approach TEXT,        -- systematic/trial_error/collaborative
    
    -- 沟通风格
    communication_style TEXT,             -- JSON: {formality: 0.3, directness: 0.7, ...}
    conflict_resolution_style TEXT,       -- avoiding/accommodating/competing/collaborating
    
    -- 语言指纹
    linguistic_signature TEXT,            -- JSON: {详细语言特征}
    vocabulary_level TEXT,                -- basic/intermediate/advanced
    common_phrases TEXT,                  -- JSON: ["口头禅1", "口头禅2"]
    humor_style TEXT,                     -- sarcastic/punny/observational/dark
    
    -- 声音特征 (如果有音频数据)
    voice_characteristics TEXT,           -- JSON: {pitch, speed, tone, ...}
    
    -- 情感画像
    emotional_baseline TEXT,              -- JSON: {default_mood, typical_range}
    emotional_triggers TEXT,              -- JSON: [{"trigger": "压力", "response": "沉默"}, ...]
    coping_mechanisms TEXT,               -- JSON: ["运动", "音乐", "倾诉"]
    
    -- 行为模式
    daily_routines TEXT,                  -- JSON: [{"time": "07:00", "activity": "晨跑", "frequency": 0.8}]
    weekly_patterns TEXT,                 -- JSON: 每周习惯
    seasonal_patterns TEXT,               -- JSON: 季节性行为
    
    -- 兴趣爱好
    interests_hobbies TEXT,               -- JSON: [{"hobby": "摄影", "proficiency": 0.7, "frequency": "weekly"}]
    expertise_areas TEXT,                 -- JSON: ["Python编程", "数据分析"]
    learning_goals TEXT,                  -- JSON: ["学习日语", "考驾照"]
    
    -- 职业身份
    career_info TEXT,                     -- JSON: {occupation, industry, experience}
    work_style TEXT,                      -- JSON: {independence, collaboration, ...}
    
    -- 生活方式
    lifestyle_choices TEXT,               -- JSON: {diet, exercise, sleep, ...}
    consumption_habits TEXT,              -- JSON: 消费偏好
    
    -- 元数据
    version INT DEFAULT 1,
    quality_score REAL DEFAULT 0.0,       -- 传记质量评分 [0, 1]
    completeness REAL DEFAULT 0.0,        -- 完整度 [0, 1]
    source_clusters TEXT,                 -- JSON: [cluster_ids] 来源聚类
    total_memories_used INT DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_trained_at DATETIME,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_l2_user ON l2_biography(user_id);
CREATE INDEX IF NOT EXISTS idx_l2_version ON l2_biography(user_id, version DESC);


-- 传记版本历史 (支持时间旅行)
CREATE TABLE IF NOT EXISTS l2_biography_versions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    biography_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    version INT NOT NULL,
    
    -- 快照数据
    snapshot_data TEXT NOT NULL,          -- JSON: 完整传记快照
    
    -- 变更信息
    changes_summary TEXT,                 -- 变更摘要
    changes_detail TEXT,                  -- JSON: 详细变更列表
    trigger_reason TEXT,                  -- 触发原因: manual/auto/training
    
    -- 性能指标
    quality_score REAL,
    alignment_score REAL,                 -- 与实际行为的一致性
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (biography_id) REFERENCES l2_biography(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(biography_id, version)
);

CREATE INDEX IF NOT EXISTS idx_l2_versions ON l2_biography_versions(biography_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_l2_versions_time ON l2_biography_versions(user_id, created_at DESC);


-- 特征属性库 (可查询的量化特征)
CREATE TABLE IF NOT EXISTS l2_attributes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    biography_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    -- 特征分类
    attribute_category TEXT NOT NULL,     -- linguistic/emotional/cognitive/social/behavioral
    attribute_key TEXT NOT NULL,          -- vocab_complexity, empathy_level, etc.
    attribute_value REAL NOT NULL,        -- 数值 (通常 [0, 1])
    
    -- 元数据
    confidence REAL DEFAULT 0.5,          -- 置信度
    evidence_count INT DEFAULT 0,         -- 证据样本数
    evidence_samples TEXT,                -- JSON: [memory_ids] 前10个证据
    
    -- 时间信息
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME,                 -- 有效期 (可选)
    
    FOREIGN KEY (biography_id) REFERENCES l2_biography(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(biography_id, attribute_category, attribute_key)
);

CREATE INDEX IF NOT EXISTS idx_l2_attrs ON l2_attributes(biography_id, attribute_category);
CREATE INDEX IF NOT EXISTS idx_l2_attrs_user ON l2_attributes(user_id, attribute_category);


-- ============================================
-- Me-Alignment 训练数据
-- ============================================

-- 训练样本 (用于RLHF)
CREATE TABLE IF NOT EXISTS me_alignment_samples (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    
    -- 输入上下文
    context_memories TEXT,                -- JSON: 检索到的记忆IDs
    conversation_history TEXT,            -- JSON: 对话历史
    partner_info TEXT,                    -- JSON: 对话对象信息
    current_input TEXT NOT NULL,
    
    -- 生成输出
    generated_response TEXT NOT NULL,
    generation_method TEXT,               -- v1_features/v2_memories
    
    -- 评分
    alignment_score REAL,                 -- 自动评分 [0, 1]
    linguistic_score REAL,
    emotional_score REAL,
    value_score REAL,
    factual_score REAL,
    
    -- 用户反馈
    user_rating INT,                      -- 1-5星评分
    user_feedback TEXT,                   -- 文字反馈
    user_correction TEXT,                 -- 用户修改建议
    feedback_type TEXT,                   -- explicit/implicit
    
    -- 奖励信号
    reward REAL,                          -- [-1, 1] RLHF奖励
    
    -- 元数据
    model_version TEXT,                   -- 使用的模型版本
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alignment_user ON me_alignment_samples(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alignment_rating ON me_alignment_samples(user_id, user_rating DESC);
CREATE INDEX IF NOT EXISTS idx_alignment_reward ON me_alignment_samples(user_id, reward DESC);


-- 一致性评估记录
CREATE TABLE IF NOT EXISTS alignment_evaluations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    evaluation_date DATE NOT NULL,
    
    -- 整体指标
    overall_alignment REAL,               -- 总体一致性 [0, 1]
    turing_test_score REAL,               -- 图灵测试得分
    
    -- 分项得分
    linguistic_consistency REAL,
    emotional_consistency REAL,
    value_consistency REAL,
    factual_accuracy REAL,
    
    -- 测试详情
    test_samples_count INT,
    passed_samples_count INT,
    
    test_details TEXT,                    -- JSON: 详细测试结果
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, evaluation_date)
);

CREATE INDEX IF NOT EXISTS idx_eval_user ON alignment_evaluations(user_id, evaluation_date DESC);


-- ============================================
-- 辅助表: 记忆检索缓存
-- ============================================

CREATE TABLE IF NOT EXISTS memory_retrieval_cache (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    query_hash TEXT NOT NULL,             -- 查询的哈希值
    
    -- 检索结果
    l0_memory_ids TEXT,                   -- JSON: [ids]
    l1_cluster_ids TEXT,                  -- JSON: [ids]
    l2_biography_snapshot TEXT,           -- JSON: 传记快照
    
    -- 缓存元数据
    retrieval_score REAL,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    hit_count INT DEFAULT 0,
    last_hit_at DATETIME,
    
    expires_at DATETIME,                  -- 过期时间
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, query_hash)
);

CREATE INDEX IF NOT EXISTS idx_cache_user ON memory_retrieval_cache(user_id, cached_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON memory_retrieval_cache(expires_at);


-- ============================================
-- 视图: 便捷查询
-- ============================================

-- 用户记忆概览
CREATE VIEW IF NOT EXISTS v_user_memory_overview AS
SELECT 
    u.id AS user_id,
    u.email,
    COUNT(DISTINCT l0.id) AS total_raw_memories,
    COUNT(DISTINCT l1.id) AS total_clusters,
    COUNT(DISTINCT l2.id) AS has_biography,
    MIN(l0.timestamp) AS earliest_memory,
    MAX(l0.timestamp) AS latest_memory,
    AVG(l0.sentiment_score) AS avg_sentiment,
    l2.quality_score AS biography_quality
FROM users u
LEFT JOIN l0_raw_memories l0 ON u.id = l0.user_id
LEFT JOIN l1_memory_clusters l1 ON u.id = l1.user_id
LEFT JOIN l2_biography l2 ON u.id = l2.user_id
GROUP BY u.id;


-- 聚类统计
CREATE VIEW IF NOT EXISTS v_cluster_statistics AS
SELECT 
    l1.id AS cluster_id,
    l1.user_id,
    l1.cluster_name,
    l1.memory_count,
    l1.importance_score,
    l1.avg_sentiment,
    l1.first_occurrence,
    l1.last_occurrence,
    julianday(l1.last_occurrence) - julianday(l1.first_occurrence) AS duration_days,
    COUNT(DISTINCT l1s.id) AS shade_count
FROM l1_memory_clusters l1
LEFT JOIN l1_memory_shades l1s ON l1.id = l1s.cluster_id
GROUP BY l1.id;


-- ============================================
-- 触发器: 自动更新
-- ============================================

-- L0插入时自动更新L1聚类状态
CREATE TRIGGER IF NOT EXISTS trg_l0_insert_invalidate_clusters
AFTER INSERT ON l0_raw_memories
BEGIN
    UPDATE l1_memory_clusters
    SET updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
END;


-- L1更新时自动更新L2传记
CREATE TRIGGER IF NOT EXISTS trg_l1_update_invalidate_biography
AFTER UPDATE ON l1_memory_clusters
BEGIN
    UPDATE l2_biography
    SET updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
END;


-- 自动更新时间戳
CREATE TRIGGER IF NOT EXISTS trg_l1_update_timestamp
AFTER UPDATE ON l1_memory_clusters
FOR EACH ROW
BEGIN
    UPDATE l1_memory_clusters
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_l2_update_timestamp
AFTER UPDATE ON l2_biography
FOR EACH ROW
BEGIN
    UPDATE l2_biography
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;


-- ============================================
-- 初始化完成
-- ============================================

-- 插入版本标记
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO schema_version (version, description)
VALUES ('2.0.0', 'AI-Native Memory Architecture - Hierarchical Memory Modeling');

-- 成功消息
SELECT 'AI-Native Memory Database Schema initialized successfully!' AS message;
