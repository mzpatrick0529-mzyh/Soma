# Soma - AI-Powered Personal Memory & Social Platform

> 🧠 A next-generation platform combining personal memory management, AI agent assistance, and social networking with privacy-first design.

---

## 🎯 Core Features

### 1. **Personal Memory System** (`Memories`)
- Timeline-based memory storage with folder organization
- Multi-source import (Google Takeout, manual input, photos)
- Vector-based semantic search
- Privacy-controlled memory sharing

### 2. **Self Agent** (AI Assistant)
- **RAG (Retrieval-Augmented Generation)**: Contextual responses based on user memories
- **Persona Simulation**: AI adapts to user's language style, interests, and thinking patterns
- **Memory-Aware Conversations**: References personal experiences naturally
- Powered by Google Gemini 2.5 Flash

### 3. **Social Features**
- **Feed**: Share thoughts, photos, and updates
- **Chat**: One-on-one conversations with Self Agent or contacts
- **Marketplace**: Community-driven content exchange

### 4. **Provider Management**
- Real-time provider diagnostics (Gemini API status)
- Connection health monitoring
- API key management

---

## 📂 Project Structure

```
Soma_V0/
├── Self_AI_Agent/          # Backend API Server (Node.js + Express)
│   ├── src/
│   │   ├── server.ts       # Main API server entry
│   │   ├── db/             # SQLite database layer
│   │   │   └── index.ts    # DB operations (users, documents, chunks, vectors)
│   │   ├── pipeline/       # AI Processing Pipeline
│   │   │   ├── rag.ts      # RAG hybrid retrieval (semantic + time decay)
│   │   │   ├── persona.ts  # Persona extraction & modeling
│   │   │   ├── embeddings.ts  # Vector embeddings (hash-based)
│   │   │   ├── chunk.ts    # Text chunking strategies
│   │   │   └── train.ts    # Future: model fine-tuning
│   │   ├── providers/      # AI Provider Integrations
│   │   │   ├── gemini.ts   # Google Gemini API
│   │   │   ├── gemini-stream.ts  # Streaming support
│   │   │   └── openai.ts   # OpenAI API (fallback)
│   │   ├── importers/      # Data Import Modules
│   │   │   └── google.ts   # Google Takeout parser
│   │   ├── routes/         # Express routes
│   │   │   └── upload.ts   # File upload handlers
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Config, text processing
│   └── package.json
│
├── src/                    # Frontend (React 18 + TypeScript + Vite)
│   ├── App.tsx             # Root app with routing
│   ├── main.tsx            # Entry point
│   ├── components/         # Reusable UI Components
│   │   ├── Layout.tsx      # Main layout with bottom nav
│   │   ├── BottomNav.tsx   # Mobile navigation bar
│   │   ├── ProtectedRoute.tsx  # Auth guard
│   │   ├── MemoryCard.tsx  # Memory display card
│   │   ├── ContentEditor.tsx   # Rich text editor
│   │   └── ui/             # Shadcn/ui components
│   ├── pages/              # Page Components
│   │   ├── AuthPage.tsx    # Login/Register
│   │   ├── MemoriesEnhanced.tsx  # Memory timeline + folders
│   │   ├── SelfAgentChat.tsx     # Chat with Self Agent
│   │   ├── ChatList.tsx    # Conversations list
│   │   ├── FeedNew.tsx     # Social feed
│   │   ├── MarketplaceNew.tsx    # Marketplace
│   │   ├── SettingsNew.tsx       # User settings
│   │   └── ProviderDiagnostics.tsx  # API diagnostics
│   ├── services/           # API Clients
│   │   ├── api.ts          # Generic API wrapper
│   │   ├── selfAgent.ts    # Self Agent endpoints
│   │   ├── streamChat.ts   # SSE streaming chat
│   │   └── memories.ts     # Memory CRUD operations
│   ├── stores/             # State Management (Zustand)
│   │   ├── authStore.ts    # User auth state
│   │   └── appStore.ts     # Global app state
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Utilities (motion, haptics, etc.)
│   └── types/              # Frontend type definitions
│
├── deploy.sh               # Production deployment script
├── verify-deployment.sh    # Health check script
├── start-all.sh            # Development: start frontend + backend
└── package.json            # Root workspace config
```

---

## � Backend Architecture

### Core Modules

#### **1. Database Layer** (`db/index.ts`)
- **SQLite** with `better-sqlite3`
- **Schema**:
  - `users`: User accounts (id, email, password hash, profile)
  - `documents`: Original content (source, type, title, content, created_at)
  - `chunks`: Segmented text pieces (doc_id, text, metadata, position)
  - `vectors`: Embeddings (chunk_id, dim, vec blob, created_at)
