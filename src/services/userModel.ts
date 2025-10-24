/**
 * 🤖 User-Specific Model Training Service (Frontend)
 * User-specific model training service - frontend API interface
 */

const API_BASE = import.meta.env.VITE_SELF_AGENT_API_BASE || 'http://127.0.0.1:8787';

export interface UserModelMetadata {
  userId: string;
  modelId: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  trainingDataStats: {
    totalDocuments: number;
    totalChunks: number;
    dataSources: string[]; // ['google', 'wechat', 'instagram']
  };
  personaProfile: any;
  status: 'training' | 'ready' | 'error';
  errorMessage?: string;
}

export interface TrainModelResponse {
  success: boolean;
  message: string;
  modelId: string;
  metadata: UserModelMetadata;
}

export interface ModelInfoResponse {
  success: boolean;
  model: UserModelMetadata;
}

export interface RetrainCheckResponse {
  success: boolean;
  shouldRetrain: boolean;
  message: string;
}

/**
 * Train user-specific model
 */
export async function trainUserModel(
  userId: string,
  forceRetrain: boolean = false
): Promise<TrainModelResponse> {
  const response = await fetch(`${API_BASE}/api/user-model/train`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, forceRetrain }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Training failed' }));
    throw new Error(error.error || 'Failed to train user model');
  }

  return response.json();
}

/**
 * Get user model information
 */
export async function getUserModelInfo(userId: string): Promise<ModelInfoResponse> {
  const response = await fetch(`${API_BASE}/api/user-model/info/${userId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get model info' }));
    throw new Error(error.error || 'Failed to get model info');
  }

  return response.json();
}

/**
 * Check if retraining is needed
 */
export async function shouldRetrainModel(userId: string): Promise<RetrainCheckResponse> {
  const response = await fetch(`${API_BASE}/api/user-model/should-retrain/${userId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Check failed' }));
    throw new Error(error.error || 'Failed to check retrain status');
  }

  return response.json();
}

/**
 * Delete user model (GDPR compliant)
 */
export async function deleteUserModel(userId: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/user-model/${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(error.error || 'Failed to delete user model');
  }

  return response.json();
}
