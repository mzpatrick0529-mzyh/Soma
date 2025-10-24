#!/usr/bin/env tsx
/**
 * Migrate data from local SQLite (better-sqlite3) to Supabase Postgres (pg+pgvector)
 *
 * Usage:
 *   tsx scripts/migrate_sqlite_to_supabase.ts \
 *     --sqlite ./self_agent.db \
 *     --pg "postgres://user:pass@host:5432/db" \
 *     --dim 1536 \
 *     --batch 1000
 */
import 'dotenv/config';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

type Args = {
  sqlite: string;
  pg: string;
  dim: number;
  batch: number;
  includeSources?: string[];
  accelerate?: boolean;
  rebuildIndexAtEnd?: boolean;
  targetSuffix?: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string, def?: string) => {
    const i = argv.indexOf(`--${k}`);
    return i >= 0 ? argv[i + 1] : def;
  };
  const sqlite = get('sqlite', process.env.SELF_AGENT_DB || './self_agent.db');
  const pg = get('pg', process.env.SUPABASE_DB_URL || '');
  const dim = parseInt(get('dim', process.env.EMBEDDING_DIM || '1536')!, 10);
  const batch = parseInt((get('batch', '1000') as string), 10);
  const includeSourcesStr = get('include-sources');
  const includeSources = includeSourcesStr ? includeSourcesStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const accelerate = (get('accelerate', 'false') || 'false').toLowerCase() === 'true';
  const rebuildIndexAtEnd = (get('rebuild-index-at-end', 'false') || 'false').toLowerCase() === 'true';
  const targetSuffix = get('target-suffix', '');
  if (!pg) {
    console.error('Missing Postgres URL. Provide --pg or SUPABASE_DB_URL');
    process.exit(1);
  }
  return { sqlite: sqlite!, pg, dim, batch, includeSources, accelerate, rebuildIndexAtEnd, targetSuffix };
}

