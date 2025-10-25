# Deep Cognitive Modeling (Phase 5)

## Overview
Phase 5 implements the core deep cognitive modeling layer that enables 90%+ human-likeness in digital persona cloning. This is the critical breakthrough from surface pattern matching (60%) to deep psychological understanding.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   TypeScript API Layer                       │
│        (src/routes/cognitiveModeling.ts)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Python ML Service Layer                      │
│                  (src/ml/services/)                          │
├─────────────────────────────────────────────────────────────┤
│  1. ReasoningChainExtractor    - Extract logical patterns   │
│  2. ValueHierarchyBuilder      - Build belief systems       │
│  3. EmotionalReasoningEngine   - Deep emotional modeling    │
│  4. TheoryOfMindModule         - Model mental states        │
│  5. NarrativeIdentityBuilder   - Extract life narrative     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Shared Database (SQLite/PostgreSQL)             │
│  - reasoning_chains    - emotional_states                   │
│  - value_hierarchy     - theory_of_mind                     │
│  - narrative_identity  - cognitive_cache                    │
└─────────────────────────────────────────────────────────────┘
```

## Module Descriptions

### 1. ReasoningChainExtractor (~450 lines)
**Purpose**: Extract and model user's logical reasoning patterns
- **Causal inference**: Identify cause-effect relationships in conversations
- **Reasoning patterns**: Detect deductive/inductive/analogical thinking styles
- **Knowledge graph**: Build user's domain knowledge network
- **Logic habits**: Identify preferred logical shortcuts and heuristics

**Input**: Conversation history, memory database
**Output**: Reasoning chains, logic pattern profiles, knowledge graphs

### 2. ValueHierarchyBuilder (~400 lines)
**Purpose**: Construct user's value system and belief hierarchy
- **Value conflict detection**: Identify value trade-offs in decisions
- **Belief network**: Build interconnected belief system
- **Moral principles**: Extract ethical frameworks
- **Decision weights**: Learn priority ranking of competing values

**Input**: Conversation history, decision points, conflict scenarios
**Output**: Value hierarchy tree, belief graphs, decision weights

### 3. EmotionalReasoningEngine (~500 lines)
**Purpose**: Deep emotional state modeling with full appraisal-regulation pipeline
- **Trigger detection**: Identify emotional triggers in context
- **Appraisal theory**: Model cognitive appraisal of situations
- **Regulation strategies**: Learn emotion regulation patterns
- **Expression mapping**: Context-aware emotional expression

**Input**: Conversations, emotional feedback, relationship context
**Output**: Emotional state trajectories, regulation strategies, expression profiles

### 4. TheoryOfMindModule (~400 lines)
**Purpose**: Model user's mental models of other people
- **Mental state attribution**: Infer user's beliefs about others' beliefs
- **Reaction prediction**: Predict how user thinks others will react
- **Intent understanding**: Model user's interpretation of others' intentions
- **Recursive modeling**: Multi-level "I think they think I think..."

**Input**: Multi-party conversations, relationship profiles
**Output**: Mental model graphs, belief attribution networks

### 5. NarrativeIdentityBuilder (~350 lines)
**Purpose**: Extract and understand user's life narrative and self-concept
- **Life story extraction**: Identify key life events and themes
- **Turning points**: Detect pivotal moments that shaped identity
- **Meaning-making**: Understand how user interprets their experiences
- **Self-concept integration**: Build coherent identity narrative

**Input**: Long-form conversations, memory database, personal stories
**Output**: Narrative timelines, identity themes, meaning frameworks

## Database Schema

```sql
-- Reasoning chains
CREATE TABLE reasoning_chains (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  chain_type TEXT, -- 'deductive', 'inductive', 'analogical'
  premise TEXT,
  conclusion TEXT,
  confidence REAL,
  domain TEXT,
  extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Value hierarchy
CREATE TABLE value_hierarchy (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  value_name TEXT,
  parent_value_id INTEGER,
  priority_score REAL,
  conflict_history TEXT, -- JSON array of conflicts
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emotional states
CREATE TABLE emotional_states (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  trigger_event TEXT,
  appraisal_result TEXT, -- JSON object
  emotion_type TEXT,
  intensity REAL,
  regulation_strategy TEXT,
  expression_output TEXT,
  context_id TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theory of mind
CREATE TABLE theory_of_mind (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_person TEXT,
  belief_attribution TEXT, -- What user thinks target believes
  intent_model TEXT,
  predicted_reaction TEXT,
  recursion_level INTEGER,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Narrative identity
CREATE TABLE narrative_identity (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_description TEXT,
  event_date TEXT,
  is_turning_point BOOLEAN,
  meaning_interpretation TEXT,
  identity_impact TEXT,
  theme_tags TEXT, -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cognitive processing cache
CREATE TABLE cognitive_cache (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  module_name TEXT,
  input_hash TEXT,
  output_data TEXT, -- JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);
```

## API Endpoints (TypeScript Layer)

### Reasoning
- `POST /api/self-agent/cognitive/reasoning/extract` - Extract reasoning chains
- `GET /api/self-agent/cognitive/reasoning/:userId` - Get reasoning patterns
- `POST /api/self-agent/cognitive/reasoning/query` - Query knowledge graph

### Values
- `POST /api/self-agent/cognitive/values/analyze` - Analyze value conflicts
- `GET /api/self-agent/cognitive/values/:userId` - Get value hierarchy
- `POST /api/self-agent/cognitive/values/predict-decision` - Predict decision based on values

### Emotions
- `POST /api/self-agent/cognitive/emotions/analyze` - Analyze emotional state
- `GET /api/self-agent/cognitive/emotions/trajectory/:userId` - Get emotional trajectory
- `POST /api/self-agent/cognitive/emotions/predict-response` - Predict emotional response

### Theory of Mind
- `POST /api/self-agent/cognitive/tom/build-model` - Build mental model of person
- `GET /api/self-agent/cognitive/tom/:userId/:targetPerson` - Get mental model
- `POST /api/self-agent/cognitive/tom/predict-reaction` - Predict how user thinks person will react

### Narrative
- `POST /api/self-agent/cognitive/narrative/extract` - Extract life narrative
- `GET /api/self-agent/cognitive/narrative/:userId` - Get narrative timeline
- `POST /api/self-agent/cognitive/narrative/themes` - Analyze identity themes

## Technology Stack

- **Python 3.9+**: Core ML implementation
- **TypeScript**: API integration layer
- **spaCy**: NLP preprocessing and entity recognition
- **NetworkX**: Graph-based reasoning and belief networks
- **scikit-learn**: Pattern classification and clustering
- **Transformers**: Deep semantic understanding (optional)
- **SQLite/PostgreSQL**: Persistent storage

## Performance Targets

| Metric | Target | Current (Phase 4) |
|--------|--------|-------------------|
| Persona Fitting Depth | 90%+ | 60% |
| Reasoning Accuracy | 85%+ | N/A |
| Emotional Prediction Accuracy | 80%+ | N/A |
| Value Conflict Resolution | 75%+ | N/A |
| Processing Latency | <2s per module | N/A |

## Integration with Previous Phases

Phase 5 enhances previous phases:
- **Phase 3 Context**: Cognitive models provide deeper context understanding
- **Phase 4 Feedback**: Cognitive drift detection identifies belief shifts
- **Persona Profile**: Enriched with reasoning/value/emotional profiles
- **Memory System**: Enhanced with semantic understanding and emotional tagging

## Next Steps

1. Set up Python environment with required dependencies
2. Implement each module sequentially with comprehensive testing
3. Build TypeScript-Python bridge for API integration
4. Create comprehensive documentation and usage examples
5. Validate 90%+ human-likeness target through Turing tests
