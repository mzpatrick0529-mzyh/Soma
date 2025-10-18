export type ChunkOptions = {
  maxChars?: number;
  overlap?: number;
};

export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const max = Math.max(200, Math.min(2000, opts.maxChars ?? 800));
  const overlap = Math.max(0, Math.min(200, opts.overlap ?? 80));
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + max);
    out.push(text.slice(i, end));
    if (end >= text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return out;
}
