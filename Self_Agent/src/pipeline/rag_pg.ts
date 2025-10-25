import 'dotenv/config';
import { withUserClient } from '../db/pgClient';
import { embedText } from './embeddings';

export type RetrievePgOptions = {
  topK?: number;
};

function vectorToPgLiteral(arr: number[]): string {
  const vals = arr.map((v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : 0));
  return `[${vals.join(',')}]`;
}

export async function retrieveRelevantPg(userId: string, query: string, opts: RetrievePgOptions = {}) {
  const topK = Math.max(1, Math.min(50, opts.topK ?? 6));
  const q = embedText(query, 1536);
  const qlit = vectorToPgLiteral(q);
  return withUserClient(userId, async (c) => {
    const sql = `
      SELECT id, text, (1.0 / (1.0 + (embedding <-> $1::vector))) AS score
      FROM chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <-> $1::vector
      LIMIT $2`;
    const r = await c.query(sql, [qlit, topK]);
    return (r.rows as Array<{ id: string; text: string; score: number }>).map((row) => ({ id: row.id, text: row.text, score: Number(row.score) }));
  });
}

export function buildContextPg(snippets: Array<{ text: string; score: number }>): string {
  const lines = snippets.map((s, i) => `[[#${i + 1} score=${s.score.toFixed(3)}]]\n${s.text}`);
  return lines.join("\n\n");
}
