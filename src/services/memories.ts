export type TimelineItem = {
  id: string;
  createdAt: number;
  category: string; // gmail/drive/photos/etc
  type: string;     // text/image/video/file
  docId?: string;   // document id for preview navigation
  title?: string;
  excerpt?: string;
  thumbnailUrl?: string;
};

export type TimelineSection = {
  title: string; // 2025年10月13日
  date: string;  // YYYY-MM-DD
  items: TimelineItem[];
};

export async function fetchTimeline(userId: string, cursor?: number, limit = 50): Promise<{ sections: TimelineSection[]; nextCursor: number | null }> {
  const params = new URLSearchParams({ userId, limit: String(limit) });
  if (cursor) params.set('cursor', String(cursor));
  const authRaw = localStorage.getItem('auth-storage');
  const token = authRaw ? (() => { try { const j = JSON.parse(authRaw); return j?.state?.token || j?.token; } catch { return undefined; } })() : undefined;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await fetch(`/api/self-agent/memories/timeline?${params.toString()}`, { headers });
  if (!res.ok) throw new Error(`Timeline failed: ${res.status}`);
  return res.json();
}

export type MemoryFolder = {
  id: string;           // source key
  source: string;       // gmail/drive/photos...
  type: string;         // dominant type
  count: number;        // documents count
  previews: Array<{ id: string; excerpt: string; createdAt: number }>; // small previews
};

export async function fetchFolders(userId: string): Promise<{ folders: MemoryFolder[] }> {
  const params = new URLSearchParams({ userId });
  const authRaw = localStorage.getItem('auth-storage');
  const token = authRaw ? (() => { try { const j = JSON.parse(authRaw); return j?.state?.token || j?.token; } catch { return undefined; } })() : undefined;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await fetch(`/api/self-agent/memories/folders?${params.toString()}`, { headers });
  if (!res.ok) throw new Error(`Folders failed: ${res.status}`);
  return res.json();
}

export async function fetchFolderItems(userId: string, source: string, limit = 100): Promise<{ sections: TimelineSection[] }> {
  const params = new URLSearchParams({ userId, source, limit: String(limit) });
  const authRaw = localStorage.getItem('auth-storage');
  const token = authRaw ? (() => { try { const j = JSON.parse(authRaw); return j?.state?.token || j?.token; } catch { return undefined; } })() : undefined;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await fetch(`/api/self-agent/memories/folder/items?${params.toString()}`, { headers });
  if (!res.ok) throw new Error(`Folder items failed: ${res.status}`);
  return res.json();
}
