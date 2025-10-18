import { embedText, cosineSim } from "./embeddings";
import { getVectorsByUser, getChunkText, getChunkWithDoc, getRecentChunksByUser } from "../db";

export type RetrieveOptions = {
  topK?: number;
  minScore?: number;
};

export function retrieveRelevant(userId: string, query: string, opts: RetrieveOptions = {}) {
  const topK = Math.max(1, Math.min(50, opts.topK ?? 6));
  const minScore = Math.max(-1, Math.min(1, opts.minScore ?? 0.1));

  const q = embedText(query);
  const rows = getVectorsByUser(userId);
  const scored = rows.map((r) => {
    const vec = new Float32Array(r.vec.buffer, r.vec.byteOffset, r.dim);
    const score = cosineSim(q, Array.from(vec));
    return { chunkId: r.chunk_id, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((s) => s.score >= minScore).slice(0, topK);
  return picked.map((p) => ({ id: p.chunkId, score: p.score, text: getChunkText(p.chunkId) }));
}

export function buildContext(snippets: Array<{ text: string; score: number }>): string {
  const lines = snippets.map((s, i) => `[[#${i + 1} score=${s.score.toFixed(3)}]]\n${s.text}`);
  return lines.join("\n\n");
}

export type HybridOptions = {
  topK?: number;
  minScore?: number;
  sources?: string[]; // filter by document source (e.g., ["gmail","drive"]) 
  recentBoost?: number; // 0..1 additional bonus for recent items
};

// Retrieve relevant with optional source filter and recent-time boost
export function retrieveRelevantHybrid(userId: string, query: string, opts: HybridOptions = {}) {
  const topK = Math.max(1, Math.min(50, opts.topK ?? 6));
  const minScore = Math.max(-1, Math.min(1, opts.minScore ?? 0.1));
  const sources = opts.sources && opts.sources.length ? opts.sources.map(s => s.toLowerCase()) : null;
  const recentBoost = Math.max(0, Math.min(1, opts.recentBoost ?? 0.15));

  const q = embedText(query);
  const rows = getVectorsByUser(userId);

  const now = Date.now();
  const scored = rows.map((r) => {
    const meta = getChunkWithDoc(r.chunk_id);
    if (sources && meta && !sources.includes(String(meta.source || '').toLowerCase())) {
      return { chunkId: r.chunk_id, score: -Infinity };
    }
    const vec = new Float32Array(r.vec.buffer, r.vec.byteOffset, r.dim);
    let score = cosineSim(q, Array.from(vec));
    if (meta?.createdAt) {
      const days = Math.max(0, (now - meta.createdAt) / (1000 * 60 * 60 * 24));
      const decay = 1 / (1 + days / 30); // 30天半衰近似
      score = score * (1 - recentBoost) + decay * recentBoost * score;
    }
    return { chunkId: r.chunk_id, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((s) => s.score >= minScore && isFinite(s.score)).slice(0, topK);
  if (!picked.length) {
    // fallback: return a few recent chunks if semantic match fails
    const recent = getRecentChunksByUser(userId, topK, sources || undefined);
    return recent.map((r) => ({ id: r.id, score: 0.05, text: r.text }));
  }
  return picked.map((p) => ({ id: p.chunkId, score: p.score, text: getChunkText(p.chunkId) }));
}
