/**
 * 🔄 Google Data Import Service
 * Handle Google Takeout data import, parsing and preprocessing
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
        throw new Error(`Cannot connect to backend service (${this.friendlyTarget})，Please confirm Self_AI_Agent is started and listening on the correct port`);
      }
      throw e;
    }
  }

  /**
   * Upload Google Takeout archive file
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

    // Start polling progress
    if (onProgress) {
      this.pollProgress(importId, onProgress);
    }

    return importId;
  }

  /**
   * Polling import progress
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
   * Get import progress
   */
  async getImportProgress(importId: string): Promise<ImportProgress> {
  const response = await this.safeFetch(`${this.apiEndpoint}/progress/${importId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch import progress');
    }

    return response.json();
  }

  /**
   * Parse Gmail data
   */
  async parseGmailData(file: File): Promise<ImportedData[]> {
    const text = await file.text();
    const emails: ImportedData[] = [];

    // Simplified email parsing logic (actual implementation needs more complex MBOX parsing)
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
   * Parse Google Drive files
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
   * Parse YouTube history
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
   * Get statistics
   */
  async getImportStats(userId: string): Promise<GoogleImportStats> {
  const response = await this.safeFetch(`${this.apiEndpoint}/stats?userId=${encodeURIComponent(userId)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch import stats');
    }

    return response.json();
  }

  /**
   * Delete imported data
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
