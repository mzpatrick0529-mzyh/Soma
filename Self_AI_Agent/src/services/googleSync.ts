/**
 * Google Sync Services
 * 实现 Gmail/Drive/Calendar/Photos/YouTube 实时同步
 */
import fetch from "node-fetch";
import { getValidAccessToken, updateSyncStatus } from "./googleOAuth";
import { ensureUser, insertDocument, insertChunk, insertVector } from "../db";
import { normalizeText, stripHtml } from "../utils/text";
import { chunkText } from "../pipeline/chunk";
import { embedText } from "../pipeline/embeddings";
import { googleApiEndpoints } from "../utils/googleOAuth";

function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

interface SyncResult {
  service: string;
  itemsProcessed: number;
  itemsAdded: number;
  error?: string;
}

/**
 * Sync all Google services
 */
export async function syncAllGoogleServices(userId: string): Promise<SyncResult[]> {
  console.log(`[google-sync] Starting full sync for user ${userId}`);
  
  const results: SyncResult[] = [];
  
  try {
    updateSyncStatus(userId, "syncing", undefined);
    
    // 并行同步多个服务
    const syncPromises = [
      syncGmail(userId).catch(e => ({ 
        service: "Gmail", 
        itemsProcessed: 0, 
        itemsAdded: 0, 
        error: e.message 
      })),
      syncGoogleDrive(userId).catch(e => ({ 
        service: "Drive", 
        itemsProcessed: 0, 
        itemsAdded: 0, 
        error: e.message 
      })),
      syncGoogleCalendar(userId).catch(e => ({ 
        service: "Calendar", 
        itemsProcessed: 0, 
        itemsAdded: 0, 
        error: e.message 
      })),
      syncGooglePhotos(userId).catch(e => ({ 
        service: "Photos", 
        itemsProcessed: 0, 
        itemsAdded: 0, 
        error: e.message 
      })),
    ];
    
    const syncResults = await Promise.all(syncPromises);
    results.push(...syncResults);
    
    // 更新同步状态
    const hasError = results.some(r => r.error);
    updateSyncStatus(userId, hasError ? "error" : "completed", 
      hasError ? results.find(r => r.error)?.error || undefined : undefined
    );
    
    console.log(`[google-sync] Sync completed:`, results);
    
  } catch (error: any) {
    console.error("[google-sync] Sync failed:", error);
    updateSyncStatus(userId, "error", error.message);
    throw error;
  }
  
  return results;
}

/**
 * 同步 Gmail 邮件
 */
