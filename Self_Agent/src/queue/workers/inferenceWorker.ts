import { spawn } from 'child_process';
import type { InferenceJob, InferenceResult } from '../queues.js';

export async function processInferenceJob(job: { data: InferenceJob }): Promise<InferenceResult> {
  const { userId, pythonScript, stdinPayload, env, timeoutMs } = job.data;
  return new Promise<InferenceResult>((resolve, reject) => {
    const child = spawn('python3', [pythonScript, '--stdin-json'], { stdio: 'pipe', env: { ...process.env, ...env, PYTHONUNBUFFERED: '1' } });
    let out = ''; let err = '';
    const t = timeoutMs ? setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
      reject(new Error(`Inference timeout after ${timeoutMs}ms`));
    }, timeoutMs) : null;

    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => { err += d.toString(); });
    try {
      child.stdin.write(JSON.stringify(stdinPayload));
      child.stdin.end();
    } catch {}

    child.on('close', (code) => {
      if (t) clearTimeout(t);
      if (code === 0) {
        try {
          const parsed = JSON.parse(out || '{}');
          const response = typeof parsed.response === 'string' ? parsed.response : (out || '').trim();
          resolve({ response, metadata: parsed.metadata || {} });
        } catch {
          resolve({ response: (out || '').trim() });
        }
      } else {
        reject(new Error(`Inference failed (code=${code}): ${err || out}`));
      }
    });
  });
}
