// Frontend client for Self_AI_Agent backend API
function getAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const token = parsed?.state?.token || parsed?.token;
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  } catch {
    return {};
  }
}

export type FE_MemoryItem = {
  id: string;
  type: "text" | "image" | "video" | "audio" | "link";
  content?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
};

export type FE_PersonaProfile = {
  userId: string;
  name?: string;
  bio?: string;
  tone?: string;
  speakingStyle?: string;
  topics?: string[];
  languages?: string[];
};

// Extension: Training configuration
export interface TrainingConfig {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-sonnet';
  learningRate: number;
  epochs: number;
  batchSize: number;
  temperature: number;
  maxTokens: number;
}

// Extension: Training progress
export interface TrainingProgress {
  stage: 'preparing' | 'embedding' | 'training' | 'validating' | 'deploying' | 'completed' | 'failed';
  progress: number;
  currentEpoch?: number;
  totalEpochs?: number;
  loss?: number;
  accuracy?: number;
  estimatedTimeRemaining?: number;
  message?: string;
  error?: string;
}

export type TrainingJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface TrainingJob {
  id: string;
  userId: string;
  status: TrainingJobStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
  modelId?: string;
}

// Extension: Agent Profile
export interface SelfAgentProfile {
  id: string;
  name: string;
  version: string;
  trainedOn: Date;
  dataSourcesUsed: string[];
  totalTrainingItems: number;
  modelConfig: TrainingConfig;
  capabilities: string[];
  personalityTraits: {
    tone: 'professional' | 'casual' | 'friendly' | 'formal';
    verbosity: 'concise' | 'balanced' | 'detailed';
    creativity: number;
  };
}

export async function trainSelfAgent(params: {
  userId: string;
  memories: FE_MemoryItem[];
  profile?: FE_PersonaProfile;
  config?: Partial<TrainingConfig>;
}): Promise<TrainingJob> {
  const res = await fetch(`/api/self-agent/train`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Train failed: ${res.status}`);
  return res.json();
}

export async function getTrainingStatus(jobId: string): Promise<TrainingJob> {
  const res = await fetch(`/api/self-agent/status/${jobId}`);
  if (!res.ok) throw new Error(`Status failed: ${res.status}`);
  return res.json();
}

export async function generateChat(params: {
  userId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  hint?: string;
}) {
  const res = await fetch(`/api/self-agent/generate/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
  return res.json();
}

// New: Streaming conversation
export async function* chatStream(params: {
  userId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  useContext?: boolean;
}): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`/api/self-agent/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`Stream failed: ${res.status}`);

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            yield parsed.content;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// New: Get Agent Profile
export async function getAgentProfile(userId: string): Promise<SelfAgentProfile | null> {
  const res = await fetch(`/api/self-agent/profile/${userId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Profile failed: ${res.status}`);
  return res.json();
}

// New: Search memories
export async function searchMemories(userId: string, query: string, limit: number = 5) {
  const res = await fetch(
    `/api/self-agent/memories/search?userId=${userId}&q=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}


export async function generatePost(params: {
  userId: string;
  context?: string;
  mediaHint?: Array<{ type: FE_MemoryItem["type"]; content?: string }>;
}) {
  const res = await fetch(`/api/self-agent/generate/post`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Generate post failed: ${res.status}`);
  return res.json() as Promise<{ text: string }>;
}

export interface ProviderInfo {
  provider: string;
  model: string;
  geminiConfigured: boolean;
}

export async function getProviderInfo(): Promise<ProviderInfo> {
  const res = await fetch(`/api/self-agent/provider-info`);
  if (!res.ok) throw new Error(`Provider info failed: ${res.status}`);
  return res.json();
}

export async function testProviderConnection(params?: { prompt?: string; userId?: string }) {
  const res = await fetch(`/api/self-agent/provider-info/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(params ?? {}),
  });
  if (!res.ok) throw new Error(`Provider test failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; provider: string; model: string; sample?: string }>;
}

export async function importGoogleTakeout(params: { userId: string; dir: string }) {
  const res = await fetch(`/api/self-agent/import/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Import failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; stats: { files: number; docs: number; chunks: number } }>;
}

// ===== Training samples management (frontend) =====

export async function apiGenerateTrainingSamples(params: {
  userId: string;
  source?: 'instagram' | 'google' | 'wechat' | 'all';
  minQuality?: number;
  maxSamples?: number;
  jaccardThreshold?: number;
  semanticThreshold?: number;
}) {
  const res = await fetch(`/api/self-agent/training/generate-samples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`generate-samples failed: ${res.status}`);
  return res.json() as Promise<{ success: boolean; samplesCreated: number; stats: any }>;
}

export async function apiListTrainingSamples(params: {
  userId: string;
  limit?: number;
  offset?: number;
  style?: string;
  intent?: string;
  source?: string;
  template?: 0 | 1;
  order?: 'created_at_desc' | 'quality_desc';
}) {
  const qs = new URLSearchParams();
  qs.set('userId', params.userId);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  if (params.style) qs.set('style', params.style);
  if (params.intent) qs.set('intent', params.intent);
  if (params.source) qs.set('source', params.source);
  if (typeof params.template === 'number') qs.set('template', String(params.template));
  if (params.order) qs.set('order', params.order);
  const res = await fetch(`/api/self-agent/training/samples?${qs.toString()}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error(`list-samples failed: ${res.status}`);
  return res.json() as Promise<{ total: number; items: Array<any> }>;
}

export async function apiDeleteTrainingSample(id: string) {
  const res = await fetch(`/api/self-agent/training/sample/${id}`, { method: 'DELETE', headers: getAuthHeader() });
  if (!res.ok) throw new Error(`delete-sample failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; changes: number }>;
}

// ===== Evaluation & A/B (frontend) =====

export async function apiEvalRun(params: { userId: string; source?: 'training_samples' | 'adhoc'; limit?: number; prompts?: string[]; mode?: 'retrieval-summary' | 'model' }) {
  const res = await fetch(`/api/self-agent/eval/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`eval-run failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; runId: string; summary: any; total: number }>;
}

export async function apiEvalGetRun(runId: string) {
  const res = await fetch(`/api/self-agent/eval/run/${runId}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error(`eval-get-run failed: ${res.status}`);
  return res.json() as Promise<{ run: any; items: any[] }>;
}

export function apiEvalExportUrl(runId: string, ext: 'json' | 'csv') {
  return `/api/self-agent/eval/exports/${runId}.${ext}`;
}

export async function apiAbGenerate(params: { userId: string; prompts: string[]; modelA: string; modelB: string }) {
  const res = await fetch(`/api/self-agent/eval/ab/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`ab-generate failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean; count: number }>;
}

export async function apiAbList(userId: string) {
  const res = await fetch(`/api/self-agent/eval/ab/list?userId=${encodeURIComponent(userId)}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error(`ab-list failed: ${res.status}`);
  return res.json() as Promise<{ items: any[] }>;
}

export async function apiAbVote(params: { pairId: string; choice: 'A' | 'B' | 'tie' | 'skip' }) {
  const res = await fetch(`/api/self-agent/eval/ab/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`ab-vote failed: ${res.status}`);
  return res.json() as Promise<{ ok: boolean }>;
}
