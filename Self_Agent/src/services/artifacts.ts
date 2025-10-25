import fs from 'fs';
import path from 'path';
import { getDB } from '../db/index.js';

export function prepareArtifactDir(userId: string, version: string | number) {
  const ts = Date.now();
  const dir = path.join(process.cwd(), 'models', String(userId), String(version), String(ts));
  fs.mkdirSync(dir, { recursive: true });
  return { dir, timestamp: ts };
}

export function recordModelArtifact(userId: string, version: string | number, artifactPath: string, datasetHash: string, params?: any) {
  const db = getDB();
  try {
    db.prepare(`INSERT OR REPLACE INTO model_artifacts(id, user_id, version, timestamp, path, dataset_hash, params, created_at) VALUES(?,?,?,?,?,?,?,?)`).run(
      `${userId}:${version}:${artifactPath}`, userId, String(version), Date.now(), artifactPath, datasetHash, JSON.stringify(params||{}), Date.now()
    );
  } catch {}
}
