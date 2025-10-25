import 'dotenv/config';
import { getPgPool } from './pgClient';

/**
 * Ensure required extensions and indexes exist for pgvector-based search.
 * Safe to run multiple times. Requires a role with DDL privileges.
 */
export async function ensurePgVectorIndexes(options?: { lists?: number }) {
  const pool = getPgPool();
  const lists = Math.max(1, Math.min(1000, options?.lists ?? 100));
  // DDL shouldn't be blocked by RLS; no need to set app.user_id here.
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // Core indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_user_source ON documents(user_id, source);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chunks_user ON chunks(user_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
  `);
  // Vector index on chunks.embedding
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat
    ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = ${lists});
  `);

  // Optional compatibility table index
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_vectors_user ON vectors(user_id);
  `);
}

/**
 * Run ANALYZE to update planner statistics after bulk ingestion.
 */
export async function analyzePgTables() {
  const pool = getPgPool();
  await pool.query('ANALYZE documents');
  await pool.query('ANALYZE chunks');
  await pool.query('ANALYZE vectors');
}

/**
 * One-shot maintenance: ensure indexes and analyze.
 */
export async function maintainPgVector(options?: { lists?: number }) {
  await ensurePgVectorIndexes(options);
  await analyzePgTables();
}

/**
 * Tune pgvector index parameters.
 * - ivfflat: lists (DDL recreate)
 * - hnsw: m, ef_construction (DDL recreate)
 * Also allows setting session-level ef_search for hnsw.
 */
export async function tunePgVector(opts: { indexType: 'ivfflat' | 'hnsw'; lists?: number; m?: number; efConstruction?: number; efSearch?: number }) {
  const pool = getPgPool();
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
  const idxIvf = 'idx_chunks_embedding_ivfflat';
  const idxHnsw = 'idx_chunks_embedding_hnsw';
  if (opts.indexType === 'ivfflat') {
    const lists = Math.max(4, Math.min(10000, opts.lists ?? 100));
    // Recreate ivfflat index
    await pool.query(`DROP INDEX IF EXISTS ${idxHnsw}`);
    await pool.query(`DROP INDEX IF EXISTS ${idxIvf}`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ${idxIvf} ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = ${lists})`);
  } else {
    const m = Math.max(4, Math.min(64, opts.m ?? 16));
    const efc = Math.max(8, Math.min(512, opts.efConstruction ?? 64));
    await pool.query(`DROP INDEX IF EXISTS ${idxIvf}`);
    await pool.query(`DROP INDEX IF EXISTS ${idxHnsw}`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ${idxHnsw} ON chunks USING hnsw (embedding vector_l2_ops) WITH (m = ${m}, ef_construction = ${efc})`);
    if (typeof opts.efSearch === 'number') {
      const ef = Math.max(8, Math.min(1024, opts.efSearch));
      await pool.query(`SET hnsw.ef_search = ${ef}`);
    }
  }
  await analyzePgTables();
}
