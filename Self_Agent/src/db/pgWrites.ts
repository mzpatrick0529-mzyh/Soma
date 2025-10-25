import 'dotenv/config';
import { withUserClient } from './pgClient';

export type PgDocRecord = {
  id: string;
  user_id: string;
  source?: string;
  type?: string;
  title?: string;
  content?: string;
  metadata?: any;
  created_at?: string | Date;
};

export type PgChunkRecord = {
  id: string;
  doc_id: string;
  user_id: string;
  idx: number;
  text: string;
  metadata?: any;
  created_at?: string | Date;
  embedding?: number[]; // 1536 dims
};

function toIso(v?: string | Date): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  return v.toISOString();
}

function vectorToPgLiteral(arr: number[]): string {
  // pgvector text format: '[1,2,3]'
  const vals = arr.map((v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : 0));
  return `[${vals.join(',')}]`;
}

export async function ensureUserPg(userId: string) {
  await withUserClient(userId, async (c) => {
    try {
      // Preferred table name used by our earlier schema
      await c.query(
        `INSERT INTO soma_users(id, created_at) VALUES ($1, now())
         ON CONFLICT (id) DO NOTHING`,
        [userId]
      );
    } catch (e: any) {
      // Fallback: some deployments use "users" as the table name
      if (String(e?.message || e).includes('relation') && String(e?.message || e).includes('soma_users')) {
        await c.query(
          `INSERT INTO users(id, created_at) VALUES ($1, now())
           ON CONFLICT (id) DO NOTHING`,
          [userId]
        );
      } else {
        throw e;
      }
    }
  });
}

export async function insertDocumentPg(doc: PgDocRecord) {
  const userId = doc.user_id;
  await withUserClient(userId, async (c) => {
    await c.query(
      `INSERT INTO documents(id, user_id, source, type, title, content, metadata, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         user_id=EXCLUDED.user_id,
         source=EXCLUDED.source,
         type=EXCLUDED.type,
         title=EXCLUDED.title,
         content=EXCLUDED.content,
         metadata=EXCLUDED.metadata,
         created_at=EXCLUDED.created_at`,
      [
        doc.id,
        userId,
        doc.source ?? null,
        doc.type ?? null,
        doc.title ?? null,
        doc.content ?? null,
        doc.metadata ?? {},
        toIso(doc.created_at) ?? new Date().toISOString(),
      ]
    );
  });
}

export async function insertChunkPg(ch: PgChunkRecord) {
  const userId = ch.user_id;
  await withUserClient(userId, async (c) => {
    // Upsert chunk row
    await c.query(
      `INSERT INTO chunks(id, doc_id, user_id, idx, text, metadata, created_at, embedding)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector)
       ON CONFLICT (id) DO UPDATE SET
         doc_id=EXCLUDED.doc_id,
         user_id=EXCLUDED.user_id,
         idx=EXCLUDED.idx,
         text=EXCLUDED.text,
         metadata=EXCLUDED.metadata,
         created_at=EXCLUDED.created_at,
         embedding=EXCLUDED.embedding`,
      [
        ch.id,
        ch.doc_id,
        userId,
        ch.idx,
        ch.text,
        ch.metadata ?? {},
        toIso(ch.created_at) ?? new Date().toISOString(),
        ch.embedding ? vectorToPgLiteral(ch.embedding) : null,
      ]
    );

    if (ch.embedding) {
      // Optional compatibility table upsert
      await c.query(
        `INSERT INTO vectors(chunk_id, user_id, dim, vec)
         VALUES ($1,$2,$3,$4::vector)
         ON CONFLICT (chunk_id) DO UPDATE SET
           user_id=EXCLUDED.user_id,
           dim=EXCLUDED.dim,
           vec=EXCLUDED.vec`,
        [ch.id, userId, ch.embedding.length, vectorToPgLiteral(ch.embedding)]
      );
    }
  });
}
