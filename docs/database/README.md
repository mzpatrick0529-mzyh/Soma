# Database Documentation

This folder contains all database-related documentation for the Soma project.

## 📚 Contents

### Architecture & Design
- **[DATABASE_ARCHITECTURE_DIAGRAM.md](./DATABASE_ARCHITECTURE_DIAGRAM.md)** - Visual architecture overview
- **[DATABASE_SOLUTION_A_SUPABASE.md](./DATABASE_SOLUTION_A_SUPABASE.md)** - Supabase implementation details
- **[DATABASE_EXECUTIVE_SUMMARY.md](./DATABASE_EXECUTIVE_SUMMARY.md)** - High-level overview for stakeholders

### Setup & Configuration
- **[DATABASE_SETUP_README.md](./DATABASE_SETUP_README.md)** - Step-by-step setup instructions
- **[SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)** - Migration from SQLite to Postgres

### Migration Strategy
- **[DATABASE_MIGRATION_STRATEGY.md](./DATABASE_MIGRATION_STRATEGY.md)** - Comprehensive migration plan
- **[DATABASE_COMPARISON.md](./DATABASE_COMPARISON.md)** - SQLite vs PostgreSQL comparison

### Reference
- **[DATABASE_DOCS_INDEX.md](./DATABASE_DOCS_INDEX.md)** - Complete index of all database documents
- **[DATABASE_ANALYSIS_REPORT.md](./DATABASE_ANALYSIS_REPORT.md)** - Technical analysis and decisions

## 🗄️ Current Architecture

**Primary Database**: Supabase Postgres with pgvector extension

### Key Features
- **Vector Search**: pgvector for semantic similarity (1536-dimensional embeddings)
- **Row-Level Security (RLS)**: User data isolation via `app.user_id` session variable
- **Full-Text Search**: pg_trgm extension for keyword search
- **Automatic Backups**: Supabase managed backups

### Storage Backend Switch
The system supports both SQLite (legacy) and PostgreSQL (current):
- Set `STORAGE_BACKEND=pg` to use Postgres
- Requires `SUPABASE_DB_URL` or `DATABASE_URL` environment variable
- Falls back to SQLite if PG not configured

## 🔧 Quick Setup

### 1. Environment Variables
```bash
STORAGE_BACKEND=pg
SUPABASE_DB_URL=postgresql://user:pass@host:5432/dbname
```

### 2. Run Migrations
```bash
cd Self_AI_Agent
npm run migrate:supabase
```

### 3. Verify Connection
Visit: `http://127.0.0.1:8787/api/self-agent/health`

## 📊 Schema Overview

### Core Tables
- `soma_users` / `users` - User profiles and authentication
- `documents` - Source documents (Google, Instagram, WeChat, etc.)
- `chunks` - Text chunks for RAG retrieval
- `vectors` - Embedding vectors for semantic search

### RLS Policies
All tables enforce user isolation:
```sql
-- Example policy
CREATE POLICY user_isolation ON documents
  FOR ALL
  USING (user_id = current_setting('app.user_id', true));
```

## 🚀 Performance

### Vector Indexing
- **ivfflat**: Fast approximate search (default: 100 lists)
- **hnsw**: Higher accuracy, more memory (optional)

### Maintenance
```bash
# Via API (requires admin token)
POST /api/self-agent/admin/pg/maintenance
```

## 🔍 Troubleshooting

### Connection Issues
1. Verify `SUPABASE_DB_URL` is set correctly
2. Check health endpoint: `/api/self-agent/health`
3. Review backend logs for connection errors

### Performance Issues
1. Ensure vector indices are created (see maintenance endpoint)
2. Run `ANALYZE` on tables after bulk imports
3. Check query plans with `EXPLAIN ANALYZE`

### Migration Issues
See [DATABASE_MIGRATION_STRATEGY.md](./DATABASE_MIGRATION_STRATEGY.md) for detailed troubleshooting.

## 📖 Further Reading

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Related Documentation**:
- [Backend Source: `Self_AI_Agent/src/db/`](../../Self_AI_Agent/src/db/)
- [Operations: `ops/deploy/setup-supabase.sh`](../../ops/deploy/setup-supabase.sh)
