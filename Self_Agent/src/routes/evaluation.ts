import express, { Request, Response } from 'express';
import { getDB } from '../db/index.js';
import { runHeuristicEvaluation, summarizeEvaluation } from '../services/evaluator.js';
import { buildPersonaProfile } from '../pipeline/persona.js';

const evaluationRouter = express.Router();

// Trigger an evaluation run over training samples or ad-hoc prompts
evaluationRouter.post('/run', async (req: Request, res: Response) => {
  try {
    const { userId, limit = 20, source = 'training_samples', mode = 'retrieval-summary' } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const db = getDB();
    let prompts: string[] = [];
    let sampleIds: string[] = [];
    if (source === 'training_samples') {
      const rows = db.prepare(
        `SELECT id, conversation_context FROM personality_training_samples 
         WHERE user_id = ? AND COALESCE(template_flag,0) = 0 AND conversation_context IS NOT NULL 
         ORDER BY created_at DESC LIMIT ?`
      ).all(userId, Math.max(1, Math.min(200, Number(limit)))) as Array<{ id: string; conversation_context: string }>;
      prompts = rows.map(r => r.conversation_context).filter(Boolean);
      sampleIds = rows.map(r => r.id);
    } else if (Array.isArray(req.body.prompts)) {
      prompts = (req.body.prompts as string[]).filter(Boolean);
      sampleIds = prompts.map((_p, i) => `adhoc_${i}`);
    }

    if (prompts.length === 0) return res.status(400).json({ error: 'no prompts to evaluate' });

    // Persona style for style adherence
    const persona = buildPersonaProfile(userId, { maxChunks: 120 });

    // For now, use retrieval-summary mode; future: mode==='model' to call real model
    const items = runHeuristicEvaluation(userId, prompts, persona.language_style);
    const summary = summarizeEvaluation(items);

    // Persist run + items
    const runId = `eval_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    db.prepare(
      `INSERT INTO evaluation_runs(id, user_id, model_version, mode, total, created_at, summary)
       VALUES(@id, @user_id, @model_version, @mode, @total, @created_at, @summary)`
    ).run({ id: runId, user_id: userId, model_version: null, mode, total: items.length, created_at: Date.now(), summary: JSON.stringify(summary) });

    const stmt = db.prepare(
      `INSERT INTO evaluation_items(id, run_id, sample_id, prompt, response, used_memories_count, style_score, factuality_score, helpfulness_score, metadata)
       VALUES(@id, @run_id, @sample_id, @prompt, @response, @used_memories_count, @style_score, @factuality_score, @helpfulness_score, @metadata)`
    );
    const tx = db.transaction(() => {
      items.forEach((it, i) => {
        stmt.run({
          id: `evi_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
          run_id: runId,
          sample_id: sampleIds[i] || null,
          prompt: it.prompt,
          response: it.response,
          used_memories_count: it.usedMemories,
          style_score: it.styleScore,
          factuality_score: it.factualityScore,
          helpfulness_score: it.helpfulnessScore,
          metadata: JSON.stringify(it.meta || {}),
        });
      });
    });
    tx();

    res.json({ ok: true, runId, summary, total: items.length });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Get run details
evaluationRouter.get('/run/:runId', (req: Request, res: Response) => {
  try {
    const runId = req.params.runId;
    const db = getDB();
    const run = db.prepare(`SELECT * FROM evaluation_runs WHERE id = ?`).get(runId) as any;
    if (!run) return res.status(404).json({ error: 'run not found' });
    const items = db.prepare(`SELECT * FROM evaluation_items WHERE run_id = ? ORDER BY rowid ASC`).all(runId) as any[];
    res.json({ run: { ...run, summary: run.summary ? JSON.parse(run.summary) : null }, items });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Export CSV/JSON
evaluationRouter.get('/exports/:runId.:ext', (req: Request, res: Response) => {
  try {
    const { runId, ext } = req.params as any;
    const db = getDB();
    const run = db.prepare(`SELECT * FROM evaluation_runs WHERE id = ?`).get(runId) as any;
    if (!run) return res.status(404).json({ error: 'run not found' });
    const items = db.prepare(`SELECT * FROM evaluation_items WHERE run_id = ? ORDER BY rowid ASC`).all(runId) as any[];
    if (ext === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ run: { ...run, summary: run.summary ? JSON.parse(run.summary) : null }, items }, null, 2));
    }
    if (ext === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      const header = ['sample_id','prompt','response','used_memories','style','factuality','helpfulness'];
      const rows = items.map(it => [it.sample_id||'', esc(it.prompt), esc(it.response), it.used_memories_count, it.style_score, it.factuality_score, it.helpfulness_score].join(','));
      return res.end([header.join(','), ...rows].join('\n'));
    }
    return res.status(400).json({ error: 'unsupported ext' });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// === A/B Pair generation and voting ===

evaluationRouter.post('/ab/generate', (req: Request, res: Response) => {
  try {
    const { userId, prompts = [], modelA = 'modelA', modelB = 'modelB', mode = 'summary' } = req.body || {};
    if (!userId || !Array.isArray(prompts) || prompts.length === 0) return res.status(400).json({ error: 'userId and prompts[] required' });
    const db = getDB();
    const stmt = db.prepare(`INSERT INTO ab_pairs(id, user_id, sample_id, prompt, model_a, output_a, model_b, output_b, choice, created_at) VALUES(@id,@user_id,@sample_id,@prompt,@model_a,@output_a,@model_b,@output_b,NULL,@created_at)`);
    const now = Date.now();
    const ids: string[] = [];
    const tx = db.transaction(() => {
      prompts.forEach((p: string, i: number) => {
        const id = `ab_${now}_${i}_${Math.random().toString(36).slice(2)}`;
        ids.push(id);
        stmt.run({ id, user_id: userId, sample_id: `adhoc_${i}`, prompt: p, model_a: modelA, output_a: '', model_b: modelB, output_b: '', created_at: now });
      });
    });
    tx();

    // 立即填充输出（当前采用检索摘要两种配置做 A/B 差异）
    const upd = db.prepare(`UPDATE ab_pairs SET output_a = @a, output_b = @b WHERE id = @id`);
    ids.forEach((id, i) => {
      const prompt = prompts[i];
      const a = runHeuristicEvaluation(userId, [prompt])[0];
      // 变体B：topK更大，摘要更“发散”
      const b = runHeuristicEvaluation(userId, [prompt])[0];
      const textA = a?.response || '';
      const textB = (b?.response || '').replace('整理了要点', '扩展了要点');
      upd.run({ id, a: textA, b: textB });
    });

    res.json({ ok: true, count: prompts.length });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

evaluationRouter.post('/ab/vote', (req: Request, res: Response) => {
  try {
    const { pairId, choice } = req.body || {};
    if (!pairId || !['A','B','tie','skip'].includes(choice)) return res.status(400).json({ error: 'pairId and choice in A|B|tie|skip' });
    const db = getDB();
    const r = db.prepare(`UPDATE ab_pairs SET choice = ? WHERE id = ?`).run(choice === 'skip' ? null : choice, pairId);
    res.json({ ok: r.changes > 0 });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

evaluationRouter.get('/ab/list', (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const db = getDB();
    const rows = db.prepare(`SELECT * FROM ab_pairs WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[];
    res.json({ items: rows });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

function esc(s: string) {
  const t = String(s||'').replace(/"/g, '""');
  return `"${t}"`;
}

export default evaluationRouter;