- **Operations**: CRUD, search, user stats, migration

#### **2. RAG Pipeline** (`pipeline/`)

**`rag.ts` - Hybrid Retrieval**
```typescript
retrieveRelevantHybrid(userId, query, options)
```
- **Semantic Similarity**: Cosine distance on embeddings
- **Time Decay**: Recent memories weighted higher (30-day half-life)
- **Source Filtering**: Query specific folders/sources
- **Fallback**: Returns recent chunks if no semantic match

**`persona.ts` - Persona Modeling**
```typescript
buildPersonaProfile(userId, options)
buildPersonaPrompt(profile, context)
```
- Extracts: Interests, experiences, language style, thinking patterns
- Generates: Structured system prompt for AI
- **Features**:
  - Keyword frequency analysis
  - Emotion tone detection (positive/negative ratio)
  - Knowledge domain classification
  - Recent activity extraction

**`embeddings.ts` - Vector Generation**
- Hash-based 256-dim vectors (placeholder for production embeddings)
- Normalize & store in SQLite blobs

#### **3. Providers** (`providers/`)

**`gemini-stream.ts` - Streaming AI**
- Server-Sent Events (SSE) for real-time chat
- Supports `generateChatStream()` with history + hints
- Error handling & retry logic

#### **4. API Endpoints** (`server.ts`)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/self-agent/auth/register` | POST | User registration |
| `/api/self-agent/auth/login` | POST | User login (returns token) |
| `/api/self-agent/profile` | GET/PUT | User profile CRUD |
| `/api/self-agent/memories/timeline` | GET | Fetch memory timeline |
| `/api/self-agent/memories/folders` | GET | Get folder structure |
| `/api/self-agent/memories/folder/items` | GET | Fetch items in folder |
| `/api/self-agent/generate/chat` | POST | Non-streaming chat |
| `/api/self-agent/generate/chat/stream` | POST | Streaming chat (SSE) |
| `/api/self-agent/chat/stream` | POST | Legacy streaming chat |
| `/api/self-agent/retrieve` | GET | Semantic search |
| `/api/self-agent/search` | GET | Keyword search |
| `/api/self-agent/stats` | GET | User statistics |
| `/api/self-agent/provider-info` | GET | Gemini status |
| `/health` | GET | Health check |

---

## 🎨 Frontend Architecture

### Technology Stack
- **React 18** with TypeScript
- **Vite** (build tool)
- **TanStack Query** (data fetching)
- **Zustand** (state management)
- **Tailwind CSS** + **Shadcn/ui** (styling)
- **Framer Motion** (animations)

### Key Design Patterns

#### **1. State Management**
```typescript
// authStore.ts - Global user state
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))
```

#### **2. API Integration**
```typescript
// services/streamChat.ts - SSE Streaming
async function* streamChat({ userId, history, hint }) {
  const response = await fetch('/api/self-agent/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ userId, history, hint })
  })
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    // Parse SSE format: data: {...}\n\n
    yield JSON.parse(chunk.slice(6)).text
  }
}
```

#### **3. Responsive Design**
- Mobile-first approach
- Bottom navigation for mobile
- Adaptive layouts (grid → list)
- Touch gestures (swipe, pull-to-refresh)

### Page Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `MemoriesEnhanced` | `/` | Memory timeline with folder view |
| `SelfAgentChat` | `/chat/self` | AI assistant conversation |
| `ChatList` | `/chat` | Conversations overview |
| `FeedNew` | `/feed` | Social feed |
| `MarketplaceNew` | `/marketplace` | Community marketplace |
| `SettingsNew` | `/settings` | User preferences |
| `ProviderDiagnostics` | `/settings/provider` | AI provider health |
| `AuthPage` | `/auth` | Login/Register |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18
- **npm** or **pnpm**
- **Google Gemini API Key** (required)

### 1. Clone & Install

```bash
git clone <repository>
cd Soma_V0

# Install backend dependencies
cd Self_AI_Agent
npm install

# Install frontend dependencies
cd ..
npm install
```

### 2. Configure Environment

Create `Self_AI_Agent/.env`:

```bash
# Required
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional
PORT=8787
AUTH_TOKEN_SECRET=your_secret_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 3. Start Development

#### Option A: Start All at Once
```bash
# From project root
chmod +x start-all.sh
./start-all.sh start

# View logs
./start-all.sh logs

# Stop
./start-all.sh stop
```

#### Option B: Manual Start
```bash
# Terminal 1: Backend (port 8787)
cd Self_AI_Agent
npm run dev

