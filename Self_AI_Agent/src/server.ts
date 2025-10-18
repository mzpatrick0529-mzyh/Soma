import express, { Request, Response } from "express";
import cors from "cors";
import { z } from "zod";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import { config } from "./utils/config";

// Load WeChat decryption key from environment
// Key extracted from macOS WeChat user directory: 687c38f284f0d9c778fb3e1b3492536b
if (!process.env.WECHAT_DB_KEY) {
  process.env.WECHAT_DB_KEY = '687c38f284f0d9c778fb3e1b3492536b';
  console.log('✓ WeChat decryption key loaded from default configuration');
}
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { GeminiStreamProvider } from "./providers/gemini-stream";
import { startTraining, getJob } from "./pipeline/train";
import { MemoryItem, PersonaProfile, ChatGenerateInput, PostGenerateInput } from "./types";
import { getDB, searchByKeyword, getChunksByUser, getUserStats, migrateUserData, getAuthUser, upsertAuthUser, updateAuthProfile, ensureUser, insertDocument, insertChunk, insertVector } from "./db";
import crypto from "crypto";
import { importGoogleTakeout } from "./importers/google";
import { retrieveRelevant, buildContext, retrieveRelevantHybrid } from "./pipeline/rag";
import { buildPersonaProfile, buildPersonaPrompt } from "./pipeline/persona";
import { normalizeText } from "./utils/text";
import uploadRouter from "./routes/upload";
import decryptRouter from "./routes/decrypt";
import multer from "multer";
import { summarizeMediaByPath } from "./utils/media";
import { embedText } from "./pipeline/embeddings";
import {
  getDeduplicationStats,
  deduplicateUserData,
  findDuplicateDocuments,
  findDuplicateChunks,
} from "./utils/deduplication";
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  saveGoogleTokens,
  getGoogleConnectionStatus,
  revokeGoogleConnection,
} from "./services/googleOAuth";
import { syncAllGoogleServices } from "./services/googleSync";
// iCloud 服务按需动态加载，避免在未安装依赖时阻塞启动

const app = express();
app.use(cors({ origin: true, credentials: true }));
// Increase body-parser limit to support large file metadata and JSON payloads
// For actual file uploads, multer handles the streaming separately
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Google Data Import Routes
app.use("/api/google-import", uploadRouter);

// Decryption Service Routes
app.use("/api/decrypt", decryptRouter);

// === iCloud Connect & Sync ===
app.post("/api/icloud/connect", async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string(), appleId: z.string(), appPassword: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    const mod = await import("./services/icloud");
    mod.saveICloudCreds(parsed.data);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/icloud/status", (req: Request, res: Response) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "missing userId" });
  import("./services/icloud").then(mod => {
    res.json(mod.getICloudStatus(userId));
  }).catch((e: any) => res.status(500).json({ error: String(e?.message || e) }));
});

app.post("/api/icloud/sync/mail", async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string(), maxMessages: z.number().optional() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
  const mod = await import("./services/icloud");
    await mod.syncICloudMail(parsed.data.userId, { maxMessages: parsed.data.maxMessages });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/api/icloud/sync/calendar", async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    const mod = await import("./services/icloud");
    const r = await mod.syncICloudCalendar(parsed.data.userId);
    res.json({ ok: true, result: r });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/api/icloud/sync/contacts", async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    const mod = await import("./services/icloud");
    const r = await mod.syncICloudContacts(parsed.data.userId);
    res.json({ ok: true, result: r });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// === Manual media import (photos/videos folder) ===
const MEDIA_MAX_GB = Number(process.env.MAX_UPLOAD_SIZE_GB || process.env.UPLOAD_MAX_GB || 16);
const MEDIA_MAX_BYTES = Math.max(1, Math.min(100, MEDIA_MAX_GB)) * 1024 * 1024 * 1024;
const mediaUpload = multer({ 
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  }),
  limits: { fileSize: MEDIA_MAX_BYTES },
});

app.post("/api/media/import", mediaUpload.single("file"), async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });
    // 对单个媒体文件进行摘要，便于 RAG
    const summary = await summarizeMediaByPath(req.file.path);
    const title = summary.title || req.file.originalname;
    const content = summary.content;
    const docId = `doc_${Math.random().toString(36).slice(2)}${Date.now()}`;
    insertDocument({ id: docId, user_id: parsed.data.userId, source: "media", type: "file", title, content, metadata: { path: req.file.path, media: summary.metadata } });
    const cid = `chk_${Math.random().toString(36).slice(2)}${Date.now()}`;
    insertChunk({ id: cid, doc_id: docId, user_id: parsed.data.userId, idx: 0, text: content, metadata: { path: req.file.path } });
    insertVector(cid, parsed.data.userId, embedText(content));
    res.json({ ok: true, file: req.file.originalname });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// 批量媒体导入（多文件）
