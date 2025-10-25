import { getChunkWithDoc } from "../db/index.js";

export type Candidate = {
  id: string;
  text: string;
  score: number;
};

export type RerankOptions = {
  preferredSources?: string[]; // 不做硬过滤，仅加权提升
  topK?: number;
};

export type ComposeOptions = {
  maxSnippets?: number; // 最多拼接多少条
  maxCharsPerSnippet?: number; // 每条截断长度
  dedup?: boolean; // 是否去重
};

export type CompressOptions = {
  keepLast?: number; // 保留最近若干轮
  maxChars?: number; // 总长度上限
};

export type SourceIntent = {
  sources: string[];
  confidence: number; // 0..1 简单启发式
};

// 轻量关键词匹配的来源意图识别（可扩展为真正的分类器）
export function detectSourceIntent(query: string): SourceIntent {
  const q = (query || "").toLowerCase();
  const sources = new Set<string>();

  const add = (s: string) => sources.add(s);

  if (/gmail|邮件|收件箱|邮件里|邮箱/.test(q)) add("gmail");
  if (/drive|文档|文件夹|云盘/.test(q)) add("drive");
  if (/photo|相册|照片|图片/.test(q)) add("photos");
  if (/youtube|视频|订阅/.test(q)) add("youtube");
  if (/weixin|wechat|微信|朋友圈|聊天|对话/.test(q)) add("wechat");
  if (/chrome|浏览|历史|书签/.test(q)) add("chrome");
  if (/search|搜索|查过/.test(q)) add("search");
  if (/calendar|日历|会议|日程/.test(q)) add("calendar");

  const s = Array.from(sources);
  const confidence = s.length > 0 ? Math.min(1, 0.6 + s.length * 0.1) : 0.3;
  return { sources: s, confidence };
}

// 简易交叉重排序：
// - 词面重合（Jaccard）
// - 长度正则化
// - 来源偏好加权
export function rerankCandidates(query: string, candidates: Candidate[], opts: RerankOptions = {}): Candidate[] {
  const preferred = (opts.preferredSources || []).map(s => s.toLowerCase());
  const topK = Math.max(1, Math.min(50, opts.topK ?? candidates.length));

  const qTokens = tokenize(query);

  const rescored = candidates.map((c) => {
    const meta = getChunkWithDoc(c.id);
    const src = (meta?.source || "").toLowerCase();
    const j = jaccard(qTokens, tokenize(c.text));
    const len = Math.max(50, Math.min(800, c.text.length));
    const lenNorm = 1 - Math.abs(len - 300) / 300; // 偏向中等长度
    const srcBoost = preferred.includes(src) ? 0.1 : 0.0; // 来源轻微加分
    const score = c.score * 0.7 + j * 0.2 + lenNorm * 0.1 + srcBoost;
    return { ...c, score };
  });

  rescored.sort((a, b) => b.score - a.score);
  return rescored.slice(0, topK);
}

// 生成带引用标注的上下文，顺便去重and截断
export function composeCitedContext(candidates: Candidate[], opts: ComposeOptions = {}) {
  const maxSnippets = Math.max(1, Math.min(12, opts.maxSnippets ?? 6));
  const maxChars = Math.max(80, Math.min(800, opts.maxCharsPerSnippet ?? 260));
  const dedup = opts.dedup ?? true;

  const seen = new Set<string>();
  const lines: string[] = [];
  const citations: Array<{ idx: number; id: string; source?: string; title?: string }> = [];

  let i = 0;
  for (const c of candidates) {
    const norm = normalize(c.text);
    if (dedup && seen.has(norm)) continue;
    seen.add(norm);

    const meta = getChunkWithDoc(c.id);
    i += 1;
    const label = `[#${i} score=${c.score.toFixed(3)} src=${(meta?.source || 'unknown')}${meta?.title ? ` title=${safe(meta.title)}` : ''}]`;
    const body = c.text.slice(0, maxChars).trim();
    lines.push(`${label}\n${body}`);
    citations.push({ idx: i, id: c.id, source: meta?.source, title: meta?.title });
    if (i >= maxSnippets) break;
  }

  return { contextText: lines.join("\n\n"), citations };
}

// 会话压缩：保留最近若干轮，其余合并为要点
export function compressHistory(history: Array<{ role: string; content: string }>, opts: CompressOptions = {}) {
  const keepLast = Math.max(0, Math.min(10, opts.keepLast ?? 4));
  const maxChars = Math.max(200, Math.min(4000, opts.maxChars ?? 1200));

  const recent = history.slice(-keepLast);
  const earlier = history.slice(0, Math.max(0, history.length - keepLast));

  const summary = summarizeTurns(earlier);
  let text = '';
  if (summary) {
    text += `【对话历史要点】\n${summary}\n\n`;
  }
  if (recent.length) {
    text += '【最近对话】\n' + recent.map(t => `${t.role === 'assistant' ? '我' : '对方'}: ${t.content}`)
      .join('\n');
  }
  return text.slice(0, maxChars);
}

// 风格校准（无LLM版本的轻量处理）：
// - 确保第一人称
// - 清理冗余空白
// - 可根据语言风格做一点点句式微调
export function calibrateStyle(answer: string, persona?: { language_style?: string }): string {
  if (!answer) return answer;
  let out = answer.trim().replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  // 若不包含第一人称“我”，在开头补一句过渡
  if (!/[\u6211]/.test(out) && out.length > 6) {
    out = `我来总结一下：` + out;
  }
  // 简洁风格：去掉多余赘述开头
  if (persona?.language_style && /简洁|直接/.test(persona.language_style)) {
    out = out.replace(/^因此|综上所述|总的来说|可以看出[，,:：]?/g, '').trim();
  }
  return out;
}

// ===== 工具函数 =====

function tokenize(text: string): Set<string> {
  return new Set((text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const uni = a.size + b.size - inter;
  return inter / Math.max(1, uni);
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function safe(text: string): string {
  return text.replace(/[\n\r\t]/g, ' ').slice(0, 80);
}

// 将较早的多轮对话压缩为要点摘要（启发式）
function summarizeTurns(turns: Array<{ role: string; content: string }>): string {
  if (!turns || turns.length === 0) return '';
  const bullets: string[] = [];
  for (const t of turns.slice(-20)) { // 最多看回20条
    const c = (t.content || '').replace(/\s+/g, ' ').trim();
    if (!c) continue;
    // 捕捉包含计划/问题/结论等关键词的语句
    if (/(计划|想要|希望|问题|如何|需要|结论|结果|决定|下一步|总结)/.test(c)) {
      bullets.push(`- ${t.role === 'assistant' ? '我' : '对方'}: ${c.slice(0, 120)}`);
    }
  }
  // 回退：抽取每隔几条的一句
  if (bullets.length < 3) {
    for (let i = 0; i < turns.length; i += 3) {
      const c = (turns[i].content || '').replace(/\s+/g, ' ').trim();
      if (c) bullets.push(`- ${turns[i].role === 'assistant' ? '我' : '对方'}: ${c.slice(0, 100)}`);
      if (bullets.length >= 5) break;
    }
  }
  return bullets.join('\n');
}
