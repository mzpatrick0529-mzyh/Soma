epoch-- ============================================
-- 增强型人格系统数据库 Schema
-- 版本: v2.0
-- 作者: GitHub Copilot AI PM
-- 用途: 支持多维人格分析、时序行为建模、主动Agent
-- ============================================

-- ============================================
-- 1. 增强型人格档案表
-- ============================================
CREATE TABLE IF NOT EXISTS enhanced_persona_profiles (
  user_id TEXT PRIMARY KEY,
  
  -- Big Five 人格分数 (JSON: {openness, conscientiousness, extraversion, agreeableness, neuroticism})
  big_five_scores TEXT NOT NULL,
  
  -- 跨平台一致性分析 (JSON: {instagram_wechat, wechat_google, overall, inconsistency_flags})
  cross_platform_consistency TEXT,
  
  -- 关系上下文人格变化 (JSON数组: [{target_person, relationship_type, persona_shift, ...}])
  contextual_persona TEXT,
  
  -- 语言签名 (JSON: {vocabularyFrequency, emojiUsagePattern, formalityScore, ...})
  linguistic_signature TEXT,
  
  -- 时序模式 (JSON: {dailyRoutine, weeklyPatterns, importantDates, activeHours, ...})
  temporal_patterns TEXT,
  
  -- 版本号 (用于追踪人格演化)
  version INTEGER DEFAULT 1,
  
  -- 质量分数 (0-1, 基于数据量和特征完整度)
  quality_score REAL DEFAULT 0.0,
  
  -- 时间戳
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_enhanced_persona_updated ON enhanced_persona_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_persona_quality ON enhanced_persona_profiles(quality_score DESC);

-- ============================================
-- 2. 主动行为事件表
-- ============================================
CREATE TABLE IF NOT EXISTS proactive_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- 事件类型
  event_type TEXT NOT NULL CHECK(event_type IN ('birthday', 'holiday', 'check_in', 'reminder', 'periodic_greeting')),
  
  -- 目标人物 (如果是生日/关系维护)
  target_person TEXT,
  
  -- 触发时间
  trigger_time INTEGER NOT NULL,
  
  -- 生成的消息内容
  message_content TEXT,
  
  -- 发送时间 (NULL表示未发送)
  sent_at INTEGER,
  
  -- 是否收到回复
  response_received BOOLEAN DEFAULT 0,
  
  -- 用户反馈 (positive/negative/neutral)
  user_feedback TEXT,
  
  -- 元数据 (JSON: 事件上下文、生成参数等)
  metadata TEXT,
  
  -- 时间戳
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_proactive_events_trigger ON proactive_events(user_id, trigger_time);
CREATE INDEX IF NOT EXISTS idx_proactive_events_type ON proactive_events(event_type);
CREATE INDEX IF NOT EXISTS idx_proactive_events_sent ON proactive_events(sent_at);

-- ============================================
-- 3. 关系图谱表
-- ============================================
CREATE TABLE IF NOT EXISTS relationship_graph (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_person TEXT NOT NULL,
  
  -- 关系类型
  relationship_type TEXT CHECK(relationship_type IN ('family', 'friend', 'colleague', 'stranger', 'acquaintance')),
  
  -- 互动统计
  interaction_count INTEGER DEFAULT 0,
  avg_sentiment REAL DEFAULT 0.0,        -- 平均情感倾向 (-1到1)
  relationship_strength REAL DEFAULT 0.0, -- 关系强度 (0-1)
  
  -- 最后互动时间
  last_interaction_at INTEGER,
  
  -- 社群标签 (JSON数组: 可能属于多个社群)
  community_labels TEXT,
  
  -- 互动模式 (JSON: {avg_response_time, message_length_ratio, ...})
  interaction_patterns TEXT,
  
  -- 时间戳
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  UNIQUE(user_id, target_person),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_relationship_user ON relationship_graph(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_strength ON relationship_graph(relationship_strength DESC);
CREATE INDEX IF NOT EXISTS idx_relationship_type ON relationship_graph(relationship_type);

-- ============================================
-- 4. 时序行为模式表
-- ============================================
CREATE TABLE IF NOT EXISTS temporal_behavior_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- 模式类型
  pattern_type TEXT NOT NULL CHECK(pattern_type IN ('daily', 'weekly', 'monthly', 'yearly', 'irregular')),
  
  -- 模式描述 (例: "每天早上7点查看邮件")
  pattern_description TEXT NOT NULL,
  
  -- 模式数据 (JSON: 具体的时间、活动、频率等)
  pattern_data TEXT NOT NULL,
  
  -- 置信度 (0-1, 基于统计显著性)
  confidence_score REAL DEFAULT 0.0,
  
  -- 检测时间
  detected_at INTEGER NOT NULL,
  
  -- 最后验证时间 (用于追踪模式是否仍然有效)
  last_verified_at INTEGER,
  
  -- 是否仍然活跃
  is_active BOOLEAN DEFAULT 1,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_temporal_patterns_user ON temporal_behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_temporal_patterns_type ON temporal_behavior_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_temporal_patterns_active ON temporal_behavior_patterns(is_active, confidence_score DESC);

-- ============================================
-- 5. 人格演化历史表 (追踪人格随时间的变化)
-- ============================================
CREATE TABLE IF NOT EXISTS persona_evolution_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- 快照时间
  snapshot_at INTEGER NOT NULL,
  
  -- Big Five 分数快照
  big_five_snapshot TEXT NOT NULL,
  
  -- 变化原因 (例: "新增200条微信数据", "Instagram连接")
  change_reason TEXT,
  
  -- 与上一版本的差异度 (0-1)
  divergence_score REAL DEFAULT 0.0,
  
  -- 质量分数
  quality_score REAL DEFAULT 0.0,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_persona_evolution_user_time ON persona_evolution_history(user_id, snapshot_at DESC);

-- ============================================
-- 6. ML训练任务表 (追踪后台ML训练任务)
-- ============================================
CREATE TABLE IF NOT EXISTS ml_training_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- 任务类型
  job_type TEXT NOT NULL CHECK(job_type IN ('big_five_extraction', 'linguistic_analysis', 'temporal_analysis', 'relationship_graph', 'full_profile')),
  
  -- 任务状态
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'completed', 'failed')),
  
  -- 进度 (0-100)
  progress INTEGER DEFAULT 0,
  
  -- 输入数据量
  input_data_count INTEGER DEFAULT 0,
  
  -- 输出结果 (JSON, 成功后填充)
  output_result TEXT,
  
  -- 错误信息 (失败时填充)
  error_message TEXT,
  
  -- 时间统计
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_ml_jobs_user_status ON ml_training_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ml_jobs_created ON ml_training_jobs(created_at DESC);

-- ============================================
-- 7. 主动消息模板表 (预定义的消息模板)
-- ============================================
CREATE TABLE IF NOT EXISTS proactive_message_templates (
  id TEXT PRIMARY KEY,
  
  -- 模板类型
  template_type TEXT NOT NULL,
  
  -- 模板变量占位符 (例: "生日快乐,{target_name}!")
  template_content TEXT NOT NULL,
  
  -- 适用场景描述
  scenario_description TEXT,
  
  -- 正式程度 (0-1)
  formality_level REAL DEFAULT 0.5,
  
  -- 使用次数
  usage_count INTEGER DEFAULT 0,
  
  -- 用户满意度评分 (1-5)
  avg_rating REAL DEFAULT 0.0,
  
  -- 是否启用
  is_active BOOLEAN DEFAULT 1,
  
  created_at INTEGER NOT NULL
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_templates_type ON proactive_message_templates(template_type, is_active);

-- ============================================
-- 8. 视图: 用户人格摘要 (便于快速查询)
-- ============================================
CREATE VIEW IF NOT EXISTS v_user_persona_summary AS
SELECT 
  ep.user_id,
  ep.version,
  ep.quality_score,
  ep.updated_at,
  json_extract(ep.big_five_scores, '$.openness') as openness,
  json_extract(ep.big_five_scores, '$.extraversion') as extraversion,
  json_extract(ep.cross_platform_consistency, '$.overall') as consistency_score,
  COUNT(DISTINCT rg.id) as relationship_count,
  COUNT(DISTINCT tbp.id) as behavior_pattern_count
FROM enhanced_persona_profiles ep
LEFT JOIN relationship_graph rg ON ep.user_id = rg.user_id
LEFT JOIN temporal_behavior_patterns tbp ON ep.user_id = tbp.user_id AND tbp.is_active = 1
GROUP BY ep.user_id;

-- ============================================
-- 9. 触发器: 自动更新 updated_at
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_enhanced_persona_timestamp
AFTER UPDATE ON enhanced_persona_profiles
FOR EACH ROW
BEGIN
  UPDATE enhanced_persona_profiles
  SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_proactive_events_timestamp
AFTER UPDATE ON proactive_events
FOR EACH ROW
BEGIN
  UPDATE proactive_events
  SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_relationship_graph_timestamp
AFTER UPDATE ON relationship_graph
FOR EACH ROW
BEGIN
  UPDATE relationship_graph
  SET updated_at = (strftime('%s', 'now') * 1000)
  WHERE id = NEW.id;
END;

-- ============================================
-- 10. 初始化数据
-- ============================================

-- 插入默认主动消息模板 (中文)
INSERT OR IGNORE INTO proactive_message_templates (id, template_type, template_content, scenario_description, formality_level, created_at) VALUES
('tmpl_birthday_casual', 'birthday', '生日快乐,{target_name}!🎉 祝你今天开心,新的一岁更精彩!', '随意风格的生日祝福', 0.3, strftime('%s', 'now') * 1000),
('tmpl_birthday_formal', 'birthday', '{target_name},祝您生日快乐!愿新的一岁里心想事成,工作顺利!', '正式风格的生日祝福', 0.8, strftime('%s', 'now') * 1000),
('tmpl_holiday_spring_festival', 'holiday', '新年快乐!🧧 祝{target_name}新的一年身体健康、万事如意!', '春节祝福', 0.5, strftime('%s', 'now') * 1000),
('tmpl_checkin_friend', 'check_in', '嗨{target_name},最近怎么样?好久没聊了,有空出来聚聚!', '朋友周期性问候', 0.3, strftime('%s', 'now') * 1000),
('tmpl_checkin_family', 'check_in', '{target_name},最近一切都好吗?记得多注意身体,有空回家吃饭!', '家人关怀问候', 0.6, strftime('%s', 'now') * 1000);

-- ============================================
-- 11. 性能优化建议
-- ============================================

-- 定期清理旧的演化历史 (保留最近100条)
-- DELETE FROM persona_evolution_history 
-- WHERE id NOT IN (
--   SELECT id FROM persona_evolution_history 
--   ORDER BY snapshot_at DESC LIMIT 100
-- );

-- 定期归档已发送的主动事件 (超过30天)
-- UPDATE proactive_events
-- SET metadata = json_set(metadata, '$.archived', 1)
-- WHERE sent_at < (strftime('%s', 'now') - 2592000) * 1000;

-- ============================================
-- Schema 创建完成
-- ============================================