# Terminal 2: Frontend (port 8081)
cd ..
npm run dev
```

### 4. Access Application
- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8787
- **Health Check**: http://localhost:8787/health

---

## 📦 Deployment

### Production Build

```bash
# Build frontend
npm run build

# The deploy.sh script handles:
# 1. Frontend build → dist/
# 2. Backend compilation
# 3. PM2 process management
# 4. Nginx configuration (if needed)

chmod +x deploy.sh
./deploy.sh
```

### Environment Variables (Production)

```bash
# Required
GOOGLE_API_KEY=<production_key>
NODE_ENV=production

# Security
AUTH_TOKEN_SECRET=<strong_random_secret>

# Server
PORT=8787
FRONTEND_PORT=8081

# Optional
LOG_LEVEL=info
```

### Health Monitoring

```bash
# Verify deployment
chmod +x verify-deployment.sh
./verify-deployment.sh

# Expected output:
# ✅ Backend health: OK
# ✅ Frontend reachable
# ✅ Gemini provider: configured
```

---

## 🔑 Key Concepts

### RAG (Retrieval-Augmented Generation)
The system retrieves relevant user memories before generating AI responses, ensuring contextually accurate and personalized replies.

**Flow**:
1. User asks: "What did I learn recently?"
2. Query → `retrieveRelevantHybrid()` → Top 6 relevant memory chunks
3. Build context with persona profile
4. Send to Gemini: `[Persona Prompt] + [Memory Context] + [User Query]`
5. Stream AI response back to user

### Persona Simulation
AI mimics user's personality by analyzing:
- **Interests**: Extracted from memory keywords
- **Language Style**: Formal/casual/technical analysis
- **Thinking Patterns**: Goal-oriented, logical, practical
- **Emotional Tone**: Positive/negative sentiment ratio

**Example Output**:
```
# Without Persona
"According to your memories, you recently studied RAG technology..."

# With Persona
"我最近一直在深入学习 RAG 技术!作为前端开发者,我对这种 AI 技术
特别感兴趣。除了理论学习,我也在用 React 和 TypeScript 做实践项目。"
```

---

## 🛠️ Development Commands

```bash
# Backend
cd Self_AI_Agent
npm run dev              # Start with hot reload
npm run build            # Compile TypeScript
npm run test             # Run tests (if available)

# Frontend
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint check
npm run type-check       # TypeScript validation

# Combined
./start-all.sh start     # Start both services
./start-all.sh stop      # Stop both services
./start-all.sh status    # Check running status
./start-all.sh logs      # Tail logs
./start-all.sh health    # HTTP health checks
```

---

## 📊 Database Schema

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Documents (original content)
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  source TEXT,       -- e.g., 'google-takeout', 'manual', 'photo'
  type TEXT,         -- e.g., 'note', 'photo', 'chat'
  title TEXT,
  content TEXT,
  metadata TEXT,     -- JSON blob
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chunks (segmented text for RAG)
CREATE TABLE chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  position INTEGER,
  metadata TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (doc_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Vectors (embeddings for semantic search)
CREATE TABLE vectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chunk_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  dim INTEGER NOT NULL,
  vec BLOB NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (chunk_id) REFERENCES chunks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_vectors_user ON vectors(user_id);
CREATE INDEX idx_chunks_user ON chunks(user_id);
CREATE INDEX idx_documents_user ON documents(user_id);
```

---

## 🔒 Security & Privacy

- **Authentication**: Token-based (HMAC-SHA256 signed tokens)
- **Password Hashing**: PBKDF2 with salt
- **Data Isolation**: All queries filtered by `user_id`
- **API Key Protection**: `.env` file (never committed)
- **CORS**: Configured for trusted origins only

---

## 🤝 Contributing

This is a private project. For internal development:

1. Create feature branch from `main`
2. Follow TypeScript strict mode
3. Test locally before pushing
4. Update this README if architecture changes

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 8787 is in use
lsof -ti:8787

# Kill existing process
lsof -ti:8787 | xargs kill -9

# Check environment variables
test -f Self_AI_Agent/.env && echo "✅ .env exists" || echo "❌ Missing"
```

### Frontend build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run type-check
```

### Gemini API errors
```bash
# Test provider
curl http://localhost:8787/api/self-agent/provider-info

# Expected output:
# {"provider":"gemini","model":"gemini-2.5-flash-lite","geminiConfigured":true}
```

---

**Last Updated**: 2025-01-13  
**Version**: 1.0.0  
**Maintainer**: Patrick Ma
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/aca0ff55-5042-4b47-a6da-4883d3af84a2) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
