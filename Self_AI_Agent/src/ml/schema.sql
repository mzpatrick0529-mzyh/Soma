-- Phase 5: Deep Cognitive Modeling Database Schema
-- Execute this after Phase 0-4 tables are created

-- ============================================================================
-- 1. REASONING CHAINS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reasoning_chains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  chain_type TEXT NOT NULL, -- 'deductive', 'inductive', 'analogical', 'abductive'
  premise TEXT NOT NULL, -- JSON array of premises
  conclusion TEXT NOT NULL,
  confidence REAL DEFAULT 0.5,
  domain TEXT, -- Domain of reasoning (e.g., 'work', 'relationships', 'philosophy')
  source_conversation_id TEXT,
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reasoning_chains_user ON reasoning_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_type ON reasoning_chains(chain_type);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_domain ON reasoning_chains(domain);

-- Store knowledge graph edges
CREATE TABLE IF NOT EXISTS knowledge_graph (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  source_concept TEXT NOT NULL,
  relation_type TEXT NOT NULL, -- 'causes', 'implies', 'contradicts', 'similar_to'
  target_concept TEXT NOT NULL,
  strength REAL DEFAULT 0.5,
  evidence_count INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, source_concept, relation_type, target_concept)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_graph_user ON knowledge_graph(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_source ON knowledge_graph(source_concept);

-- ============================================================================
-- 2. VALUE HIERARCHY
-- ============================================================================
CREATE TABLE IF NOT EXISTS value_hierarchy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  value_name TEXT NOT NULL,
  parent_value_id INTEGER, -- NULL for top-level values
  priority_score REAL DEFAULT 0.5, -- 0-1, higher = more important
  description TEXT,
  conflict_history TEXT, -- JSON array of {value_id, chosen, context, timestamp}
  manifestation_examples TEXT, -- JSON array of conversation examples
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_value_id) REFERENCES value_hierarchy(id)
);

CREATE INDEX IF NOT EXISTS idx_value_hierarchy_user ON value_hierarchy(user_id);
CREATE INDEX IF NOT EXISTS idx_value_hierarchy_parent ON value_hierarchy(parent_value_id);

-- Value conflicts for learning
CREATE TABLE IF NOT EXISTS value_conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  value_a_id INTEGER NOT NULL,
  value_b_id INTEGER NOT NULL,
  chosen_value_id INTEGER NOT NULL,
  context TEXT NOT NULL,
  reasoning TEXT,
  confidence REAL DEFAULT 0.5,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (value_a_id) REFERENCES value_hierarchy(id),
  FOREIGN KEY (value_b_id) REFERENCES value_hierarchy(id),
  FOREIGN KEY (chosen_value_id) REFERENCES value_hierarchy(id)
);

CREATE INDEX IF NOT EXISTS idx_value_conflicts_user ON value_conflicts(user_id);

-- ============================================================================
-- 3. EMOTIONAL STATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS emotional_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- Description of triggering event
  context_factors TEXT, -- JSON object: {time, location, people, activity}
  appraisal_result TEXT NOT NULL, -- JSON: {goal_relevance, goal_congruence, coping_potential, norm_compatibility}
  emotion_type TEXT NOT NULL, -- 'joy', 'anger', 'sadness', 'fear', 'disgust', 'surprise', etc.
  intensity REAL NOT NULL, -- 0-1
  regulation_strategy TEXT, -- 'reappraisal', 'suppression', 'expression', 'distraction'
  expression_output TEXT, -- How emotion was expressed (language markers)
  conversation_id TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_emotional_states_user ON emotional_states(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_type ON emotional_states(emotion_type);
CREATE INDEX IF NOT EXISTS idx_emotional_states_timestamp ON emotional_states(timestamp);

-- Emotional patterns for learning
CREATE TABLE IF NOT EXISTS emotional_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  trigger_pattern TEXT NOT NULL, -- Regex or semantic pattern
  typical_emotion TEXT NOT NULL,
  typical_intensity REAL,
  typical_regulation TEXT,
  occurrence_count INTEGER DEFAULT 1,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, trigger_pattern, typical_emotion)
);

CREATE INDEX IF NOT EXISTS idx_emotional_patterns_user ON emotional_patterns(user_id);

