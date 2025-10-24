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
import { getDB, searchByKeyword, getChunksByUser, getUserStats, getUserAvailableSources, migrateUserData, getAuthUser, upsertAuthUser, updateAuthProfile, ensureUser, insertDocument, insertChunk, insertVector } from "./db";
import crypto from "crypto";
import { importGoogleTakeout } from "./importers/google";
import { retrieveRelevant, buildContext, retrieveRelevantHybrid } from "./pipeline/rag";
import { buildPersonaProfile, buildPersonaPrompt } from "./pipeline/persona";
import { normalizeText } from "./utils/text";
import uploadRouter from "./routes/upload";
import decryptRouter from "./routes/decrypt";
import { createUserModelRoutes } from "./routes/userModel";
import trainingRouter from "./routes/training";
import chatInferenceRouter from "./routes/chatInference";
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
import { extractInstagramJson } from "./importers/instagram";
import { chunkText } from "./pipeline/chunk";
import { withUserClient, healthcheck } from "./db/pgClient";
import { maintainPgVector } from "./db/pgMaintenance";
// iCloud service loaded on-demand to avoid blocking startup when dependencies are not installed

const app = express();
app.use(cors({ origin: true, credentials: true }));
// Increase body-parser limit to support large file metadata and JSON payloads
// For actual file uploads, multer handles the streaming separately
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

const apiRouter = express.Router();

// Storage backend switch (guard against missing connection string)
const pgConn = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const USE_PG = ((process.env.STORAGE_BACKEND || "").toLowerCase() === "pg") && Boolean(pgConn);
if ((process.env.STORAGE_BACKEND || "").toLowerCase() === "pg" && !pgConn) {
  console.warn("[BOOT] STORAGE_BACKEND=pg but missing SUPABASE_DB_URL/DATABASE_URL; falling back to SQLite runtime.");
}

// Mount all routes onto apiRouter
apiRouter.use("/google-import", uploadRouter);
apiRouter.use("/decrypt", decryptRouter);
apiRouter.use("/user-model", createUserModelRoutes());
apiRouter.use("/self-agent/training", trainingRouter);
apiRouter.use("/self-agent/chat", chatInferenceRouter);