export async function syncGmail(userId: string): Promise<SyncResult> {
  console.log(`[gmail-sync] Starting Gmail sync for ${userId}`);
  
  const result: SyncResult = {
    service: "Gmail",
    itemsProcessed: 0,
    itemsAdded: 0
  };
  
  try {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error("No valid access token");
    }
    
    ensureUser(userId);
    
    // 获取邮件列表（最近100封）
    const listResponse = await fetch(
      `${googleApiEndpoints.gmail}/users/me/messages?maxResults=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    if (!listResponse.ok) {
      throw new Error(`Gmail API error: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json() as any;
    const messages = listData.messages || [];
    
    result.itemsProcessed = messages.length;
    
    // 获取每封邮件的详细内容
    for (const msg of messages.slice(0, 50)) { // 限制每次同步50封
      try {
        const msgResponse = await fetch(
          `${googleApiEndpoints.gmail}/users/me/messages/${msg.id}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        
        if (!msgResponse.ok) continue;
        
        const msgData = await msgResponse.json() as any;
        
        // 提取邮件内容
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";
        
        let body = "";
        if (msgData.payload?.body?.data) {
          body = Buffer.from(msgData.payload.body.data, "base64").toString("utf8");
        } else if (msgData.payload?.parts) {
          // 多部分邮件
          for (const part of msgData.payload.parts) {
            if (part.mimeType === "text/plain" && part.body?.data) {
              body += Buffer.from(part.body.data, "base64").toString("utf8");
            } else if (part.mimeType === "text/html" && part.body?.data) {
              const html = Buffer.from(part.body.data, "base64").toString("utf8");
              body += stripHtml(html);
            }
          }
        }
        
        const content = normalizeText(`Subject: ${subject}\nFrom: ${from}\nDate: ${date}\n\n${body}`);
        
        if (!content || content.length < 20) continue;
        
        // 插入文档
        const docId = uid("doc");
        insertDocument({
          id: docId,
          user_id: userId,
          source: "google",
          type: "email",
          title: subject,
          content,
          metadata: {
            platform: "google",
            subSource: "gmail",
            messageId: msg.id,
            from,
            date
          }
        });
        
        // 分块and向量化
        const chunks = chunkText(content, { maxChars: 1200, overlap: 120 });
        chunks.forEach((text, idx) => {
          const chunkId = uid("chk");
          insertChunk({
            id: chunkId,
            doc_id: docId,
            user_id: userId,
            idx,
            text,
            metadata: { platform: "google", service: "gmail" }
          });
          const vec = embedText(text);
          insertVector(chunkId, userId, vec);
        });
        
        result.itemsAdded++;
        
      } catch (msgError) {
        console.warn(`[gmail-sync] Failed to process message ${msg.id}:`, msgError);
        continue;
      }
    }
    
    console.log(`[gmail-sync] Completed: ${result.itemsAdded}/${result.itemsProcessed} added`);
    
  } catch (error: any) {
    console.error("[gmail-sync] Error:", error);
    result.error = error.message;
  }
  
  return result;
}

/**
 * 同步 Google Drive 文件
 */
export async function syncGoogleDrive(userId: string): Promise<SyncResult> {
  console.log(`[drive-sync] Starting Drive sync for ${userId}`);
  
  const result: SyncResult = {
    service: "Drive",
    itemsProcessed: 0,
    itemsAdded: 0
  };
  
  try {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error("No valid access token");
    }
    
    ensureUser(userId);
    
    // 获取文件列表（仅文档类型）
    const listResponse = await fetch(
      `${googleApiEndpoints.drive}/files?pageSize=100&fields=files(id,name,mimeType,modifiedTime,description)&q=mimeType='application/vnd.google-apps.document' or mimeType='text/plain'`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    if (!listResponse.ok) {
      throw new Error(`Drive API error: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json() as any;
    const files = listData.files || [];
    
    result.itemsProcessed = files.length;
    
    // 获取每个文件的内容
    for (const file of files.slice(0, 30)) { // 限制每次同步30个文件
      try {
        let content = "";
        
        // Google Docs 需要导出为文本
        if (file.mimeType === "application/vnd.google-apps.document") {
          const exportResponse = await fetch(
            `${googleApiEndpoints.drive}/files/${file.id}/export?mimeType=text/plain`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (exportResponse.ok) {
            content = await exportResponse.text();
          }
        } else {
          // 直接下载文本文件
          const downloadResponse = await fetch(
            `${googleApiEndpoints.drive}/files/${file.id}?alt=media`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          
          if (downloadResponse.ok) {
            content = await downloadResponse.text();
          }
        }
        
        content = normalizeText(content);
        if (!content || content.length < 20) continue;
        
        // 插入文档
        const docId = uid("doc");
        insertDocument({
          id: docId,
          user_id: userId,
          source: "google",
          type: "document",
          title: file.name,
          content,
          metadata: {
            platform: "google",
            subSource: "drive",
            fileId: file.id,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime
          }
        });
        
        // 分块and向量化
        const chunks = chunkText(content, { maxChars: 1200, overlap: 120 });
        chunks.forEach((text, idx) => {
          const chunkId = uid("chk");
          insertChunk({
            id: chunkId,
            doc_id: docId,
            user_id: userId,
            idx,
            text,
            metadata: { platform: "google", service: "drive" }
          });
          const vec = embedText(text);
          insertVector(chunkId, userId, vec);
        });
        
        result.itemsAdded++;
        
      } catch (fileError) {
        console.warn(`[drive-sync] Failed to process file ${file.id}:`, fileError);
        continue;
      }
    }
    
    console.log(`[drive-sync] Completed: ${result.itemsAdded}/${result.itemsProcessed} added`);
    
  } catch (error: any) {
    console.error("[drive-sync] Error:", error);
    result.error = error.message;
  }
  
  return result;
}

/**
 * 同步 Google Calendar 事件
 */
export async function syncGoogleCalendar(userId: string): Promise<SyncResult> {
  console.log(`[calendar-sync] Starting Calendar sync for ${userId}`);
  
  const result: SyncResult = {
    service: "Calendar",
    itemsProcessed: 0,
    itemsAdded: 0
  };
  
  try {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error("No valid access token");
    }
    
    ensureUser(userId);
    
    // 获取最近3个月的事件
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const listResponse = await fetch(
      `${googleApiEndpoints.calendar}/calendars/primary/events?maxResults=100&timeMin=${threeMonthsAgo.toISOString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    if (!listResponse.ok) {
      throw new Error(`Calendar API error: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json() as any;
    const events = listData.items || [];
    
    result.itemsProcessed = events.length;
    
    for (const event of events) {
      try {
        const title = event.summary || "No Title";
        const description = event.description || "";
        const start = event.start?.dateTime || event.start?.date || "";
        const end = event.end?.dateTime || event.end?.date || "";
        const location = event.location || "";
        
        const content = normalizeText(
          `Event: ${title}\nStart: ${start}\nEnd: ${end}\nLocation: ${location}\n\n${description}`
        );
        
        if (!content || content.length < 20) continue;
        
        // 插入文档
        const docId = uid("doc");
        insertDocument({
          id: docId,
          user_id: userId,
          source: "google",
          type: "event",
          title,
          content,
          metadata: {
            platform: "google",
            subSource: "calendar",
            eventId: event.id,
            start,
            end,
            location
          }
        });
        
        // 分块and向量化
        const chunks = chunkText(content, { maxChars: 1200, overlap: 120 });
        chunks.forEach((text, idx) => {
          const chunkId = uid("chk");
          insertChunk({
            id: chunkId,
            doc_id: docId,
            user_id: userId,
            idx,
            text,
            metadata: { platform: "google", service: "calendar" }
          });
          const vec = embedText(text);
          insertVector(chunkId, userId, vec);
        });
        
        result.itemsAdded++;
        
      } catch (eventError) {
        console.warn(`[calendar-sync] Failed to process event ${event.id}:`, eventError);
        continue;
      }
    }
    
    console.log(`[calendar-sync] Completed: ${result.itemsAdded}/${result.itemsProcessed} added`);
    
  } catch (error: any) {
    console.error("[calendar-sync] Error:", error);
    result.error = error.message;
  }
  
  return result;
}

/**
 * 同步 Google Photos 元数据
 */
export async function syncGooglePhotos(userId: string): Promise<SyncResult> {
  console.log(`[photos-sync] Starting Photos sync for ${userId}`);
  
  const result: SyncResult = {
    service: "Photos",
    itemsProcessed: 0,
    itemsAdded: 0
  };
  
  try {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      throw new Error("No valid access token");
    }
    
    ensureUser(userId);
    
    // 获取相册列表
    const listResponse = await fetch(
      `${googleApiEndpoints.photos}/albums?pageSize=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
    
    if (!listResponse.ok) {
      throw new Error(`Photos API error: ${listResponse.statusText}`);
    }
    
    const listData = await listResponse.json() as any;
    const albums = listData.albums || [];
    
    result.itemsProcessed = albums.length;
    
    for (const album of albums.slice(0, 20)) {
      try {
        const title = album.title || "Untitled Album";
        const mediaCount = album.mediaItemsCount || 0;
        const coverUrl = album.coverPhotoBaseUrl || "";
        
        const content = normalizeText(
          `Album: ${title}\nMedia Count: ${mediaCount}\nID: ${album.id}`
        );
        
        if (!content) continue;
        
        // 插入文档
        const docId = uid("doc");
        insertDocument({
          id: docId,
          user_id: userId,
          source: "google",
          type: "album",
          title,
          content,
          metadata: {
            platform: "google",
            subSource: "photos",
            albumId: album.id,
            mediaItemsCount: mediaCount,
            coverPhotoBaseUrl: coverUrl
          }
        });
        
        // 相册元数据较短，直接向量化
        const chunkId = uid("chk");
        insertChunk({
          id: chunkId,
          doc_id: docId,
          user_id: userId,
          idx: 0,
          text: content,
          metadata: { platform: "google", service: "photos" }
        });
        const vec = embedText(content);
        insertVector(chunkId, userId, vec);
        
        result.itemsAdded++;
        
      } catch (albumError) {
        console.warn(`[photos-sync] Failed to process album ${album.id}:`, albumError);
        continue;
      }
    }
    
    console.log(`[photos-sync] Completed: ${result.itemsAdded}/${result.itemsProcessed} added`);
    
  } catch (error: any) {
    console.error("[photos-sync] Error:", error);
    result.error = error.message;
  }
  
  return result;
}
