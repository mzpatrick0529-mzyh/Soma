import fg from "fast-glob";
import fs from "fs";
import path from "path";
import { ensureUser, insertDocument, insertChunk, insertVector } from "../db";
import { stripHtml, normalizeText } from "../utils/text";
import { chunkText } from "../pipeline/chunk";
import { embedText } from "../pipeline/embeddings";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

type ImportStats = { files: number; docs: number; chunks: number };

export async function importGoogleTakeout(userId: string, takeoutDir: string): Promise<ImportStats> {
  ensureUser(userId);
  const patterns = [
    path.join(takeoutDir, "**/*.{json,txt,html,mbox}")
  ];
  const entries = await fg(patterns, { dot: false, onlyFiles: true, followSymbolicLinks: false });

  let stats: ImportStats = { files: 0, docs: 0, chunks: 0 };

  for (const file of entries) {
    stats.files += 1;
    const ext = path.extname(file).toLowerCase();
    try {
      let content = "";
      let title = path.basename(file);
      const source = detectSource(file);
      const type = ext.replace(".", "");

      const raw = fs.readFileSync(file, "utf8");
      if (ext === ".json") {
        // Best-effort: try to stringify meaningful fields
        try {
          const obj = JSON.parse(raw);
          content = extractFromJson(obj);
        } catch {
          content = raw;
        }
      } else if (ext === ".html") {
        content = stripHtml(raw);
      } else if (ext === ".mbox") {
        // naive: store as-is; future improvement: parse MIME
        content = raw.slice(0, 2_000_000);
      } else {
        content = raw;
      }

      content = normalizeText(content);
      if (!content) continue;

      const docId = uid("doc");
      insertDocument({ id: docId, user_id: userId, source, type, title, content, metadata: { path: file } });
      stats.docs += 1;

      const chunks = chunkText(content, { maxChars: 1200, overlap: 120 });
      chunks.forEach((text, idx) => {
        const chunkId = uid("chk");
        insertChunk({ id: chunkId, doc_id: docId, user_id: userId, idx, text, metadata: { path: file } });
        const vec = embedText(text);
        insertVector(chunkId, userId, vec);
        stats.chunks += 1;
      });
    } catch (e) {
      // skip file on error but continue
      // eslint-disable-next-line no-console
      console.warn(`[import] skip ${file}:`, e);
      continue;
    }
  }

  return stats;
}

function detectSource(filePath: string): string {
  const p = filePath.toLowerCase();
  if (p.includes("gmail")) return "gmail";
  if (p.includes("drive")) return "drive";
  if (p.includes("calendar")) return "calendar";
  if (p.includes("youtube")) return "youtube";
  if (p.includes("chrome")) return "chrome";
  if (p.includes("maps") || p.includes("location")) return "location";
  if (p.includes("search")) return "search";
  return "google";
}

function extractFromJson(obj: any): string {
  // Try common patterns; fall back to compact string
  if (Array.isArray(obj)) {
    return obj.map((x) => extractFromJson(x)).join("\n");
  }
  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj);
    // preference keys that look like content
    for (const k of ["content", "text", "description", "title", "snippet", "body"]) {
      if (typeof obj[k] === "string") return `${k}: ${obj[k]}`;
    }
    // concatenate simple fields
    const lines: string[] = [];
    for (const k of keys) {
      const v = (obj as any)[k];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        lines.push(`${k}: ${v}`);
      }
    }
    if (lines.length) return lines.join("\n");
  }
  return typeof obj === "string" ? obj : JSON.stringify(obj);
}
