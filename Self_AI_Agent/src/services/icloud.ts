import { ensureUser, insertDocument, insertChunk, insertVector, getDB } from "../db";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";
import fg from "fast-glob";
import fs from "fs";
import path from "path";
import exifr from "exifr";
import { chunkText } from "../pipeline/chunk";
import { embedText } from "../pipeline/embeddings";

export type ICloudCreds = {
  userId: string;
  appleId: string;
  appPassword: string; // 应用专用Password
};

export function saveICloudCreds(creds: ICloudCreds) {
  const db = getDB();
  db.prepare(`CREATE TABLE IF NOT EXISTS icloud_connections (
    user_id TEXT PRIMARY KEY,
    apple_id TEXT,
    app_password TEXT,
    last_sync INTEGER
  )`).run();
  db.prepare(`INSERT INTO icloud_connections (user_id, apple_id, app_password, last_sync)
    VALUES (@userId, @appleId, @appPassword, @lastSync)
    ON CONFLICT(user_id) DO UPDATE SET apple_id=excluded.apple_id, app_password=excluded.app_password`).run({
    userId: creds.userId,
    appleId: creds.appleId,
    appPassword: creds.appPassword,
    lastSync: Date.now(),
  });
}

export function getICloudStatus(userId: string) {
  const db = getDB();
  try {
    const row = db.prepare(`SELECT * FROM icloud_connections WHERE user_id=?`).get(userId) as any;
    return row ? { connected: true, appleId: row.apple_id, lastSync: row.last_sync || null } : { connected: false };
  } catch {
    return { connected: false };
  }
}

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

// --- Mail (IMAP over iCloud) ---
export async function syncICloudMail(userId: string, options: { maxMessages?: number } = {}) {
  ensureUser(userId);
  const db = getDB();
  const row = db.prepare(`SELECT * FROM icloud_connections WHERE user_id=?`).get(userId) as any;
  if (!row) throw new Error("iCloud not connected");

  const client = new ImapFlow({
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    auth: { user: row.apple_id, pass: row.app_password },
  });

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    const max = options.maxMessages ?? 50;
    let count = 0;
    for await (const msg of client.fetch({ seen: false }, { envelope: true, source: true })) {
      if (count >= max) break;
      count++;
      const parsed = await simpleParser(msg.source as Buffer);
      const subject = parsed.subject || "(no subject)";
      const from = parsed.from?.text || "unknown";
      const date = parsed.date?.toISOString?.() || new Date().toISOString();
      const text = parsed.text || parsed.html || "";
      const content = `From: ${from}\nDate: ${date}\nSubject: ${subject}\n\n${text}`;

      const docId = uid("doc");
      insertDocument({ id: docId, user_id: userId, source: "icloud_mail", type: "email", title: subject, content, metadata: { from, date } });
  const parts = (text || String(content)).split(/\n\n+/).map((s: string) => s.trim()).filter(Boolean);
  const chunks: string[] = parts.length ? parts : [content];
  chunks.slice(0, 20).forEach((c: string, idx: number) => {
        const cid = uid("chk");
        insertChunk({ id: cid, doc_id: docId, user_id: userId, idx, text: c.slice(0, 2000), metadata: { mailbox: "INBOX" } });
        insertVector(cid, userId, embedText(c.slice(0, 2000)));
      });
    }
  } finally {
    lock.release();
    await client.logout();
  }
}

// --- CalDAV/CardDAV placeholders (tsdav) ---
export async function syncICloudCalendar(_userId: string) {
  // 可使用 tsdav 连接到 CalDAV，但需要用户提供专用 URL/Token；此处留作后续扩展
  return { ok: true };
}

export async function syncICloudContacts(_userId: string) {
  // 类似上面，使用 CardDAV；此处留作后续扩展
  return { ok: true };
}

// --- Manual media import (photos/videos) ---
export async function importMediaFolder(userId: string, dir: string) {
  ensureUser(userId);
  const patterns = [path.join(dir, "**/*.{jpg,jpeg,png,webp,bmp,heic,mp4,mov}")];
  const files = await fg(patterns, { onlyFiles: true, caseSensitiveMatch: false });
  let imported = 0;
  for (const f of files) {
    try {
      const ext = path.extname(f).toLowerCase().replace(".", "");
      if (["mp4", "mov"].includes(ext)) {
        const title = path.basename(f);
        const docId = uid("doc");
        const content = `Video: ${title}\nPath: ${f}`;
        insertDocument({ id: docId, user_id: userId, source: "media", type: "video", title, content, metadata: { path: f } });
        const cid = uid("chk");
        insertChunk({ id: cid, doc_id: docId, user_id: userId, idx: 0, text: content, metadata: { path: f } });
        insertVector(cid, userId, embedText(content));
      } else {
        // image: parse EXIF for datetime/location
        let meta: any = {};
        try { meta = await exifr.parse(f); } catch {}
        const date = meta?.CreateDate || meta?.DateTimeOriginal || null;
        const title = path.basename(f);
        const content = `Image: ${title}${date ? `\nTaken: ${date}` : ""}\nPath: ${f}`;
        const docId = uid("doc");
        insertDocument({ id: docId, user_id: userId, source: "media", type: "image", title, content, metadata: { path: f, exif: meta || undefined } });
        const cid = uid("chk");
        insertChunk({ id: cid, doc_id: docId, user_id: userId, idx: 0, text: content, metadata: { path: f } });
        insertVector(cid, userId, embedText(content));
      }
      imported++;
    } catch (e) {
      // skip single file
      // eslint-disable-next-line no-console
      console.warn("[media] skip", f, e);
    }
  }
  return { imported };
}

export default {
  saveICloudCreds,
  getICloudStatus,
  syncICloudMail,
  syncICloudCalendar,
  syncICloudContacts,
  importMediaFolder,
};