function bufferToFloat32Array(buf: Buffer): Float32Array {
  // better-sqlite3 stored Float32Array via Buffer.from(new Float32Array(vec).buffer)
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

function vectorToPgLiteral(arr: Float32Array | number[]): string {
  // pgvector text format: '[1,2,3]'
  const vals = Array.from(arr as number[]).map((v) =>
    Number.isFinite(v) ? (Math.round((v as number) * 1e6) / 1e6).toString() : '0'
  );
  return `[${vals.join(',')}]`;
}

async function main() {
  const { sqlite, pg, dim, batch, includeSources, accelerate, rebuildIndexAtEnd, targetSuffix } = parseArgs();
  console.log(`Migrating from SQLite=${sqlite} to PG=${pg}, dim=${dim}, batch=${batch}`);
  if (includeSources && includeSources.length) {
    console.log(`Include sources filter: ${includeSources.join(', ')}`);
  }
  if (accelerate) {
    console.log('Accelerate mode: will drop vector index before migration.');
  }
  const chunksTable = `chunks${targetSuffix || ''}`;
  const vectorsTable = `vectors${targetSuffix || ''}`;
  if (targetSuffix) {
    console.log(`Using target tables: ${chunksTable}, ${vectorsTable}`);
  }

  const sdb = new Database(sqlite);
  // Casting to any to avoid type friction with pg typings in script context
  const pool: any = new Pool({ connectionString: pg, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    // Ensure extensions exist
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Accelerate mode: drop vector index to speed up bulk writes
    if (accelerate) {
      try {
        await client.query('DROP INDEX IF EXISTS idx_chunks_embedding_ivfflat');
        console.log('Dropped index idx_chunks_embedding_ivfflat');
      } catch (e) {
        console.warn('Warning: failed to drop idx_chunks_embedding_ivfflat (may not exist yet):', (e as Error).message);
      }
    }

    // If writing to temp tables with custom dim, ensure they exist
    if (targetSuffix) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${chunksTable} (
          id TEXT PRIMARY KEY,
          doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
          idx INT,
          text TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          embedding VECTOR(${dim}),
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${chunksTable}_user ON ${chunksTable}(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${chunksTable}_doc ON ${chunksTable}(doc_id);`);
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${vectorsTable} (
          chunk_id TEXT PRIMARY KEY REFERENCES ${chunksTable}(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES soma_users(id) ON DELETE CASCADE,
          dim INT NOT NULL,
          vec VECTOR(${dim})
        );
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_${vectorsTable}_user ON ${vectorsTable}(user_id);`);
    }

    // Build reusable SQLite filter fragments and params
    const makeInPlaceholders = (arr: any[]) => arr.map(() => '?').join(',');
    const docsWhere = includeSources && includeSources.length
      ? ` WHERE source IN (${makeInPlaceholders(includeSources)})`
      : '';

    // Determine affected users (when filtering by sources)
    let affectedUserIds: string[] | undefined = undefined;
    if (includeSources && includeSources.length) {
      const rows = sdb.prepare(`SELECT DISTINCT user_id FROM documents${docsWhere}`).all(...includeSources) as { user_id: string }[];
      affectedUserIds = rows.map((r) => r.user_id);
      console.log(`Affected users (by sources): ${affectedUserIds.length}`);
    }

    const totalUsers = affectedUserIds
      ? affectedUserIds.length
      : (sdb.prepare('SELECT COUNT(*) AS c FROM users').get() as any).c as number;
    console.log(`Users: ${totalUsers}`);

    // Users (迁移到 soma_users 表)
    let users: { id: string; created_at?: number }[] = [];
    if (affectedUserIds && affectedUserIds.length) {
      const placeholders = makeInPlaceholders(affectedUserIds);
      users = sdb.prepare(`SELECT id, created_at FROM users WHERE id IN (${placeholders})`).all(...affectedUserIds) as any[];
    } else {
      users = sdb.prepare('SELECT id, created_at FROM users').all() as any[];
    }
    if (users.length) {
      const text = `INSERT INTO soma_users(id, created_at) VALUES ($1, $2)
                    ON CONFLICT (id) DO NOTHING`;
      for (const u of users) {
        await client.query(text, [u.id, u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString()]);
      }
      console.log(`Inserted users: ${users.length}`);
    }

    // Documents
    const docCount = (includeSources && includeSources.length)
      ? (sdb.prepare(`SELECT COUNT(*) AS c FROM documents${docsWhere}`).get(...includeSources) as any).c as number
      : (sdb.prepare('SELECT COUNT(*) AS c FROM documents').get() as any).c as number;
    console.log(`Documents: ${docCount}`);
    let offset = 0;
    while (offset < docCount) {
      let docs: any[] = [];
      if (includeSources && includeSources.length) {
        docs = sdb
          .prepare(`SELECT id, user_id, source, type, title, content, metadata, created_at FROM documents${docsWhere} LIMIT ? OFFSET ?`)
          .all(...includeSources, batch, offset) as any[];
      } else {
        docs = sdb
          .prepare('SELECT id, user_id, source, type, title, content, metadata, created_at FROM documents LIMIT ? OFFSET ?')
          .all(batch, offset) as any[];
      }
      if (docs.length === 0) break;
      const insert = `INSERT INTO documents(id, user_id, source, type, title, content, metadata, created_at)
                      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                      ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, source=EXCLUDED.source, type=EXCLUDED.type,
                        title=EXCLUDED.title, content=EXCLUDED.content, metadata=EXCLUDED.metadata, created_at=EXCLUDED.created_at`;
      for (const d of docs) {
        await client.query(insert, [
          d.id,
          d.user_id,
          d.source || null,
          d.type || null,
          d.title || null,
          d.content || null,
          d.metadata ? JSON.parse(d.metadata) : {},
          d.created_at ? new Date(d.created_at).toISOString() : new Date().toISOString(),
        ]);
      }
      offset += docs.length;
      console.log(`Upserted documents: ${offset}/${docCount}`);
    }

    // Chunks (without embedding first)
    const chunkCount = (includeSources && includeSources.length)
      ? (sdb.prepare(`SELECT COUNT(*) AS c FROM chunks WHERE doc_id IN (SELECT id FROM documents${docsWhere})`).get(...includeSources) as any).c as number
      : (sdb.prepare('SELECT COUNT(*) AS c FROM chunks').get() as any).c as number;
    console.log(`Chunks: ${chunkCount}`);
    offset = 0;
    while (offset < chunkCount) {
      let rows: any[] = [];
      if (includeSources && includeSources.length) {
        rows = sdb
          .prepare(`SELECT id, doc_id, user_id, idx, text, metadata, created_at FROM chunks 
                    WHERE doc_id IN (SELECT id FROM documents${docsWhere}) 
                    LIMIT ? OFFSET ?`)
          .all(...includeSources, batch, offset) as any[];
      } else {
        rows = sdb
          .prepare('SELECT id, doc_id, user_id, idx, text, metadata, created_at FROM chunks LIMIT ? OFFSET ?')
          .all(batch, offset) as any[];
      }
      if (rows.length === 0) break;
      const insert = `INSERT INTO ${chunksTable}(id, doc_id, user_id, idx, text, metadata, created_at)
                      VALUES ($1,$2,$3,$4,$5,$6,$7)
                      ON CONFLICT (id) DO UPDATE SET doc_id=EXCLUDED.doc_id, user_id=EXCLUDED.user_id, idx=EXCLUDED.idx,
                        text=EXCLUDED.text, metadata=EXCLUDED.metadata, created_at=EXCLUDED.created_at`;
      for (const r of rows) {
        await client.query(insert, [
          r.id,
          r.doc_id,
          r.user_id,
          r.idx,
          r.text,
          r.metadata ? JSON.parse(r.metadata) : {},
          r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        ]);
      }
      offset += rows.length;
      console.log(`Upserted chunks: ${offset}/${chunkCount}`);
    }

    // Vectors -> chunks.embedding and vectors(vec)
    const vecCount = (includeSources && includeSources.length)
      ? (sdb.prepare(`SELECT COUNT(*) AS c 
                      FROM vectors v 
                      JOIN chunks c ON c.id = v.chunk_id 
                      JOIN documents d ON d.id = c.doc_id${docsWhere.replace('source', 'd.source')}`).get(...includeSources) as any).c as number
      : (sdb.prepare('SELECT COUNT(*) AS c FROM vectors').get() as any).c as number;
    console.log(`Vectors: ${vecCount}`);
    offset = 0;
    while (offset < vecCount) {
      let rows: { chunk_id: string; user_id: string; dim: number; vec: Buffer }[] = [];
      if (includeSources && includeSources.length) {
        rows = sdb
          .prepare(`SELECT v.chunk_id, v.user_id, v.dim, v.vec 
                    FROM vectors v 
                    JOIN chunks c ON c.id = v.chunk_id 
                    JOIN documents d ON d.id = c.doc_id${docsWhere.replace('source', 'd.source')} 
                    LIMIT ? OFFSET ?`)
          .all(...includeSources, batch, offset) as any[];
      } else {
        rows = sdb
          .prepare('SELECT chunk_id, user_id, dim, vec FROM vectors LIMIT ? OFFSET ?')
          .all(batch, offset) as any[];
      }
      if (rows.length === 0) break;

      for (const v of rows) {
        if (v.dim !== dim) {
          console.warn(`Skip vector with dim=${v.dim} (expected ${dim}) for chunk_id=${v.chunk_id}`);
          continue;
        }
        const f32 = bufferToFloat32Array(v.vec);
        const lit = vectorToPgLiteral(f32);
        // Update chunks.embedding
        await client.query(`UPDATE ${chunksTable} SET embedding = $1::vector WHERE id = $2`, [lit, v.chunk_id]);
        // Upsert compatibility vectors row
        await client.query(
          `INSERT INTO ${vectorsTable}(chunk_id, user_id, dim, vec) VALUES ($1,$2,$3,$4::vector)
           ON CONFLICT (chunk_id) DO UPDATE SET user_id=EXCLUDED.user_id, dim=EXCLUDED.dim, vec=EXCLUDED.vec`,
          [v.chunk_id, v.user_id, v.dim, lit]
        );
      }
      offset += rows.length;
      console.log(`Migrated vectors: ${offset}/${vecCount}`);
    }

    // Training samples
    const tsCount = (includeSources && includeSources.length)
      ? (sdb.prepare(`SELECT COUNT(*) AS c FROM personality_training_samples 
                      WHERE user_id IN (SELECT DISTINCT user_id FROM documents${docsWhere}) 
                         OR (source_doc_id IS NOT NULL AND source_doc_id IN (SELECT id FROM documents${docsWhere}))`)
          .get(...includeSources, ...includeSources) as any).c as number
      : (sdb.prepare('SELECT COUNT(*) AS c FROM personality_training_samples').get() as any).c as number;
    console.log(`Training samples: ${tsCount}`);
    offset = 0;
    while (offset < tsCount) {
      let rows: any[] = [];
      if (includeSources && includeSources.length) {
        rows = sdb
          .prepare(`SELECT id, user_id, conversation_context, user_response, target_person, timestamp_context, emotional_context,
                           source_doc_id, quality_score, used_for_training, created_at
                    FROM personality_training_samples
                    WHERE user_id IN (SELECT DISTINCT user_id FROM documents${docsWhere})
                       OR (source_doc_id IS NOT NULL AND source_doc_id IN (SELECT id FROM documents${docsWhere}))
                    LIMIT ? OFFSET ?`)
          .all(...includeSources, ...includeSources, batch, offset) as any[];
      } else {
        rows = sdb
          .prepare(`SELECT id, user_id, conversation_context, user_response, target_person, timestamp_context, emotional_context,
                           source_doc_id, quality_score, used_for_training, created_at
                    FROM personality_training_samples
                    LIMIT ? OFFSET ?`)
          .all(batch, offset) as any[];
      }
      if (rows.length === 0) break;
      const insert = `INSERT INTO personality_training_samples(
          id, user_id, conversation_context, user_response, target_person, timestamp_context, emotional_context,
          source_doc_id, quality_score, used_for_training, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO UPDATE SET
          user_id=EXCLUDED.user_id,
          conversation_context=EXCLUDED.conversation_context,
          user_response=EXCLUDED.user_response,
          target_person=EXCLUDED.target_person,
          timestamp_context=EXCLUDED.timestamp_context,
          emotional_context=EXCLUDED.emotional_context,
          source_doc_id=EXCLUDED.source_doc_id,
          quality_score=EXCLUDED.quality_score,
          used_for_training=EXCLUDED.used_for_training,
          created_at=EXCLUDED.created_at`;
      for (const r of rows) {
        const ts = r.timestamp_context ? new Date(r.timestamp_context).toISOString() : null;
        const created = r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString();
        await client.query(insert, [
          r.id,
          r.user_id,
          r.conversation_context || null,
          r.user_response || null,
          r.target_person || null,
          ts,
          r.emotional_context || null,
          r.source_doc_id || null,
          r.quality_score ?? null,
          r.used_for_training ?? 0,
          created,
        ]);
      }
      offset += rows.length;
      console.log(`Upserted training_samples: ${offset}/${tsCount}`);
    }

    // Rebuild index at end if requested
    if (rebuildIndexAtEnd) {
      console.log('Rebuilding vector index idx_chunks_embedding_ivfflat ...');
      await client.query('CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat ON chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)');
      await client.query('ANALYZE chunks');
      await client.query('ANALYZE documents');
      console.log('Vector index rebuilt and ANALYZE done.');
    }

    console.log('✅ Migration completed.');
  } finally {
    client.release();
    await pool.end();
    sdb.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
