// Minimal local embedding stub: produces a pseudo-embedding via hashing n-grams
// Replace with real model (OpenAI, local ONNX) later.

function hashStr(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedText(text: string, dim = 1536): number[] {
  const vec = new Float32Array(dim);
  const n = Math.max(1, Math.min(4, Math.floor(text.length / 32) || 2));
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const h = hashStr(text.slice(i, Math.min(text.length, i + n)) + ch);
    vec[h % dim] += 1;
  }
  // l2 normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) vec[i] /= norm;
  return Array.from(vec);
}

export function cosineSim(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
