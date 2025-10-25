import { spawn } from 'child_process';
import path from 'path';
import type { RerankJob, RerankResult } from '../queues.js';

export async function processRerankJob(job: { data: RerankJob }): Promise<RerankResult> {
  const { query, candidates, model } = job.data;
  return new Promise<RerankResult>((resolve, _reject) => {
    const script = path.join(process.cwd(), 'src/ml/rerank.py');
    const child = spawn('python3', [script], { stdio: 'pipe', env: { ...process.env } });
    let out = '';
    child.stdout.on('data', d => out += d.toString());
    child.stdin.write(JSON.stringify({ query, candidates, model }));
    child.stdin.end();
    child.on('close', () => {
      try {
        const parsed = JSON.parse(out || '{}');
        if (Array.isArray(parsed.scores)) return resolve({ scores: parsed.scores.map((x: any) => Number(x)) });
        return resolve({ scores: new Array(candidates.length).fill(0) });
      } catch {
        return resolve({ scores: new Array(candidates.length).fill(0) });
      }
    });
  });
}
