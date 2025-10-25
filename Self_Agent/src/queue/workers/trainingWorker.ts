import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { TrainingJob, TrainingResult } from '../queues.js';

export async function processTrainingJob(job: { data: TrainingJob }): Promise<TrainingResult> {
  const { userId, pythonScript, args, datasetHash, artifactDir, params, env, timeoutMs } = job.data;
  await fs.promises.mkdir(artifactDir, { recursive: true });
  // Persist job params snapshot
  await fs.promises.writeFile(path.join(artifactDir, 'metadata.json'), JSON.stringify({ userId, datasetHash, params, startedAt: Date.now() }, null, 2));

  return new Promise<TrainingResult>((resolve, reject) => {
    const pyArgs = [
      pythonScript,
      '--user-id', userId,
      '--db-path', args.dbPath,
      '--epochs', String(args.epochs),
      '--batch-size', String(args.batchSize),
      '--min-samples', String(args.minSamples)
    ];
    const child = spawn('python3', pyArgs, { stdio: 'pipe', env: { ...process.env, ...env, PYTHONUNBUFFERED: '1' } });

    let out = ''; let err = '';
    const t = timeoutMs ? setTimeout(() => { try { child.kill('SIGKILL'); } catch {}; reject(new Error(`Training timeout after ${timeoutMs}ms`)); }, timeoutMs) : null;

    child.stdout.on('data', d => { const s = d.toString(); out += s; console.log(`[Training ${userId}] ${s.trim()}`); });
    child.stderr.on('data', d => { const s = d.toString(); err += s; console.error(`[Training ${userId}] ${s.trim()}`); });

    child.on('close', async (code) => {
      if (t) clearTimeout(t);
      await fs.promises.writeFile(path.join(artifactDir, 'train.log'), out + (err ? `\n[stderr]\n${err}` : ''));
      if (code === 0) resolve({ ok: true, logs: out });
      else reject(new Error(`Training failed (code=${code}): ${err || out}`));
    });
  });
}