app.post("/api/media/import-multiple", mediaUpload.array("files", 200), async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return res.status(400).json({ error: "no files" });
    let count = 0;
    for (const f of files) {
      const summary = await summarizeMediaByPath(f.path);
      const title = summary.title || f.originalname;
      const content = summary.content;
      const docId = `doc_${Math.random().toString(36).slice(2)}${Date.now()}`;
      insertDocument({ id: docId, user_id: parsed.data.userId, source: "media", type: "file", title, content, metadata: { path: f.path, media: summary.metadata } });
      const cid = `chk_${Math.random().toString(36).slice(2)}${Date.now()}`;
      insertChunk({ id: cid, doc_id: docId, user_id: parsed.data.userId, idx: 0, text: content, metadata: { path: f.path } });
      insertVector(cid, parsed.data.userId, embedText(content));
      count++;
    }
    res.json({ ok: true, imported: count });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// 压缩包导入（zip/tgz）：解压后调用通用导入器，自动识别目录中的媒体文件
app.post("/api/media/import-archive", mediaUpload.single("file"), async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });
    const ext = path.extname(req.file.originalname).toLowerCase();
    const extractDir = path.join(path.dirname(req.file.path), `media_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });
    if (ext === ".zip") {
      const { default: uploadRoutes } = await import("./routes/upload");
      // 由于模块循环，这里改为复用轻量解压逻辑：动态引入 extractors 不合适，直接用 yauzl 另行实现会复杂；此处建议前端解压后走 import-multiple
      // 为满足需求，先存档文件入库，标记为archive
      const title = req.file.originalname;
      const content = `Archive uploaded: ${title}\nPath: ${req.file.path}`;
      const docId = `doc_${Math.random().toString(36).slice(2)}${Date.now()}`;
      insertDocument({ id: docId, user_id: parsed.data.userId, source: "media_archive", type: "zip", title, content, metadata: { path: req.file.path } });
      const cid = `chk_${Math.random().toString(36).slice(2)}${Date.now()}`;
      insertChunk({ id: cid, doc_id: docId, user_id: parsed.data.userId, idx: 0, text: content, metadata: { path: req.file.path } });
      insertVector(cid, parsed.data.userId, embedText(content));
      return res.json({ ok: true, archived: true });
    }
    if (ext === ".tgz" || ext === ".gz") {
      const { createReadStream } = await import("fs");
      const { createGunzip } = await import("zlib");
      const { extract } = await import("tar");
      await (await import("stream/promises")).pipeline(
        createReadStream(req.file.path),
        createGunzip(),
        extract({ cwd: extractDir, strip: 1 })
      );
      // 目录导入媒体
      const mod = await import("./services/icloud");
      const result = await mod.importMediaFolder(parsed.data.userId, extractDir);
      return res.json({ ok: true, imported: result.imported });
    }
    return res.status(400).json({ error: "unsupported archive type" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// === Auth routes (simple JWT-like token with HMAC) ===
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || "dev-secret";
function signToken(payload: any): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token: string): any | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const check = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64url");
  if (check !== sig) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
}
function hashPassword(pw: string, salt?: string) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(pw, s, 10000, 32, "sha256").toString("hex");
  return { hash, salt: s };
}

app.post("/auth/register", async (req: Request, res: Response) => {
  const Body = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().optional(), username: z.string().optional() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "invalid body" });
  const { email, password, name, username } = parsed.data;
  const exists = getAuthUser(email);
  if (exists?.password_hash) return res.status(400).json({ success: false, message: "email exists" });
  const { hash, salt } = hashPassword(password);
  upsertAuthUser({ email, name, username, password_hash: hash, password_salt: salt });
  const token = signToken({ email, ts: Date.now() });
  res.json({ success: true, data: { user: { id: email, name: name || email.split("@")[0], email, avatar: exists?.avatar }, token } });
});

app.post("/auth/login", async (req: Request, res: Response) => {
  const Body = z.object({ email: z.string().email(), password: z.string().min(6) });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "invalid body" });
  const { email, password } = parsed.data;
  const user = getAuthUser(email);
  if (!user?.password_hash || !user.password_salt) return res.status(401).json({ success: false, message: "invalid credentials" });
  const { hash } = hashPassword(password, user.password_salt);
  if (hash !== user.password_hash) return res.status(401).json({ success: false, message: "invalid credentials" });
  const token = signToken({ email, ts: Date.now() });
  res.json({ success: true, data: { user: { id: email, name: user.name || email.split("@")[0], email, avatar: user.avatar }, token } });
});

app.post("/auth/logout", (_req: Request, res: Response) => {
  res.json({ success: true, data: {} });
});

app.get("/auth/profile", (req: Request, res: Response) => {
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload?.email) return res.status(401).json({ success: false, message: "unauthorized" });
  const user = getAuthUser(payload.email);
  if (!user) return res.status(404).json({ success: false, message: "not found" });
  res.json({ success: true, data: { id: user.email, name: user.name || user.email.split("@")[0], email: user.email, avatar: user.avatar } });
});

app.put("/user/profile", (req: Request, res: Response) => {
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload?.email) return res.status(401).json({ success: false, message: "unauthorized" });
  const Body = z.object({ name: z.string().optional(), username: z.string().optional(), avatar: z.string().optional() });
  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ success: false, message: "invalid body" });
  updateAuthProfile(payload.email, parsed.data);
  res.json({ success: true, data: { ok: true } });
});

const provider = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  ? new GeminiProvider()
  : new OpenAIProvider();

const streamProvider = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  ? new GeminiStreamProvider()
  : null;

// init DB
getDB();

app.post("/api/self-agent/train", async (req: Request, res: Response) => {
  const Body = z.object({
    userId: z.string(),
    memories: z.array(MemoryItem),
    profile: PersonaProfile.optional(),
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { userId, profile } = parsed.data;
  let { memories } = parsed.data;

  if (!memories.length) {
    const chunks = getChunksByUser(userId).slice(0, 500);
    memories = chunks.map((chunk) => ({
      id: chunk.id,
      type: "text" as const,
      content: chunk.text,
      metadata: chunk.metadata,
      createdAt: chunk.created_at ? new Date(chunk.created_at).toISOString() : undefined,
    }));
  }

  const job = await startTraining(userId, memories, profile, provider);
  res.json(job);
});

app.get("/api/self-agent/status/:jobId", (req: Request, res: Response) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json(job);
});

// Get user stats
app.get("/api/self-agent/stats", (req: Request, res: Response) => {
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  const qp = String(req.query.userId || "");
  const userId = (payload?.email as string | undefined) || qp;
  if (!userId) return res.status(400).json({ error: "missing userId" });
  try {
    const stats = getUserStats(userId);
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Memories timeline (grouped by day, newest first)
app.get("/api/self-agent/memories/timeline", (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    if (!userId) return res.status(400).json({ error: "missing userId" });
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : undefined;

    const db = getDB();
    const baseSql = `
      SELECT c.id, c.doc_id, c.user_id, c.idx, c.text, c.metadata, c.created_at,
             d.source AS doc_source, d.type AS doc_type, d.title AS doc_title
      FROM chunks c
      LEFT JOIN documents d ON d.id = c.doc_id
      WHERE c.user_id = ?
      ${cursor ? "AND c.created_at < ?" : ""}
      ORDER BY c.created_at DESC
      LIMIT ?
    `;

    const rows = (cursor
      ? db.prepare(baseSql).all(userId, cursor, limit)
      : db.prepare(baseSql).all(userId, limit)) as Array<any>;

    const items = rows.map((r) => {
      let meta: any = undefined;
      try { meta = r.metadata ? JSON.parse(r.metadata) : undefined; } catch {}
      return {
        id: r.id as string,
        docId: r.doc_id as string,
        userId: r.user_id as string,
        index: r.idx as number,
        text: r.text as string,
        metadata: meta,
        createdAt: (r.created_at as number) || Date.now(),
        source: (r.doc_source as string) || "google",
        type: (r.doc_type as string) || "text",
        title: (r.doc_title as string) || undefined,
      };
    });

    const groups: Record<string, { title: string; date: string; items: any[] }> = {};
    for (const it of items) {
      const d = new Date(it.createdAt);
      const y = d.getFullYear();
      const m = `${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const day = `${d.getDate().toString().padStart(2, "0")}`;
      const key = `${y}-${m}-${day}`;
      if (!groups[key]) {
        const title = d.toLocaleDateString("zh-CN", { dateStyle: "long" });
        groups[key] = { title, date: key, items: [] };
      }
      groups[key].items.push({
        id: it.id,
        createdAt: it.createdAt,
        category: it.source,
        type: it.type,
        title: it.title || it.text.slice(0, 40),
        excerpt: it.text.slice(0, 140),
        source: it.source,
      });
    }

    const sections = Object.values(groups)
      .sort((a, b) => (a.date > b.date ? -1 : 1));

    const nextCursor = items.length ? items[items.length - 1].createdAt : null;
    res.json({ sections, nextCursor });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Folder list grouped by source/type with small previews
app.get("/api/self-agent/memories/folders", (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    if (!userId) return res.status(400).json({ error: "missing userId" });
    const db = getDB();
    const rows = db.prepare(
      `SELECT COALESCE(d.source,'unknown') AS source, d.type AS type, COUNT(*) AS docs
       FROM documents d
       WHERE d.user_id = ?
       GROUP BY source, type
       ORDER BY docs DESC`
    ).all(userId) as Array<{ source: string; type: string; docs: number }>;

    // take recent 3 items as previews per folder
    const folders = rows.map((r) => {
      const items = db.prepare(
        `SELECT c.id, c.text, c.created_at
         FROM chunks c
         LEFT JOIN documents d ON d.id = c.doc_id
         WHERE c.user_id = ? AND COALESCE(d.source,'unknown') = ?
         ORDER BY c.created_at DESC
         LIMIT 3`
      ).all(userId, r.source) as Array<any>;
      return {
        id: `${r.source}`,
        source: r.source,
        type: r.type || "text",
        count: r.docs,
        previews: items.map(it => ({ id: it.id, excerpt: String(it.text || '').slice(0, 80), createdAt: it.created_at }))
      };
    });
    res.json({ folders });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Items inside a folder (by source), grouped by date
app.get("/api/self-agent/memories/folder/items", (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    const source = String(req.query.source || "");
    if (!userId || !source) return res.status(400).json({ error: "missing userId or source" });
    const limit = Math.min(parseInt(String(req.query.limit || "100"), 10) || 100, 500);
    const db = getDB();
    const rows = db.prepare(
      `SELECT c.id, c.text, c.created_at, d.type AS doc_type, d.title AS doc_title
       FROM chunks c
       LEFT JOIN documents d ON d.id = c.doc_id
       WHERE c.user_id = ? AND COALESCE(d.source,'unknown') = ?
       ORDER BY c.created_at DESC
       LIMIT ?`
    ).all(userId, source, limit) as Array<any>;

    const groups: Record<string, { title: string; date: string; items: any[] }> = {};
    for (const r of rows) {
      const d = new Date((r.created_at as number) || Date.now());
      const y = d.getFullYear();
      const m = `${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const day = `${d.getDate().toString().padStart(2, "0")}`;
      const key = `${y}-${m}-${day}`;
      if (!groups[key]) {
        const title = d.toLocaleDateString("zh-CN", { dateStyle: "long" });
        groups[key] = { title, date: key, items: [] };
      }
      groups[key].items.push({
        id: r.id,
        createdAt: r.created_at,
        category: source,
        type: r.doc_type || "text",
        title: r.doc_title || String(r.text || '').slice(0, 40),
        excerpt: String(r.text || '').slice(0, 140),
      });
    }
    const sections = Object.values(groups).sort((a,b) => (a.date > b.date ? -1 : 1));
    res.json({ sections });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Import Google Takeout data
app.post("/api/self-agent/import/google", async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string(), dir: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const stats = await importGoogleTakeout(parsed.data.userId, parsed.data.dir);
    res.json({ ok: true, stats });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Simple keyword search from DB
app.get("/api/self-agent/search", async (req: Request, res: Response) => {
  const userId = String(req.query.userId || "");
  const q = normalizeText(String(req.query.q || ""));
  if (!userId || !q) return res.status(400).json({ error: "missing userId or q" });
  try {
    const rows = searchByKeyword(userId, q, 20);
    res.json({ items: rows.map(r => ({ id: r.id, doc_id: r.doc_id, text: r.text })) });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Semantic retrieve
app.get("/api/self-agent/retrieve", async (req: Request, res: Response) => {
  const userId = String(req.query.userId || "");
  const q = normalizeText(String(req.query.q || ""));
  const topK = parseInt(String(req.query.topK || "6"), 10) || 6;
  if (!userId || !q) return res.status(400).json({ error: "missing userId or q" });
  try {
    const hits = retrieveRelevant(userId, q, { topK });
    res.json({ items: hits });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// === Chat Generation API (streaming support) ===
app.post("/api/self-agent/generate/chat/stream", async (req: Request, res: Response) => {
  const Body = z.object({
    userId: z.string(),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
    hint: z.string().optional(),
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  // Prefer userId from auth token if available
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  const { history, hint } = parsed.data;
  const userId = (payload?.email as string | undefined) || parsed.data.userId;

  if (!streamProvider) {
    return res.status(501).json({ error: "Streaming not supported with current provider" });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // 1. Build persona profile
  const persona = buildPersonaProfile(userId, { maxChunks: 100 });
    
    // 2. RAG: retrieve relevant context
    const lastUserMessage = [...history].reverse().find((m) => m.role === "user")?.content || "";
    const rawSources = String(req.query.sources || "");
    const sources = rawSources ? rawSources.split(",").map(s => s.trim()).filter(Boolean) : undefined;
    const hits = lastUserMessage
      ? retrieveRelevantHybrid(userId, lastUserMessage, { topK: 6, sources })
      : [];
    const context = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
    
    // 3. Build persona-aware prompt
    const personaPrompt = buildPersonaPrompt(persona, context);
    
    const finalHint = hint
      ? `${personaPrompt}\n\n${hint}`
      : personaPrompt;

  const input: ChatGenerateInput = { userId, history, hint: finalHint };

    // Stream response
    let full = "";
    for await (const chunk of streamProvider.generateChatStream(input)) {
      full += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // 持久化聊天到 Memories（source=chat_self_agent）
    try {
      const docId = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const title = `Chat with Self Agent @ ${new Date().toLocaleString()}`;
      const transcript = history.map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n") + `\nAssistant: ${full}`;
      insertDocument({ id: docId, user_id: userId, source: "chat_self_agent", type: "text", title, content: transcript, metadata: { mode: "stream" } });
      const chunks = transcript.match(/[^\n]{1,1200}/g) || [transcript];
      chunks.forEach((text, idx) => {
        const id = `chk_${Math.random().toString(36).slice(2)}${Date.now()}`;
        insertChunk({ id, doc_id: docId, user_id: userId, idx, text, metadata: { source: "chat_self_agent" } });
        const vec = embedText(text);
        insertVector(id, userId, vec);
      });
    } catch (e) {
      console.warn("[CHAT] persist stream chat failed:", e);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("[SELF] Chat stream error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

app.post("/api/self-agent/generate/chat", async (req: Request, res: Response) => {
  const Body = z.object({
    userId: z.string(),
    messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
    history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
    hint: z.string().optional(),
  });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  const effectiveUserId = (payload?.email as string | undefined) || parsed.data.userId;

  // Accept either messages or history (messages is new format, history is legacy)
  const historyData = parsed.data.messages || parsed.data.history || [];
  const sources = (req.query.sources ? String(req.query.sources) : "").split(",").map(s => s.trim()).filter(Boolean);
  const userMessages = historyData.filter(m => m.role === "user");
  const last = userMessages[userMessages.length - 1]?.content || "";
  
  // 1. Build persona profile
  const persona = buildPersonaProfile(effectiveUserId, { maxChunks: 100 });
  
  // 2. RAG: augment with top-k snippets
  const hits = retrieveRelevantHybrid(effectiveUserId, last, { topK: 6, sources: sources.length ? sources : undefined });
  const ctx = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
  
  // 3. Build persona-aware prompt
  const personaPrompt = buildPersonaPrompt(persona, ctx);
  
  const finalHint = parsed.data.hint
    ? `${personaPrompt}\n\n${parsed.data.hint}`
    : personaPrompt;
  
  const text = await provider.generateChat({ 
    userId: effectiveUserId, 
    history: historyData as Array<{role: "user" | "assistant", content: string}>, 
    hint: finalHint 
  } as ChatGenerateInput);

  // 持久化聊天到 Memories（source=chat_self_agent）
  try {
    const docId = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const title = `Chat with Self Agent @ ${new Date().toLocaleString()}`;
    const transcript = (historyData as Array<{role: "user" | "assistant", content: string}>).map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n") + `\nAssistant: ${text}`;
    insertDocument({ id: docId, user_id: effectiveUserId, source: "chat_self_agent", type: "text", title, content: transcript, metadata: { mode: "non-stream" } });
    const chunks = transcript.match(/[^\n]{1,1200}/g) || [transcript];
    chunks.forEach((c, idx) => {
      const id = `chk_${Math.random().toString(36).slice(2)}${Date.now()}`;
      insertChunk({ id, doc_id: docId, user_id: effectiveUserId, idx, text: c, metadata: { source: "chat_self_agent" } });
      const vec = embedText(c);
      insertVector(id, effectiveUserId, vec);
    });
  } catch (e) {
    console.warn("[CHAT] persist chat failed:", e);
  }

  res.json({ text });
});

// Streaming chat (SSE). We currently generate full text, then stream in chunks.
app.post("/api/self-agent/chat/stream", async (req: Request, res: Response) => {
  try {
    const Body = z.object({
      userId: z.string(),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
      hint: z.string().optional(),
      useContext: z.boolean().optional(),
    });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error.flatten());
      return;
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const effectiveUserId = (payload?.email as string | undefined) || parsed.data.userId;

    // 1. Build persona profile
    const persona = buildPersonaProfile(effectiveUserId, { maxChunks: 100 });
    
    // 2. Build RAG context (only if useContext is true)
    let finalHint = parsed.data.hint;
    if (parsed.data.useContext !== false) {
      const last = parsed.data.history[parsed.data.history.length - 1]?.content || "";
      const sources = (req.query.sources ? String(req.query.sources) : "").split(",").map(s => s.trim()).filter(Boolean);
      const hits = retrieveRelevantHybrid(effectiveUserId, last, { topK: 6, sources: sources.length ? sources : undefined });
      const ctx = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
      
      // 3. Build persona-aware prompt
      const personaPrompt = buildPersonaPrompt(persona, ctx);
      finalHint = parsed.data.hint
        ? `${personaPrompt}\n\n${parsed.data.hint}`
        : personaPrompt;
    }
    
    const finalText = await provider.generateChat({ ...parsed.data, userId: effectiveUserId, hint: finalHint } as ChatGenerateInput);

    // Stream in small chunks
    const chunks = finalText.match(/.{1,60}/g) || [finalText];
    let i = 0;
    const timer = setInterval(() => {
      if (i >= chunks.length) {
        clearInterval(timer);
        res.write(`data: [DONE]\n\n`);
        res.end();
      } else {
        const payload = JSON.stringify({ content: chunks[i] });
        res.write(`data: ${payload}\n\n`);
        i += 1;
      }
    }, 40);
  } catch (e: any) {
    try {
      res.write(`data: ${JSON.stringify({ error: String(e?.message || e) })}\n\n`);
      res.write(`data: [DONE]\n\n`);
    } catch {}
    res.end();
  }
});

app.post("/api/self-agent/generate/post", async (req: Request, res: Response) => {
  const Body = z.object({
    userId: z.string(),
    context: z.string().optional(),
    mediaHint: z.array(z.object({ type: z.string(), content: z.string().optional() })).optional(),
  });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  // RAG: use recent relevant snippets as context
  const base = parsed.data.context || "";
  const hits = retrieveRelevant(parsed.data.userId, base || "个性化动态", { topK: 6 });
  const ctx = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
  const text = await provider.generatePost({ ...parsed.data, context: [base, `上下文:\n${ctx}`].filter(Boolean).join("\n\n") } as PostGenerateInput);
  res.json({ text });
});

app.get("/health", (_req: Request, res: Response) => res.send("ok"));

app.get("/api/self-agent/provider-info", (_req: Request, res: Response) => {
  const isGemini = provider instanceof GeminiProvider;
  res.json({
    provider: provider.name,
    model: isGemini ? config.geminiModel : "openai-stub",
    geminiConfigured: isGemini && Boolean(config.googleKey),
  });
});

app.post("/api/self-agent/provider-info/test", async (req: Request, res: Response) => {
  if (!(provider instanceof GeminiProvider)) {
    return res.status(400).json({ ok: false, provider: provider.name, message: "Gemini provider not configured" });
  }

  const Body = z.object({
    prompt: z.string().default("请简单介绍一下你自己。"),
    userId: z.string().optional(),
  });

  const parsed = Body.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  try {
    const sample = await provider.generateChat({
      userId: parsed.data.userId ?? "diagnostic",
      history: [{ role: "user", content: parsed.data.prompt }],
    });
    res.json({ ok: true, provider: provider.name, model: config.geminiModel, sample });
  } catch (e: any) {
    res.status(500).json({ ok: false, provider: provider.name, model: config.geminiModel, error: String(e?.message || e) });
  }
});

// Admin util: migrate data from one userId to another (useful when switching to email-based id)
app.post("/api/self-agent/admin/migrate-user", (req: Request, res: Response) => {
  const Body = z.object({ from: z.string(), to: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const result = migrateUserData(parsed.data.from, parsed.data.to);
    res.json({ ok: true, result });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Admin: list user stats (documents/chunks/vectors) for all users
app.get("/api/self-agent/admin/user-stats", (_req: Request, res: Response) => {
  try {
    const db = getDB();
    const users = db.prepare("SELECT id FROM users").all() as Array<{ id: string }>;
    const rows = users.map(u => {
      const d = db.prepare("SELECT COUNT(*) AS c FROM documents WHERE user_id = ?").get(u.id) as any;
      const c = db.prepare("SELECT COUNT(*) AS c FROM chunks WHERE user_id = ?").get(u.id) as any;
      const v = db.prepare("SELECT COUNT(*) AS c FROM vectors WHERE user_id = ?").get(u.id) as any;
      return { userId: u.id, documents: d?.c || 0, chunks: c?.c || 0, vectors: v?.c || 0 };
    });
    res.json({ ok: true, items: rows });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// === Data Deduplication APIs ===

/**
 * GET /api/self-agent/deduplication/stats
 * 获取重复数据统计（不执行删除）
 */
app.get("/api/self-agent/deduplication/stats", (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const stats = getDeduplicationStats(userId);
    res.json({ ok: true, stats });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * POST /api/self-agent/deduplication/execute
 * 执行去重操作
 */
app.post("/api/self-agent/deduplication/execute", (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    
    const Body = z.object({
      userId: z.string().optional(),
      dryRun: z.boolean().optional(),
      includeDocs: z.boolean().optional(),
      includeChunks: z.boolean().optional(),
    });
    
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const userId = (payload?.email as string | undefined) || parsed.data.userId;
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const result = deduplicateUserData(userId, {
      dryRun: parsed.data.dryRun ?? false,
      includeDocs: parsed.data.includeDocs ?? true,
      includeChunks: parsed.data.includeChunks ?? true,
    });

    res.json({ ok: true, result });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * GET /api/self-agent/deduplication/preview
 * 预览重复的文档和 chunks
 */
app.get("/api/self-agent/deduplication/preview", (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const type = String(req.query.type || "documents");
    const limit = Math.min(parseInt(String(req.query.limit || "10"), 10) || 10, 100);

    if (type === "documents") {
      const duplicates = findDuplicateDocuments(userId).slice(0, limit);
      res.json({ ok: true, type: "documents", duplicates });
    } else if (type === "chunks") {
      const duplicates = findDuplicateChunks(userId).slice(0, limit);
      res.json({ ok: true, type: "chunks", duplicates });
    } else {
      res.status(400).json({ error: "invalid type, must be 'documents' or 'chunks'" });
    }
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// === Google OAuth & Sync APIs ===

/**
 * GET /api/google-sync/auth-url
 * 生成 Google OAuth 授权 URL
 */
app.get("/api/google-sync/auth-url", (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || "");
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const authUrl = getGoogleAuthUrl(userId);
    res.json({ ok: true, authUrl });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * GET /auth/google/callback
 * Google OAuth 回调处理
 */
app.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    
    if (!code || !state) {
      return res.status(400).send("Missing code or state parameter");
    }

    // state 中包含 userId
    const userId = state;
    
    // 交换 code 获取 tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // 获取用户信息
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info");
    }
    
    const userInfo = await userInfoResponse.json() as any;
    
    // 保存 tokens 和用户信息
    saveGoogleTokens(userId, tokens, userInfo);
    
    // 触发首次同步（异步）
    syncAllGoogleServices(userId).catch(err => {
      console.error("[google-sync] Initial sync failed:", err);
    });
    
    // 重定向回前端
    res.redirect(`http://localhost:8080/settings?google=connected`);
  } catch (e: any) {
    console.error("[auth-callback] Error:", e);
    res.redirect(`http://localhost:8080/settings?google=error&message=${encodeURIComponent(e.message)}`);
  }
});

/**
 * GET /api/google-sync/status
 * 获取 Google 账号连接状态
 */
app.get("/api/google-sync/status", (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || "");
    
    if (!userId) {
      return res.status(400).json({ error: "missing userId" });
    }

    const status = getGoogleConnectionStatus(userId);
    res.json({ ok: true, ...status });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * POST /api/google-sync/trigger
 * 手动触发同步
 */
app.post("/api/google-sync/trigger", async (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string() });
    const parsed = Body.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const userId = parsed.data.userId;
    
    // 检查连接状态
    const status = getGoogleConnectionStatus(userId);
    if (!status.connected) {
      return res.status(400).json({ error: "Google account not connected" });
    }

    // 异步执行同步
    syncAllGoogleServices(userId)
      .then(results => {
        console.log(`[google-sync] Manual sync completed for ${userId}:`, results);
      })
      .catch(err => {
        console.error(`[google-sync] Manual sync failed for ${userId}:`, err);
      });

    res.json({ ok: true, message: "Sync started" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * POST /api/google-sync/revoke
 * 撤销 Google 账号授权
 */
app.post("/api/google-sync/revoke", async (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string() });
    const parsed = Body.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json(parsed.error.flatten());
    }

    const userId = parsed.data.userId;
    await revokeGoogleConnection(userId);
    
    res.json({ ok: true, message: "Google connection revoked" });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Test: seed sample memory data for testing RAG
app.post("/api/self-agent/seed-test-data", (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  const userId = parsed.data.userId;
  
  try {
    ensureUser(userId);
    
    // Sample memories with different types and content
    const samples = [
      {
        id: `doc-test-1-${Date.now()}`,
        title: "我的第一次旅行",
        type: "text",
        content: "去年夏天，我去了北京旅游。参观了故宫和长城，拍了很多照片。天气很热但是非常开心。",
        chunks: ["去年夏天，我去了北京旅游。参观了故宫和长城，拍了很多照片。", "天气很热但是非常开心。北京的美食也很棒，特别是烤鸭。"]
      },
      {
        id: `doc-test-2-${Date.now()}`,
        title: "工作笔记",
        type: "note",
        content: "今天完成了项目的前端开发，使用了 React 和 TypeScript。明天需要优化性能和添加测试。",
        chunks: ["今天完成了项目的前端开发，使用了 React 和 TypeScript。", "明天需要优化性能和添加测试。团队协作很顺利。"]
      },
      {
        id: `doc-test-3-${Date.now()}`,
        title: "家庭聚会照片",
        type: "photo",
        content: "2024年春节家庭聚会的照片，全家人一起吃年夜饭。",
        chunks: ["2024年春节家庭聚会的照片，全家人一起吃年夜饭。", "妈妈做了很多好吃的菜，大家都很开心。"]
      },
      {
        id: `doc-test-4-${Date.now()}`,
        title: "学习笔记 - AI 技术",
        type: "note",
        content: "学习了关于 RAG (Retrieval Augmented Generation) 的知识，它结合了检索和生成。",
        chunks: ["学习了关于 RAG (Retrieval Augmented Generation) 的知识。", "RAG 结合了检索和生成，可以提供更准确的答案。向量数据库很重要。"]
      },
      {
        id: `doc-test-5-${Date.now()}`,
        title: "健身计划",
        type: "text",
        content: "开始每周三次健身，主要是力量训练和有氧运动。目标是增肌和提高体能。",
        chunks: ["开始每周三次健身，主要是力量训练和有氧运动。", "目标是增肌和提高体能。已经坚持了一个月，感觉身体状态变好了。"]
      }
    ];
    
    let totalChunks = 0;
    let totalVectors = 0;
    
    samples.forEach((sample, sampleIdx) => {
      const docId = sample.id;
      insertDocument({
        id: docId,
        user_id: userId,
        source: "test-seed",
        type: sample.type,
        title: sample.title,
        content: sample.content,
        metadata: { seededAt: Date.now(), sampleIndex: sampleIdx },
        created_at: Date.now() - (samples.length - sampleIdx) * 86400000 // stagger by days
      });
      
      sample.chunks.forEach((chunkText, chunkIdx) => {
        const chunkId = `${docId}-chunk-${chunkIdx}`;
        insertChunk({
          id: chunkId,
          doc_id: docId,
          user_id: userId,
          idx: chunkIdx,
          text: chunkText,
          metadata: { chunkIndex: chunkIdx },
          created_at: Date.now() - (samples.length - sampleIdx) * 86400000 + chunkIdx * 1000
        });
        totalChunks++;
        
        const vec = embedText(chunkText);
        insertVector(chunkId, userId, vec);
        totalVectors++;
      });
    });
    
    res.json({ 
      ok: true, 
      message: "Test data seeded successfully",
      stats: {
        documents: samples.length,
        chunks: totalChunks,
        vectors: totalVectors
      }
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.listen(config.port, () => {
  console.log(`[Self_AI_Agent] listening on http://localhost:${config.port}`);
});
