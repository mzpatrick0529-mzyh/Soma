/**
 * 🔄 Google Data Import Service
 * 处理 Google Takeout 数据导入、解析和预处理
 */

export interface GoogleDataSource {
  type: 'gmail' | 'drive' | 'photos' | 'calendar' | 'contacts' | 'youtube' | 'maps';
  fileCount: number;
  totalSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export interface ImportedData {
  id: string;
  source: GoogleDataSource['type'];
  timestamp: Date;
  content: any;
  metadata: {
    from?: string;
    to?: string;
    subject?: string;
    date?: string;
    location?: string;
    tags?: string[];
  };
  embedding?: number[];
}

export interface ImportProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  stage: 'uploading' | 'parsing' | 'processing' | 'vectorizing' | 'training' | 'completed' | 'error';
  percentage: number;
  estimatedTimeRemaining?: number; // seconds
  error?: string;
  stats?: {
    files: number;
    docs: number;
    chunks: number;
  };
  fileName?: string;
  fileSize?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface GoogleImportStats {
  totals: {
    documents: number;
    chunks: number;
  };
  sources: Record<string, number>;
  lastImportAt: number | null;
  lastImportSummary: {
    files: number;
    documents: number;
    chunks: number;
    completedAt?: number;
  } | null;
}

class GoogleDataImportService {
  private readonly apiEndpoint: string;
  private readonly friendlyTarget: string;
  private getAuthHeader(): Record<string, string> {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token || parsed?.token;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  }

  constructor() {
  const baseUrl = undefined as unknown as string | undefined;
  this.apiEndpoint = '/api/google-import';
  this.friendlyTarget = 'http://localhost:8787';
  }

  private async safeFetch(input: RequestInfo | URL, init?: RequestInit) {
    try {
      const res = await fetch(input, {
        ...init,
        headers: { ...(init?.headers || {}), ...this.getAuthHeader() },
      });
      return res;
    } catch (e: any) {
      const msg = e?.message || String(e);
      // Network / proxy refused
      if (msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED') || msg.includes('NetworkError')) {
        throw new Error(`无法连接到后端服务 (${this.friendlyTarget})，请确认 Self_AI_Agent 已启动并监听正确端口`);
      }
      throw e;
    }
  }

  /**
   * 上传 Google Takeout 压缩文件
   */
  async uploadTakeoutFile(
    file: File, 
    userId: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const response = await this.safeFetch(`${this.apiEndpoint}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to upload Takeout file');
    }

    const { importId } = await response.json();

    // 开始轮询进度
    if (onProgress) {
      this.pollProgress(importId, onProgress);
    }

    return importId;
  }

  /**
   * 轮询导入进度
   */
  private async pollProgress(importId: string, callback: (progress: ImportProgress) => void) {
    const interval = setInterval(async () => {
      try {
        const progress = await this.getImportProgress(importId);
        callback(progress);

        if (progress.stage === 'completed' || progress.percentage >= 100) {
          clearInterval(interval);
        }

        if (progress.stage === 'error') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        clearInterval(interval);
      }
    }, 1000);
  }

  /**
   * 获取导入进度
   */
  async getImportProgress(importId: string): Promise<ImportProgress> {
  const response = await this.safeFetch(`${this.apiEndpoint}/progress/${importId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch import progress');
    }

    return response.json();
  }

  /**
   * 解析 Gmail 数据
   */
  async parseGmailData(file: File): Promise<ImportedData[]> {
    const text = await file.text();
    const emails: ImportedData[] = [];

    // 简化的邮件解析逻辑（实际需要更复杂的MBOX解析）
    const emailPattern = /From:.*?Subject:.*?Date:.*?\n\n([\s\S]*?)(?=From:|$)/g;
    let match;

    while ((match = emailPattern.exec(text)) !== null) {
      emails.push({
        id: crypto.randomUUID(),
        source: 'gmail',
        timestamp: new Date(),
        content: match[1].trim(),
        metadata: {
          from: this.extractField(match[0], 'From'),
          subject: this.extractField(match[0], 'Subject'),
          date: this.extractField(match[0], 'Date'),
        },
      });
    }

    return emails;
  }

  /**
   * 解析 Google Drive 文件
   */
  async parseDriveData(files: File[]): Promise<ImportedData[]> {
    const driveData: ImportedData[] = [];

    for (const file of files) {
      if (file.type.startsWith('text/') || file.type.includes('document')) {
        const content = await file.text();
        driveData.push({
          id: crypto.randomUUID(),
          source: 'drive',
          timestamp: new Date(),
          content,
          metadata: {
            tags: [file.type],
          },
        });
      }
    }

    return driveData;
  }

  /**
   * 解析 YouTube 历史记录
   */
  async parseYoutubeData(file: File): Promise<ImportedData[]> {
    const text = await file.text();
    const data = JSON.parse(text);
    
    return data.map((item: any) => ({
      id: crypto.randomUUID(),
      source: 'youtube',
      timestamp: new Date(item.time),
      content: item.title,
      metadata: {
        tags: ['video', 'watch-history'],
        date: item.time,
      },
    }));
  }

  /**
   * 获取统计信息
   */
  async getImportStats(userId: string): Promise<GoogleImportStats> {
  const response = await this.safeFetch(`${this.apiEndpoint}/stats?userId=${encodeURIComponent(userId)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch import stats');
    }

    return response.json();
  }

  /**
   * 删除导入的数据
   */
  async deleteImportedData(importId: string): Promise<void> {
    const response = await this.safeFetch(`${this.apiEndpoint}/${importId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete imported data');
    }
  }

  private extractField(text: string, field: string): string {
    const regex = new RegExp(`${field}:\\s*(.+?)(?=\\n[A-Z]|\\n\\n)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
}

export const googleDataImportService = new GoogleDataImportService();
