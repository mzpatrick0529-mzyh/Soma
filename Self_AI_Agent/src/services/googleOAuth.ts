/**
 * Google OAuth Service
 * 处理 Google OAuth 授权流程和 token 管理
 */
import fetch from "node-fetch";
import { getDB } from "../db";
import { googleOAuthConfig } from "../utils/googleOAuth";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  id: string;
}

/**
 * 生成 OAuth 授权 URL
 */
export function getGoogleAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: googleOAuthConfig.clientId,
    redirect_uri: googleOAuthConfig.redirectUri,
    response_type: "code",
    scope: googleOAuthConfig.scopes.join(" "),
    access_type: "offline", // 获取 refresh_token
    prompt: "consent", // 每次都请求授权以确保获取 refresh_token
    state: Buffer.from(JSON.stringify({ userId })).toString("base64"),
  });

  return `${googleOAuthConfig.authUrl}?${params.toString()}`;
}

/**
 * 用授权码交换 access token
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch(googleOAuthConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleOAuthConfig.clientId,
      client_secret: googleOAuthConfig.clientSecret,
      redirect_uri: googleOAuthConfig.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return (await response.json()) as GoogleTokens;
}

/**
 * 刷新 access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const response = await fetch(googleOAuthConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: googleOAuthConfig.clientId,
      client_secret: googleOAuthConfig.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return (await response.json()) as GoogleTokens;
}

/**
 * 获取用户信息
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(googleOAuthConfig.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return (await response.json()) as GoogleUserInfo;
}

/**
 * 保存用户的 Google tokens 到数据库
 */
export function saveGoogleTokens(userId: string, tokens: GoogleTokens, userInfo?: GoogleUserInfo) {
  const db = getDB();
  
  // 创建或更新 google_connections 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS google_connections (
      user_id TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at INTEGER NOT NULL,
      scope TEXT,
      google_email TEXT,
      google_name TEXT,
      google_id TEXT,
      google_picture TEXT,
      connected_at INTEGER NOT NULL,
      last_sync_at INTEGER,
      sync_status TEXT,
      sync_error TEXT
    )
  `);

  const expiresAt = Date.now() + tokens.expires_in * 1000;

  db.prepare(`
    INSERT OR REPLACE INTO google_connections 
    (user_id, access_token, refresh_token, expires_at, scope, google_email, google_name, google_id, google_picture, connected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    tokens.access_token,
    tokens.refresh_token || null,
    expiresAt,
    tokens.scope,
    userInfo?.email || null,
    userInfo?.name || null,
    userInfo?.id || null,
    userInfo?.picture || null,
    Date.now()
  );
}

/**
 * 获取用户的 Google tokens
 */
export function getGoogleTokens(userId: string): {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
} | null {
  const db = getDB();
  
  try {
    const row = db
      .prepare("SELECT access_token, refresh_token, expires_at FROM google_connections WHERE user_id = ?")
      .get(userId) as any;

    if (!row) return null;

    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
    };
  } catch {
    return null;
  }
}

/**
 * 获取有效的 access token（自动刷新过期的）
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const tokens = getGoogleTokens(userId);
  
  if (!tokens) return null;

  // 如果 token 还未过期（留5分钟缓冲）
  if (tokens.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokens.accessToken;
  }

  // Token 过期，尝试刷新
  if (!tokens.refreshToken) {
    console.error("[google-oauth] No refresh token available for user:", userId);
    return null;
  }

  try {
    const newTokens = await refreshAccessToken(tokens.refreshToken);
    
    // 更新数据库
    const db = getDB();
    const expiresAt = Date.now() + newTokens.expires_in * 1000;
    
    db.prepare(`
      UPDATE google_connections 
      SET access_token = ?, expires_at = ?
      WHERE user_id = ?
    `).run(newTokens.access_token, expiresAt, userId);

    return newTokens.access_token;
  } catch (error: any) {
    console.error("[google-oauth] Failed to refresh token:", error.message);
    return null;
  }
}

/**
 * 撤销用户的 Google 授权
 */
export function revokeGoogleConnection(userId: string) {
  const db = getDB();
  db.prepare("DELETE FROM google_connections WHERE user_id = ?").run(userId);
}

/**
 * 获取连接状态
 */
export function getGoogleConnectionStatus(userId: string) {
  const db = getDB();
  
  try {
    const row = db
      .prepare(`
        SELECT 
          google_email,
          google_name,
          connected_at,
          last_sync_at,
          sync_status,
          sync_error
        FROM google_connections 
        WHERE user_id = ?
      `)
      .get(userId) as any;

    if (!row) {
      return { connected: false };
    }

    return {
      connected: true,
      email: row.google_email,
      name: row.google_name,
      connectedAt: row.connected_at,
      lastSyncAt: row.last_sync_at,
      syncStatus: row.sync_status,
      syncError: row.sync_error,
    };
  } catch {
    return { connected: false };
  }
}

/**
 * 更新同步状态
 */
export function updateSyncStatus(
  userId: string,
  status: "syncing" | "completed" | "error",
  error?: string
) {
  const db = getDB();
  
  db.prepare(`
    UPDATE google_connections 
    SET last_sync_at = ?, sync_status = ?, sync_error = ?
    WHERE user_id = ?
  `).run(Date.now(), status, error || null, userId);
}