// === PG Vector Index Maintenance (admin) ===
apiRouter.post("/self-agent/admin/pg/maintenance", async (req: Request, res: Response) => {
  try {
    if (!USE_PG) return res.status(400).json({ error: "STORAGE_BACKEND != pg" });
    const token = String(req.header('x-admin-token') || '');
    const expected = String(process.env.ADMIN_TOKEN || '');
    if (expected && token !== expected) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const lists = Number(req.query.lists || 100);
    await maintainPgVector({ lists: Number.isFinite(lists) ? lists : 100 });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// === Health endpoint (storage + PG connectivity) ===
apiRouter.get("/self-agent/health", async (_req: Request, res: Response) => {
  try {
    const pgConfigured = Boolean(pgConn);
    let pgConnected: boolean | null = null;
    if (USE_PG && pgConfigured) {
      try { pgConnected = await healthcheck(); } catch { pgConnected = false; }
    }
    res.json({ ok: true, storage: USE_PG ? "pg" : "sqlite", pg: { configured: pgConfigured, connected: pgConnected } });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// === iCloud Connect & Sync ===
apiRouter.post("/icloud/connect", async (req: Request, res: Response) => {
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

apiRouter.get("/icloud/status", (req: Request, res: Response) => {
  const userId = String(req.query.userId || "");
  if (!userId) return res.status(400).json({ error: "missing userId" });
  import("./services/icloud").then(mod => {
    res.json(mod.getICloudStatus(userId));
  }).catch((e: any) => res.status(500).json({ error: String(e?.message || e) }));
});

apiRouter.post("/icloud/sync/mail", async (req: Request, res: Response) => {
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

apiRouter.post("/icloud/sync/calendar", async (req: Request, res: Response) => {
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

apiRouter.post("/icloud/sync/contacts", async (req: Request, res: Response) => {
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

apiRouter.post("/media/import", mediaUpload.single("file"), async (req: Request, res: Response) => {
  const Body = z.object({ userId: z.string() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid body" });
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });
    // Summarize single media file for RAG
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

// Batch media import (multiple files)
apiRouter.post("/media/import-multiple", mediaUpload.array("files", 200), async (req: Request, res: Response) => {
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

// Archive import (zip/tgz): Extract and call generic importer, auto-detect media files in directory
apiRouter.post("/media/import-archive", mediaUpload.single("file"), async (req: Request, res: Response) => {
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
      // Due to module circular dependency, reuse lightweight extraction logic here: dynamic import of extractors is inappropriate, implementing with yauzl directly would be complex; recommend frontend extract then use import-multiple
      // To meet requirements, first store archive file in database, mark as archive
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
      // Import media from directory
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

apiRouter.post("/auth/register", async (req: Request, res: Response) => {
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

apiRouter.post("/auth/login", async (req: Request, res: Response) => {
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

apiRouter.post("/auth/logout", (_req: Request, res: Response) => {
  res.json({ success: true, data: {} });
});

apiRouter.get("/auth/profile", (req: Request, res: Response) => {
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = token ? verifyToken(token) : null;
  if (!payload?.email) return res.status(401).json({ success: false, message: "unauthorized" });
  const user = getAuthUser(payload.email);
  if (!user) return res.status(404).json({ success: false, message: "not found" });
  res.json({ success: true, data: { id: user.email, name: user.name || user.email.split("@")[0], email: user.email, avatar: user.avatar } });
});

apiRouter.put("/user/profile", (req: Request, res: Response) => {
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

apiRouter.post("/self-agent/train", async (req: Request, res: Response) => {
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

apiRouter.get("/self-agent/status/:jobId", (req: Request, res: Response) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "job not found" });
  res.json(job);
});

// Get user stats
apiRouter.get("/self-agent/stats", (req: Request, res: Response) => {
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
apiRouter.get("/self-agent/memories/timeline", async (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    if (!userId) return res.status(400).json({ error: "missing userId" });
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : undefined;
    let rows: Array<any> = [];

    if (USE_PG) {
      await withUserClient(userId, async (c) => {
        const params: any[] = [userId];
        let sql = `
          SELECT c.id, c.doc_id, c.user_id, c.idx, c.text, c.metadata, c.created_at,
                 d.source AS doc_source, d.type AS doc_type, d.title AS doc_title
          FROM chunks c
          LEFT JOIN documents d ON d.id = c.doc_id
          WHERE c.user_id = $1
        `;
        if (cursor) {
          sql += ` AND c.created_at < $2`;
          params.push(new Date(cursor).toISOString());
        }
        sql += ` ORDER BY c.created_at DESC LIMIT ${limit}`;
        const r = await c.query(sql, params);
        rows = r.rows as any[];
      });
    } else {
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
      rows = (cursor
        ? db.prepare(baseSql).all(userId, cursor, limit)
        : db.prepare(baseSql).all(userId, limit)) as Array<any>;
    }

    const items = rows.map((r) => {
      let meta: any = undefined;
      try {
        if (r.metadata && typeof r.metadata === 'string') meta = JSON.parse(r.metadata);
        else if (r.metadata) meta = r.metadata;
      } catch {}
      const createdAt = typeof r.created_at === 'number' ? r.created_at : new Date(r.created_at).getTime();
      return {
        id: r.id as string,
        docId: r.doc_id as string,
        userId: r.user_id as string,
        index: r.idx as number,
        text: r.text as string,
        metadata: meta,
        createdAt: createdAt || Date.now(),
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
  const title = d.toLocaleDateString("en-US", { dateStyle: "long" });
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
apiRouter.get("/self-agent/memories/folders", async (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    if (!userId) return res.status(400).json({ error: "missing userId" });
    let folders: Array<any> = [];
    if (USE_PG) {
      await withUserClient(userId, async (c) => {
        const r1 = await c.query(
          `SELECT COALESCE(d.source,'unknown') AS source, COALESCE(d.type,'text') AS type, COUNT(*) AS docs
           FROM documents d
           WHERE d.user_id = $1
           GROUP BY COALESCE(d.source,'unknown'), COALESCE(d.type,'text')
           ORDER BY COUNT(*) DESC`,
          [userId]
        );
        const rows = r1.rows as Array<{ source: string; type: string; docs: number }>;
        const tmp: any[] = [];
        for (const r of rows) {
          const r2 = await c.query(
            `SELECT c.id, c.text, c.created_at
             FROM chunks c
             LEFT JOIN documents d ON d.id = c.doc_id
             WHERE c.user_id = $1 AND COALESCE(d.source,'unknown') = $2
             ORDER BY c.created_at DESC
             LIMIT 3`,
            [userId, r.source]
          );
          const items = r2.rows as any[];
          tmp.push({
            id: `${r.source}`,
            source: r.source,
            type: r.type || "text",
            count: Number(r.docs) || 0,
            previews: items.map(it => ({ id: it.id, excerpt: String(it.text || '').slice(0, 80), createdAt: typeof it.created_at === 'number' ? it.created_at : new Date(it.created_at).getTime() }))
          });
        }
        folders = tmp;
      });
    } else {
      const db = getDB();
      const rows = db.prepare(
        `SELECT COALESCE(d.source,'unknown') AS source, d.type AS type, COUNT(*) AS docs
         FROM documents d
         WHERE d.user_id = ?
         GROUP BY source, type
         ORDER BY docs DESC`
      ).all(userId) as Array<{ source: string; type: string; docs: number }>;

      // take recent 3 items as previews per folder
      folders = rows.map((r) => {
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
    }
    res.json({ folders });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Items inside a folder (by source), grouped by date
apiRouter.get("/self-agent/memories/folder/items", async (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    const source = String(req.query.source || "");
    if (!userId || !source) return res.status(400).json({ error: "missing userId or source" });
    const limit = Math.min(parseInt(String(req.query.limit || "100"), 10) || 100, 500);
    let rows: Array<any> = [];
    if (USE_PG) {
      await withUserClient(userId, async (c) => {
        const r = await c.query(
          `SELECT c.id, c.doc_id, c.text, c.created_at, d.type AS doc_type, d.title AS doc_title
           FROM chunks c
           LEFT JOIN documents d ON d.id = c.doc_id
           WHERE c.user_id = $1 AND COALESCE(d.source,'unknown') = $2
           ORDER BY c.created_at DESC
           LIMIT ${limit}`,
          [userId, source]
        );
        rows = r.rows as any[];
      });
    } else {
      const db = getDB();
      rows = db.prepare(
        `SELECT c.id, c.doc_id, c.text, c.created_at, d.type AS doc_type, d.title AS doc_title
         FROM chunks c
         LEFT JOIN documents d ON d.id = c.doc_id
         WHERE c.user_id = ? AND COALESCE(d.source,'unknown') = ?
         ORDER BY c.created_at DESC
         LIMIT ?`
      ).all(userId, source, limit) as Array<any>;
    }

    const groups: Record<string, { title: string; date: string; items: any[] }> = {};
    for (const r of rows) {
      const created = typeof r.created_at === 'number' ? new Date(r.created_at) : new Date(r.created_at || Date.now());
      const d = created;
      const y = d.getFullYear();
      const m = `${(d.getMonth() + 1).toString().padStart(2, "0")}`;
      const day = `${d.getDate().toString().padStart(2, "0")}`;
      const key = `${y}-${m}-${day}`;
      if (!groups[key]) {
  const title = d.toLocaleDateString("en-US", { dateStyle: "long" });
        groups[key] = { title, date: key, items: [] };
      }
      groups[key].items.push({
        id: r.id,
        docId: r.doc_id,
        createdAt: typeof r.created_at === 'number' ? r.created_at : new Date(r.created_at).getTime(),
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

// Get full document content by document ID
apiRouter.get("/self-agent/memories/document/:docId", async (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    const { docId } = req.params;
    
    if (!userId || !docId) return res.status(400).json({ error: "missing userId or docId" });

    let doc: any = null;
    if (USE_PG) {
      await withUserClient(userId, async (c) => {
        const r = await c.query(
          `SELECT id, user_id, source, type, title, content, metadata, created_at
           FROM documents WHERE id = $1 AND user_id = $2`,
          [docId, userId]
        );
        doc = r.rows?.[0] || null;
      });
    } else {
      const db = getDB();
      doc = db.prepare(
        `SELECT id, user_id, source, type, title, content, metadata, created_at
         FROM documents
         WHERE id = ? AND user_id = ?`
      ).get(docId, userId) as any;
    }

    if (!doc) return res.status(404).json({ error: "document not found" });
    
    let meta = null;
    try {
      if (doc.metadata && typeof doc.metadata === 'string') meta = JSON.parse(doc.metadata);
      else if (doc.metadata) meta = doc.metadata;
    } catch {}
    
    res.json({
      id: doc.id,
      source: doc.source,
      type: doc.type,
      title: doc.title,
      content: doc.content,
      metadata: meta,
      createdAt: typeof doc.created_at === 'number' ? doc.created_at : new Date(doc.created_at).getTime(),
    });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Get chunk details with context
apiRouter.get("/self-agent/memories/chunk/:chunkId", async (req: Request, res: Response) => {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const payload = token ? verifyToken(token) : null;
    const qp = String(req.query.userId || "");
    const userId = (payload?.email as string | undefined) || qp;
    const { chunkId } = req.params;
    
    if (!userId || !chunkId) return res.status(400).json({ error: "missing userId or chunkId" });

    let chunk: any = null;
    if (USE_PG) {
      await withUserClient(userId, async (c) => {
        const r = await c.query(
          `SELECT c.id, c.doc_id, c.idx, c.text, c.metadata, c.created_at,
                  d.source, d.type, d.title, d.content AS doc_content
           FROM chunks c
           LEFT JOIN documents d ON d.id = c.doc_id
           WHERE c.id = $1 AND c.user_id = $2`,
          [chunkId, userId]
        );
        chunk = r.rows?.[0] || null;
      });
    } else {
      const db = getDB();
      chunk = db.prepare(
        `SELECT c.id, c.doc_id, c.idx, c.text, c.metadata, c.created_at,
                d.source, d.type, d.title, d.content AS doc_content
         FROM chunks c
         LEFT JOIN documents d ON d.id = c.doc_id
         WHERE c.id = ? AND c.user_id = ?`
      ).get(chunkId, userId) as any;
    }

    if (!chunk) return res.status(404).json({ error: "chunk not found" });
    
    // Get surrounding chunks for context
    let siblings: Array<any> = [];
    if (USE_PG) {
      await withUserClient(userId, async (c) => {
        const r = await c.query(
          `SELECT id, idx, text
           FROM chunks
           WHERE doc_id = $1 AND user_id = $2
           ORDER BY idx ASC`,
          [chunk.doc_id, userId]
        );
        siblings = r.rows as any[];
      });
    } else {
      const db = getDB();
      siblings = db.prepare(
        `SELECT id, idx, text
         FROM chunks
         WHERE doc_id = ? AND user_id = ?
         ORDER BY idx ASC`
      ).all(chunk.doc_id, userId) as Array<any>;
    }
    
    let meta = null;
    try {
      if (chunk.metadata && typeof chunk.metadata === 'string') meta = JSON.parse(chunk.metadata);
      else if (chunk.metadata) meta = chunk.metadata;
    } catch {}
    
    res.json({
      id: chunk.id,
      docId: chunk.doc_id,
      idx: chunk.idx,
      text: chunk.text,
      metadata: meta,
      createdAt: typeof chunk.created_at === 'number' ? chunk.created_at : new Date(chunk.created_at).getTime(),
      document: {
        source: chunk.source,
        type: chunk.type,
        title: chunk.title,
      },
      siblings: siblings.map(s => ({
        id: s.id,
        idx: s.idx,
        preview: String(s.text || '').slice(0, 100),
      })),
    });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// Import Google Takeout data
apiRouter.post("/self-agent/import/google", async (req: Request, res: Response) => {
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
apiRouter.get("/self-agent/search", async (req: Request, res: Response) => {
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
apiRouter.get("/self-agent/retrieve", async (req: Request, res: Response) => {
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
apiRouter.post("/self-agent/generate/chat/stream", async (req: Request, res: Response) => {
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
    
    // Log RAG retrieval info for debugging
    console.log(`[RAG] Query: "${lastUserMessage.slice(0, 50)}..." | Sources filter: ${sources?.join(',') || 'none'} | Hits: ${hits.length}`);
    if (hits.length > 0) {
      hits.forEach((h, i) => console.log(`  [${i+1}] score=${h.score.toFixed(3)} text="${h.text.slice(0, 60)}..."`));
    }
    
    const context = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
    
    // 3. Get available data sources and build persona prompt
    const availableSources = getUserAvailableSources(userId);
    const personaPrompt = buildPersonaPrompt(persona, context, availableSources);
    
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

    // Persist chat to Memories (source=chat_self_agent)
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

apiRouter.post("/self-agent/generate/chat", async (req: Request, res: Response) => {
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
  console.log(`[RAG non-stream] Query: "${last.slice(0, 50)}..." | Sources filter: ${sources.join(',') || 'none'} | Hits: ${hits.length}`);
  const ctx = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
  
  // 3. Build persona-aware prompt with available sources
  const availableSources = getUserAvailableSources(effectiveUserId);
  const personaPrompt = buildPersonaPrompt(persona, ctx, availableSources);
  
  const finalHint = parsed.data.hint
    ? `${personaPrompt}\n\n${parsed.data.hint}`
    : personaPrompt;
  
  const text = await provider.generateChat({ 
    userId: effectiveUserId, 
    history: historyData as Array<{role: "user" | "assistant", content: string}>, 
    hint: finalHint 
  } as ChatGenerateInput);

  // Persist chat to Memories (source=chat_self_agent)
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
apiRouter.post("/self-agent/chat/stream", async (req: Request, res: Response) => {
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

apiRouter.post("/self-agent/generate/post", async (req: Request, res: Response) => {
  const Body = z.object({
    userId: z.string(),
    context: z.string().optional(),
    mediaHint: z.array(z.object({ type: z.string(), content: z.string().optional() })).optional(),
  });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  // RAG: use recent relevant snippets as context
  const base = parsed.data.context || "";
  const hits = retrieveRelevant(parsed.data.userId, base || "Personalized dynamics", { topK: 6 });
  const ctx = buildContext(hits.map(h => ({ text: h.text, score: h.score })));
  const text = await provider.generatePost({ ...parsed.data, context: [base, `Context:\n${ctx}`].filter(Boolean).join("\n\n") } as PostGenerateInput);
  res.json({ text });
});

app.get("/health", (_req: Request, res: Response) => res.send("ok"));

apiRouter.get("/self-agent/provider-info", (_req: Request, res: Response) => {
  const isGemini = provider instanceof GeminiProvider;
  res.json({
    provider: provider.name,
    model: isGemini ? config.geminiModel : "openai-stub",
    geminiConfigured: isGemini && Boolean(config.googleKey),
  });
});

apiRouter.post("/self-agent/provider-info/test", async (req: Request, res: Response) => {
  if (!(provider instanceof GeminiProvider)) {
    return res.status(400).json({ ok: false, provider: provider.name, message: "Gemini provider not configured" });
  }

  const Body = z.object({
    prompt: z.string().default("Please introduce yourself briefly."),
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
apiRouter.post("/self-agent/admin/migrate-user", (req: Request, res: Response) => {
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
apiRouter.get("/self-agent/admin/user-stats", (_req: Request, res: Response) => {
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

// Admin: repair instagram chunk text by decoding entities and fixing mojibake for an existing user
apiRouter.post("/self-agent/admin/repair-instagram-text", (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string(), limit: z.number().optional() });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { userId } = parsed.data;
    const limit = Math.min(parsed.data.limit ?? 1000, 5000);
    const db = getDB();
    // select chunks from instagram documents
    const rows = db.prepare(
      `SELECT c.id, c.text, c.created_at, d.id AS doc_id, d.content AS doc_content
       FROM chunks c
       LEFT JOIN documents d ON d.id = c.doc_id
       WHERE c.user_id = ? AND COALESCE(d.source,'unknown') = 'instagram'
       ORDER BY c.created_at DESC
       LIMIT ?`
    ).all(userId, limit) as Array<any>;

    let updated = 0;
    for (const r of rows) {
      const before = String(r.text || "");
      // re-normalize to fix entities/mojibake
      const after = normalizeText(before);
      if (after && after !== before) {
        db.prepare("UPDATE chunks SET text = ? WHERE id = ?").run(after, r.id);
        updated++;
      }
    }
    res.json({ ok: true, scanned: rows.length, updated });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Admin: generic repair to re-normalize chunk text for a given source (e.g., google) to decode entities
apiRouter.post("/self-agent/admin/repair-chunk-text", (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string(), source: z.string().optional(), limit: z.number().optional() });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { userId, source } = parsed.data;
    const limit = Math.min(parsed.data.limit ?? 2000, 10000);
    const db = getDB();
    const stmt = db.prepare(
      `SELECT c.id, c.text, c.created_at, d.source AS source
       FROM chunks c
       LEFT JOIN documents d ON d.id = c.doc_id
       WHERE c.user_id = ? ${source ? "AND COALESCE(d.source,'unknown') = ?" : ""}
       ORDER BY c.created_at DESC
       LIMIT ?`
    );
    const params: any[] = [userId];
    if (source) params.push(source);
    params.push(limit);
    const rows = stmt.all(...params) as Array<any>;

    let updated = 0;
    for (const r of rows) {
      const before = String(r.text || "");
      const after = normalizeText(before);
      if (after && after !== before) {
        db.prepare("UPDATE chunks SET text = ? WHERE id = ?").run(after, r.id);
        updated++;
      }
    }
    res.json({ ok: true, source: source || "all", scanned: rows.length, updated });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Admin: rehydrate instagram documents from original files and rebuild chunks/vectors
apiRouter.post("/self-agent/admin/rehydrate-instagram", async (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string(), limit: z.number().optional(), dryRun: z.boolean().optional() });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());
    const { userId } = parsed.data;
    const limit = Math.min(parsed.data.limit ?? 50, 200);
    const dryRun = parsed.data.dryRun ?? false;
    const db = getDB();
    const docs = db.prepare(
      `SELECT id, title, type, content, metadata, created_at
       FROM documents
       WHERE user_id = ? AND COALESCE(source,'unknown') = 'instagram'
       ORDER BY created_at DESC
       LIMIT ?`
    ).all(userId, limit) as Array<{ id: string; title: string; type: string; content: string; metadata: string; created_at: number }>;

    let processed = 0, updated = 0, skippedNoPath = 0, skippedReadFail = 0;
    for (const d of docs) {
      processed++;
      let meta: any = null;
      try { meta = d.metadata ? JSON.parse(d.metadata) : null; } catch {}
      const filePath = meta?.path as string | undefined;
      if (!filePath || !filePath.toLowerCase().endsWith('.json')) { skippedNoPath++; continue; }
      let raw = "";
      try { raw = fs.readFileSync(filePath, 'utf8'); } catch { skippedReadFail++; continue; }

      let newContent = "";
      try {
        const obj = JSON.parse(raw);
        newContent = normalizeText(extractInstagramJson(obj));
      } catch {
        // not JSON; keep old content
        continue;
      }

      if (!newContent || newContent === (d.content || "")) continue;

      if (dryRun) { updated++; continue; }

      const tx = db.transaction(() => {
        // fetch chunk ids for this doc
        const chunkRows = db.prepare("SELECT id FROM chunks WHERE doc_id = ?").all(d.id) as Array<{ id: string }>;
        // delete vectors for these chunks
        for (const cr of chunkRows) {
          db.prepare("DELETE FROM vectors WHERE chunk_id = ?").run(cr.id);
        }
        // delete old chunks
        db.prepare("DELETE FROM chunks WHERE doc_id = ?").run(d.id);
        // update document content
        db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(newContent, d.id);
        // rebuild chunks and vectors
        const parts = chunkText(newContent, { maxChars: 1200, overlap: 120 });
        parts.forEach((text, idx) => {
          const id = `chk_${Math.random().toString(36).slice(2)}${Date.now()}`;
          insertChunk({ id, doc_id: d.id, user_id: userId, idx, text, metadata: { platform: 'instagram', repaired: true } });
          const vec = embedText(text);
          insertVector(id, userId, vec);
        });
      });
      tx();
      updated++;
    }

    res.json({ ok: true, scanned: docs.length, processed, updated, skippedNoPath, skippedReadFail, dryRun });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * GET /api/self-agent/deduplication/stats
 * Get duplicate data statistics (without deletion)
 */
apiRouter.get("/self-agent/deduplication/stats", (req: Request, res: Response) => {
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
 * Perform deduplication
 */
apiRouter.post("/self-agent/deduplication/execute", (req: Request, res: Response) => {
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
 * Preview duplicate documents and chunks
 */
apiRouter.get("/self-agent/deduplication/preview", (req: Request, res: Response) => {
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
 * Generate Google OAuth authorization URL
 */
apiRouter.get("/google-sync/auth-url", (req: Request, res: Response) => {
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
 * Google OAuth callback processing
 */
app.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    
    if (!code || !state) {
      return res.status(400).send("Missing code or state parameter");
    }

    // state contains userId
    const userId = state;
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get user information
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    
    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userInfo = await userInfoResponse.json() as { name: string; picture: string; email: string };
    
    // Save tokens and user information
    saveGoogleTokens(userId, tokens);
    
    // Ensure user exists
    ensureUser(userId);
    
    // Update user profile
    updateAuthProfile(userId, {
      name: userInfo.name,
      avatar: userInfo.picture,
    });

    // Redirect back to frontend application
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    res.redirect(`${frontendUrl}/settings?google_sync=success`);

  } catch (e: any) {
    console.error("Google OAuth callback error:", e);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    res.redirect(`${frontendUrl}/settings?google_sync=error&message=${encodeURIComponent(e.message)}`);
  }
});

/**
 * GET /api/google-sync/status
 * Get Google connection status
 */
apiRouter.get("/google-sync/status", (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || "");
    if (!userId) return res.status(400).json({ error: "missing userId" });
    
    const status = getGoogleConnectionStatus(userId);
    res.json({ ok: true, ...status });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * POST /api/google-sync/revoke
 * Revoke Google connection
 */
apiRouter.post("/google-sync/revoke", async (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string() });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    await revokeGoogleConnection(parsed.data.userId);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

/**
 * POST /api/google-sync/sync-all
 * Sync all Google services
 */
apiRouter.post("/google-sync/sync-all", async (req: Request, res: Response) => {
  try {
    const Body = z.object({ userId: z.string() });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error.flatten());

    // Execute asynchronously, return immediately
    syncAllGoogleServices(parsed.data.userId).catch(console.error);

    res.json({ ok: true, message: "Sync process started in background." });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});


app.use("/api", apiRouter);

const PORT = process.env.PORT || 8787;

const server = app.listen(PORT, () => {
  console.log(`✓ Self AI Agent running on http://127.0.0.1:${PORT}`);
  // Ensure user 'default' exists
  try {
    ensureUser("default");
    console.log("✓ Default user ensured.");
  } catch (e) {
    console.error("✗ Failed to ensure default user:", e);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("✓ HTTP server closed.");
    // Close DB connection if needed
    try {
      const db = getDB();
      if (db.open) {
        db.close();
        console.log("✓ Database connection closed.");
      }
    } catch (e) {
      console.error("✗ Error closing database:", e);
    }
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default app;
