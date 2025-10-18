/**
 * Google OAuth and Real-time Sync Configuration
 * Google OAuth 授权和实时同步配置
 */
import * as dotenv from "dotenv";

dotenv.config();

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:8080/auth/google/callback",
  
  // OAuth Scopes
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/photoslibrary.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
  
  // API Endpoints
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  
  // Sync Settings
  syncInterval: parseInt(process.env.GOOGLE_SYNC_INTERVAL || "3600000", 10), // 1 hour default
  enableAutoSync: process.env.GOOGLE_AUTO_SYNC === "true",
};

export const googleApiEndpoints = {
  gmail: {
    messages: "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    message: (id: string) => `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
  },
  drive: {
    files: "https://www.googleapis.com/drive/v3/files",
    file: (id: string) => `https://www.googleapis.com/drive/v3/files/${id}`,
  },
  calendar: {
    events: (calendarId = "primary") => 
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
  },
  photos: {
    mediaItems: "https://photoslibrary.googleapis.com/v1/mediaItems",
  },
  youtube: {
    search: "https://www.googleapis.com/youtube/v3/search",
    videos: "https://www.googleapis.com/youtube/v3/videos",
  },
};