-- ============================================================================
-- 4. THEORY OF MIND
-- ============================================================================
CREATE TABLE IF NOT EXISTS theory_of_mind (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  target_person TEXT NOT NULL, -- Person being modeled
  belief_attribution TEXT NOT NULL, -- JSON: What user thinks target believes
  intent_model TEXT, -- JSON: User's model of target's intentions
  predicted_reaction TEXT, -- What user expects target will do
  actual_outcome TEXT, -- What actually happened (for learning)
  recursion_level INTEGER DEFAULT 1, -- Depth of "I think they think..."
  context TEXT, -- Situational context
  confidence REAL DEFAULT 0.5,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, target_person, context)
);

CREATE INDEX IF NOT EXISTS idx_theory_of_mind_user ON theory_of_mind(user_id);
CREATE INDEX IF NOT EXISTS idx_theory_of_mind_target ON theory_of_mind(target_person);

-- Mental model accuracy tracking
CREATE TABLE IF NOT EXISTS mental_model_accuracy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tom_id INTEGER NOT NULL,
  prediction_type TEXT NOT NULL, -- 'belief', 'intent', 'reaction'
  was_accurate BOOLEAN NOT NULL,
  error_description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tom_id) REFERENCES theory_of_mind(id)
);

CREATE INDEX IF NOT EXISTS idx_mental_model_accuracy_tom ON mental_model_accuracy(tom_id);

-- ============================================================================
-- 5. NARRATIVE IDENTITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS narrative_identity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_date TEXT, -- ISO date or "childhood", "early career", etc.
  event_category TEXT, -- 'education', 'career', 'relationship', 'loss', 'achievement'
  is_turning_point BOOLEAN DEFAULT FALSE,
  meaning_interpretation TEXT, -- How user interprets this event's significance
  identity_impact TEXT, -- How this shaped user's self-concept
  theme_tags TEXT, -- JSON array: ['resilience', 'ambition', 'family_oriented']
  emotional_valence REAL, -- -1 (negative) to 1 (positive)
  related_events TEXT, -- JSON array of related event IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_narrative_identity_user ON narrative_identity(user_id);
CREATE INDEX IF NOT EXISTS idx_narrative_identity_turning_point ON narrative_identity(is_turning_point);
CREATE INDEX IF NOT EXISTS idx_narrative_identity_category ON narrative_identity(event_category);

-- Identity themes extracted from narrative
CREATE TABLE IF NOT EXISTS identity_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  theme_name TEXT NOT NULL, -- 'growth_oriented', 'family_first', 'perfectionist'
  description TEXT,
  strength REAL DEFAULT 0.5, -- How central this theme is
  supporting_events TEXT, -- JSON array of narrative_identity IDs
  contradicting_events TEXT, -- JSON array of events that conflict with theme
  first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, theme_name)
);

CREATE INDEX IF NOT EXISTS idx_identity_themes_user ON identity_themes(user_id);

-- ============================================================================
-- 6. COGNITIVE PROCESSING CACHE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cognitive_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  module_name TEXT NOT NULL, -- 'reasoning', 'values', 'emotions', 'tom', 'narrative'
  input_hash TEXT NOT NULL, -- SHA256 hash of input
  output_data TEXT NOT NULL, -- JSON serialized output
  computation_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- NULL = never expires
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, module_name, input_hash)
);

CREATE INDEX IF NOT EXISTS idx_cognitive_cache_user ON cognitive_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_cache_expires ON cognitive_cache(expires_at);

-- ============================================================================
-- 7. COGNITIVE MODEL METADATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS cognitive_model_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  version TEXT NOT NULL,
  training_data_count INTEGER DEFAULT 0,
  last_trained TIMESTAMP,
  performance_metrics TEXT, -- JSON: {accuracy, precision, recall, etc.}
  model_path TEXT, -- Path to serialized model file
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_cognitive_model_metadata_user ON cognitive_model_metadata(user_id);

-- ============================================================================
-- VIEWS FOR CONVENIENCE
-- ============================================================================

-- Consolidated cognitive profile view
CREATE VIEW IF NOT EXISTS user_cognitive_profile AS
SELECT 
  u.id as user_id,
  (SELECT COUNT(*) FROM reasoning_chains WHERE user_id = u.id) as reasoning_chains_count,
  (SELECT COUNT(*) FROM value_hierarchy WHERE user_id = u.id) as values_count,
  (SELECT COUNT(*) FROM emotional_states WHERE user_id = u.id) as emotional_states_count,
  (SELECT COUNT(*) FROM theory_of_mind WHERE user_id = u.id) as mental_models_count,
  (SELECT COUNT(*) FROM narrative_identity WHERE user_id = u.id) as life_events_count,
  (SELECT COUNT(*) FROM identity_themes WHERE user_id = u.id) as identity_themes_count
FROM users u;
