import { withUserClient } from '../db/pgClient';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 极简 PG 版样本生成：
 * - 从 documents 读取用户文本（按来源可选过滤）
 * - 将较长的行当作用户消息生成样本
 */
export async function generateTrainingSamplesPg(
  userId: string,
  source: 'instagram' | 'google' | 'wechat' | 'all' = 'all',
  opts: { minQuality?: number; maxSamples?: number } = {}
): Promise<number> {
  return withUserClient(userId, async (c) => {
    const minQuality = opts.minQuality ?? 0.3;
    const limit = 1000;
    const srcFilter = source === 'all' ? '' : 'AND source = $2';
    const params: any[] = [limit];
    if (srcFilter) params.unshift(source);

    const sql = `SELECT id, source, content, metadata, extract(epoch from created_at) * 1000 AS created_at
                 FROM documents
                 WHERE user_id = current_setting('app.user_id', true)
                 ${srcFilter}
                 ORDER BY created_at DESC
                 LIMIT $1`;
    const rows = srcFilter ? await c.query(sql, [source, limit]) : await c.query(sql, [limit]);

    let created = 0;
    for (const row of rows.rows as Array<{ id: string; source: string; content: string; metadata: any; created_at: number }>) {
      const text = (row.content || '').toString();
      const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.length < 6) continue;
        const score = quality(line);
        if (score < minQuality) continue;
        const sampleId = uid('sample');
        await c.query(
          `INSERT INTO personality_training_samples
            (id, user_id, conversation_context, user_response, target_person, timestamp_context,
             emotional_context, source_doc_id, quality_score, used_for_training, created_at)
           VALUES ($1, current_setting('app.user_id', true), $2, $3, $4, to_timestamp($5/1000), $6, $7, $8, 0, now())
           ON CONFLICT (id) DO NOTHING`,
          [
            sampleId,
            JSON.stringify([]),
            line,
            null,
            row.created_at || Date.now(),
            null,
            row.id,
            score,
          ]
        );
        created++;
        if (opts.maxSamples && created >= opts.maxSamples) return created;
      }
    }
    return created;
  });
}

export async function getTrainingSampleStatsPg(userId: string) {
  return withUserClient(userId, async (c) => {
    const total = await c.query(
      `SELECT COUNT(*)::int AS count FROM personality_training_samples WHERE user_id = current_setting('app.user_id', true)`
    );
    const unused = await c.query(
      `SELECT COUNT(*)::int AS count FROM personality_training_samples WHERE user_id = current_setting('app.user_id', true) AND used_for_training = 0`
    );
    const bySource = await c.query(
      `SELECT d.source, COUNT(*)::int AS count
       FROM personality_training_samples pts
       JOIN documents d ON pts.source_doc_id = d.id
       WHERE pts.user_id = current_setting('app.user_id', true)
       GROUP BY d.source`
    );
    const avgQ = await c.query(
      `SELECT COALESCE(AVG(quality_score),0) AS avg FROM personality_training_samples WHERE user_id = current_setting('app.user_id', true)`
    );
    const map: Record<string, number> = {};
    for (const r of bySource.rows as Array<{ source: string; count: number }>) map[r.source] = Number(r.count);
    return { total: Number(total.rows[0]?.count || 0), unused: Number(unused.rows[0]?.count || 0), bySource: map, avgQuality: Number(avgQ.rows[0]?.avg || 0) };
  });
}

function quality(message: string): number {
  let score = 0.5;
  const words = message.split(/\s+/).length;
  if (words >= 5 && words <= 100) score += 0.2;
  if (/[.!?。！？]/.test(message)) score += 0.1;
  if (/(.)\1{4,}/.test(message)) score -= 0.3;
  const emoji = (message.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
  if (emoji > message.length / 2) score -= 0.2;
  return Math.max(0, Math.min(1, score));
}
