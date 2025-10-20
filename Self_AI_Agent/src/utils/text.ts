export function stripHtml(html: string): string {
  // naive html tag stripper
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Minimal HTML entity decoder (supports common named and numeric entities)
function decodeHtmlEntities(input: string): string {
  if (!input || typeof input !== "string") return input as any;
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00A0",
  };
  return input
    // numeric decimal: &#123;
    .replace(/&#(\d+);/g, (_m, d) => {
      const code = parseInt(d, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _m;
    })
    // numeric hex: &#x1F600;
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _m;
    })
    // common named entities
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in named ? named[name] : m));
}

// Heuristic fix for UTF-8 mojibake like "Ã", "Â", "ð" sequences
function fixUtf8Mojibake(input: string): string {
  if (!input) return input;
  // If many suspicious chars, try latin1->utf8 roundtrip
  const suspicious = (input.match(/[ÃÂðÐœž¢£¥¨©«®±µ¼½¾¿À-ÿ]/g) || []).length;
  if (suspicious < Math.max(3, Math.ceil(input.length / 200))) return input;
  try {
    const candidate = Buffer.from(input, "latin1").toString("utf8");
    // Accept if it reduces suspicious chars or produces more valid astral emojis
    const candSuspicious = (candidate.match(/[ÃÂðÐœž¢£¥¨©«®±µ¼½¾¿À-ÿ]/g) || []).length;
    const emojiCount = (candidate.match(/[\u{1F300}-\u{1FAFF}]/u) || []).length;
    if (candSuspicious <= suspicious || emojiCount > 0) {
      return candidate;
    }
    return input;
  } catch {
    return input;
  }
}

export function normalizeText(text: string): string {
  let t = text || "";
  // 1) decode HTML entities early
  t = decodeHtmlEntities(t);
  // 2) attempt to fix mojibake when detected
  t = fixUtf8Mojibake(t);
  // 3) remove control chars and collapse spaces
  t = t.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return t;
}
