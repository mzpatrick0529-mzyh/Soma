import { enqueueRerank } from '../queue/queues.js';
import { spawn } from 'child_process';
import path from 'path';

export async function rerankWithCrossEncoder(query: string, texts: string[], model?: string): Promise<number[] | null> {
  try {
    if (!process.env.CROSS_ENCODER || process.env.CROSS_ENCODER === '0') return null;
    try {
  const r = await enqueueRerank({ query, candidates: texts, model });
      if (Array.isArray(r?.scores) && r.scores.length === texts.length) return r.scores.map(Number);
    } catch {}
    // Fallback to direct spawn if queue not available
    const script = path.join(process.cwd(), 'src/ml/rerank.py');
    const child = spawn('python3', [script], { stdio: 'pipe', env: { ...process.env } });
    const payload = JSON.stringify({ query, candidates: texts, model });
    let out = ''; let err = '';
    child.stdout.on('data', (d) => out += d.toString());
    child.stderr.on('data', (d) => err += d.toString());
    child.stdin.write(payload);
    child.stdin.end();
    await new Promise((resolve) => child.on('close', () => resolve(true)));
    try {
      const parsed = JSON.parse(out || '{}');
      if (Array.isArray(parsed.scores) && parsed.scores.length === texts.length) return parsed.scores.map(Number);
    } catch {}
    return null;
  } catch {
    return null;
  }
}
