import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// Types for job payloads/results
export type InferenceJob = {
  userId: string;
  pythonScript: string; // absolute path to personality_inference.py
  stdinPayload: any; // includes personaPrompt, conversationHistory, relevantMemories, message
  env?: Record<string, string>;
  timeoutMs?: number;
};
export type InferenceResult = { response: string; metadata?: any };

export type TrainingJob = {
  userId: string;
  pythonScript: string; // absolute path to personality_trainer.py
  args: {
    epochs: number;
    batchSize: number;
    minSamples: number;
    dbPath: string;
  };
  datasetHash: string;
  artifactDir: string;
  params?: any;
  env?: Record<string, string>;
  timeoutMs?: number;
};
export type TrainingResult = { ok: true; logs?: string };

export type RerankJob = { query: string; candidates: string[]; model?: string };
export type RerankResult = { scores: number[] };

let redis: IORedis | null = null;
let queues: {
  inference?: Queue<InferenceJob, InferenceResult>;
  training?: Queue<TrainingJob, TrainingResult>;
  rerank?: Queue<RerankJob, RerankResult>;
} = {};
let events: { inference?: QueueEvents; training?: QueueEvents; rerank?: QueueEvents } = {};
let workersStarted = false;

function getRedis(): IORedis | null {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL; // prefer standard Redis URL
  if (!url) return null;
  if (!redis) {
    // Upstash provides REST URL which BullMQ doesn't support directly; require redis:// URL.
    // Allow redis[s]://, rediss://, or host/port ENV vars.
    if (url.startsWith('redis://') || url.startsWith('rediss://')) {
      redis = new IORedis(url);
    } else {
      // Fallback: try REDIS_HOST/REDIS_PORT
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      redis = new IORedis({ host, port });
    }
  }
  return redis;
}

export function initQueues() {
  if (queues.inference) return queues; // already inited
  const connection = getRedis();
  if (!connection) {
    console.warn('[Queue] No REDIS_URL provided; BullMQ disabled. Will fall back to in-process execution.');
    queues = {} as any;
    return queues;
  }
  queues.inference = new Queue<InferenceJob, InferenceResult>('inference', { connection });
  queues.training = new Queue<TrainingJob, TrainingResult>('training', { connection });
  queues.rerank = new Queue<RerankJob, RerankResult>('rerank', { connection });

  // Queue events for waitUntilFinished
  events.inference = new QueueEvents('inference', { connection });
  events.training = new QueueEvents('training', { connection });
  events.rerank = new QueueEvents('rerank', { connection });
  return queues;
}

export function startWorkers() {
  if (workersStarted) return;
  const connection = getRedis();
  if (!connection) return; // no redis -> skip

  // Dynamic import processors to avoid circular deps
  const { processInferenceJob } = require('./workers/inferenceWorker.js');
  const { processTrainingJob } = require('./workers/trainingWorker.js');
  const { processRerankJob } = require('./workers/rerankWorker.js');

  const concurrency = Math.max(1, Math.min(os.cpus().length, Number(process.env.QUEUE_CONCURRENCY || 4)));
  new Worker<InferenceJob, InferenceResult>('inference', processInferenceJob, { connection, concurrency });
  new Worker<TrainingJob, TrainingResult>('training', processTrainingJob, { connection, concurrency: 1 }); // training heavy -> 1 per worker
  new Worker<RerankJob, RerankResult>('rerank', processRerankJob, { connection, concurrency: Math.max(1, Math.floor(concurrency / 2)) });

  workersStarted = true;
  console.log(`[Queue] Workers started with concurrency=${concurrency}`);
}

const defaultJobOpts: JobsOptions = {
  attempts: 2,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: { age: 60, count: 1000 },
  removeOnFail: { age: 3600, count: 1000 },
};

export async function enqueueInference(job: InferenceJob, opts: JobsOptions = {}) {
  initQueues();
  if (!queues.inference) {
    // Fallback: run in-process
    const { processInferenceJob } = await import('./workers/inferenceWorker.js');
    return processInferenceJob({ data: job } as any);
  }
  const j = await queues.inference.add('inference', job, { ...defaultJobOpts, ...opts });
  const res = await j.waitUntilFinished(events.inference!);
  return res as InferenceResult;
}

export async function enqueueTraining(job: TrainingJob, opts: JobsOptions = {}) {
  initQueues();
  if (!queues.training) {
    const { processTrainingJob } = await import('./workers/trainingWorker.js');
    return processTrainingJob({ data: job } as any);
  }
  const j = await queues.training.add('training', job, { ...defaultJobOpts, ...opts });
  const res = await j.waitUntilFinished(events.training!);
  return res as TrainingResult;
}

export async function enqueueRerank(job: RerankJob, opts: JobsOptions = {}) {
  initQueues();
  if (!queues.rerank) {
    const { processRerankJob } = await import('./workers/rerankWorker.js');
    return processRerankJob({ data: job } as any);
  }
  const j = await queues.rerank.add('rerank', job, { ...defaultJobOpts, ...opts });
  const res = await j.waitUntilFinished(events.rerank!);
  return res as RerankResult;
}
