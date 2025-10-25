import { buildPersonaProfile } from "../pipeline/persona.js";
import { retrieveRelevantHybrid } from "../pipeline/rag.js";
import { composeCitedContext } from "../pipeline/rag_enhance.js";

export type EvalItem = {
  prompt: string;
  response: string;
  usedMemories: number;
  styleScore: number;
  factualityScore: number;
  helpfulnessScore: number;
  meta?: any;
};

// === Heuristic evaluators ===

export function evaluateStyle(answer: string, personaStyle: string | undefined): number {
  const a = (answer || '').toLowerCase();
  const style = (personaStyle || '').toLowerCase();
  let score = 0.5;
  // 第一人称与语气
  if (/\u6211/.test(answer)) score += 0.15;
  if (/简洁|直接/.test(style)) {
    const len = answer.length;
    if (len > 40 && len < 600) score += 0.1; else score -= 0.05;
  }
  if (/专业|理性|技术/.test(style)) {
    if (/(因为|所以|因此|步骤|方案|建议|原因)/.test(a)) score += 0.1;
  }
  if (/情感|温和|亲切|自然/.test(style)) {
    if (/(我觉得|可以试试|不妨|建议你)/.test(a)) score += 0.05;
  }
  return clamp(score, 0, 1);
}

export function evaluateFactuality(answer: string, snippets: Array<{ text: string }>): number {
  const toks = tokens(answer);
  if (toks.size === 0) return 0.3;
  let best = 0;
  for (const s of snippets) {
    const j = jaccard(toks, tokens(s.text));
    if (j > best) best = j;
  }
  // 将Jaccard映射到[0,1]，并轻微放大
  return clamp(best * 1.4, 0, 1);
}

export function evaluateHelpfulness(answer: string): number {
  const a = (answer || '').trim();
  if (!a) return 0.2;
  let score = 0.4;
  const len = a.length;
  if (len > 60) score += 0.15; // 足够信息量
  if (/(建议|可以|步骤|首先|然后|最后|因此|比如)/.test(a)) score += 0.2; // 可操作+连贯词
  if (/(不知道|无法|不能|没有信息)/.test(a)) score -= 0.2; // 消极
  if (/(总结|要点|关键是)/.test(a)) score += 0.05;
  return clamp(score, 0, 1);
}

// === Batch runner using retrieval-summary fallback ===

export function generateRetrievalSummary(userId: string, prompt: string, opts: { topK?: number } = {}) {
  const topK = Math.max(1, Math.min(8, opts.topK ?? 4));
  const results = retrieveRelevantHybrid(userId, prompt, { topK });
  const composed = composeCitedContext(results.map(r => ({ id: r.id, text: r.text, score: r.score })));
  // 简短的基于检索的摘要
  const bullets = composed.contextText.split('\n\n').slice(0, 3).map((b) => {
    const body = b.split('\n').slice(1).join(' ');
    return `- ${body.slice(0, 180)}`;
  }).join('\n');
  const response = `根据你的问题，我从记忆中整理了要点：\n${bullets}\n\n（以上内容来自已检索到的相关片段）`;
  return { response, snippets: results.map(r => ({ text: r.text })) };
}

export function runHeuristicEvaluation(userId: string, prompts: string[], personaStyle?: string): EvalItem[] {
  const items: EvalItem[] = [];
  for (const p of prompts) {
    const { response, snippets } = generateRetrievalSummary(userId, p, { topK: 4 });
    const styleScore = evaluateStyle(response, personaStyle);
    const factualityScore = evaluateFactuality(response, snippets);
    const helpfulnessScore = evaluateHelpfulness(response);
    items.push({ prompt: p, response, usedMemories: snippets.length, styleScore, factualityScore, helpfulnessScore });
  }
  return items;
}

export function summarizeEvaluation(items: EvalItem[]) {
  const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length));
  return {
    total: items.length,
    style: avg(items.map(i => i.styleScore)),
    factuality: avg(items.map(i => i.factualityScore)),
    helpfulness: avg(items.map(i => i.helpfulnessScore)),
  };
}

// ===== utils =====

function clamp(x: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, x)); }
function tokens(text: string): Set<string> {
  return new Set((text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0; for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
