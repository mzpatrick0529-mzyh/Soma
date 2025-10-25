import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getDB } from '../db/index.js';

export type DatasetParams = {
  minQuality?: number;
  jaccardThreshold?: number;
  semanticThreshold?: number;
  source?: 'instagram'|'wechat'|'google'|'all';
};

export function computeDatasetHash(userId: string, filter?: DatasetParams): { hash: string; count: number; snapshotPath: string } {
  const db = getDB();
  const where: string[] = ['user_id = ?','COALESCE(template_flag,0) = 0'];
  const params: any[] = [userId];
  if (typeof filter?.minQuality === 'number') { where.push('COALESCE(quality_score,0) >= ?'); params.push(filter.minQuality); }
  // Select sample ids and canonical content fields
  const rows = db.prepare(`SELECT id, COALESCE(style_tags,'') as style_tags, COALESCE(intent_tags,'') as intent_tags, COALESCE(user_response,'') as user_response FROM personality_training_samples WHERE ${where.join(' AND ')} AND used_for_training = 0 ORDER BY id ASC`).all(...params) as any[];
  const canonical = rows.map(r => ({ id: r.id, style_tags: r.style_tags, intent_tags: r.intent_tags, user_response: r.user_response }));
  const json = JSON.stringify(canonical);
  const hash = crypto.createHash('sha256').update(json).digest('hex');
  const root = path.join(process.cwd(), 'datasets', userId, hash);
  fs.mkdirSync(root, { recursive: true });
  const snapshotPath = path.join(root, 'dataset.json');
  fs.writeFileSync(snapshotPath, json);
  // Persist registry tables (if exist)
  try {
    db.prepare(`INSERT OR IGNORE INTO datasets(hash, user_id, count, params, snapshot_path, created_at) VALUES(?,?,?,?,?,?)`).run(hash, userId, rows.length, JSON.stringify(filter||{}), snapshotPath, Date.now());
    const insertItem = db.prepare(`INSERT OR IGNORE INTO dataset_items(dataset_hash, sample_id) VALUES(?,?)`);
    for (const r of rows) insertItem.run(hash, r.id);
  } catch {}
  return { hash, count: rows.length, snapshotPath };
}
