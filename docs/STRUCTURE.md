# Repository Structure Overview

This document explains the updated structure, runtime entry points, and how the frontend and backend connect.

## Top-level
- `src/` — Frontend app (Vite + React + TypeScript)
- `Self_AI_Agent/` — Backend API server (Node + TypeScript, Express)
- `public/` — Static assets served by the frontend
- `docs/` — Documentation (this file, deployment, legal, DB migration, etc.)
- `tools/` — Utility scripts that are not part of the runtime
- `synapse-weave-grid/`, `youware/` — Experimental UI modules/sandboxes

## Backend: Self_AI_Agent
- `src/server.ts` — API server entry (dev: `npm --prefix Self_AI_Agent run dev`) listening on port 8787 by default
- `src/db/` — Database layer: SQLite (legacy) and Postgres (Supabase) helpers
  - `pgClient.ts` — RLS-aware PG client; requires `SUPABASE_DB_URL` or `DATABASE_URL`
  - `pgMaintenance.ts` — pgvector index maintenance utilities
- `src/routes/`, `src/services/`, `src/pipeline/` — API routes, services, RAG/persona/embedding pipeline
- `uploads/` — Temporary uploads (local dev)

Key environment variables:
- `STORAGE_BACKEND`: `pg` to enable Postgres; otherwise falls back to SQLite
- `SUPABASE_DB_URL` or `DATABASE_URL`: Postgres connection string (for `pg`)
- `SELF_AGENT_PORT` (frontend only): Port to proxy to (defaults to `8787`)

Health:
- `GET /api/self-agent/health` — Returns storage mode and PG connectivity state
- `GET /health` — Simple server life check

Admin:
- `POST /api/self-agent/admin/pg/maintenance` — Ensure pgvector indices and ANALYZE (requires admin token)

## Frontend
- Dev server: `npm run dev` (port 8080; host 127.0.0.1)
- Vite proxy: `/api` → `http://127.0.0.1:${SELF_AGENT_PORT || 8787}`
- UI uses English-only formatting (dates use `en-US`)

## Cleanup notes
- One-off test scripts have been deprecated:
  - `Self_AI_Agent/test-server.js`
  - `Self_AI_Agent/test_wechat_decrypt.ts`
  - `Self_AI_Agent/test_wechat_import.mjs`
  These files now throw informative errors if executed to avoid confusion. Remove them entirely if you no longer need the legacy references in documentation.

## How to run
- Start backend: `Tasks: Run Self_AI_Agent dev server` (or `npm --prefix Self_AI_Agent run dev`)
- Start frontend: `Tasks: Run Frontend dev server`
- Open: http://127.0.0.1:8080

## Troubleshooting
- If frontend shows 500s from API endpoints:
  - Visit `http://127.0.0.1:8787/api/self-agent/health` to verify storage and PG connectivity
  - Ensure `STORAGE_BACKEND=pg` only when `SUPABASE_DB_URL`/`DATABASE_URL` is set
  - Confirm Vite proxy targets the right backend port (8787 by default)
