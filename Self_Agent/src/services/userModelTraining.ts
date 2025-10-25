/**
 * 👤 User-Specific Model Training Service
 * User-specific model training service - each user trains their own AI model independently
 */

import { embedText } from '../pipeline/embeddings.js';
import { buildPersonaProfile, buildPersonaPrompt } from '../pipeline/persona.js';
import { getRecentChunksByUser, getUserDocCount, insertUserModel, getUserModel, updateUserModel } from '../db/index.js';
import { randomUUID } from 'crypto';

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
  personaProfile: any; // PersonaProfile from persona.ts
  status: 'training' | 'ready' | 'error';
  errorMessage?: string;
}

export interface UserModelTrainingResult {
  success: boolean;
  modelId: string;
  metadata: UserModelMetadata;
  message: string;
}

/**
 * Train dedicated model for specified user
 * @param userId User ID
 * @param forceRetrain Whether to force retraining (even if model exists)
 */
export async function trainUserSpecificModel(
  userId: string,
  forceRetrain: boolean = false
): Promise<UserModelTrainingResult> {
  console.log(`[UserModel] Starting training for user: ${userId}`);

  try {
    // 1. Check if model already exists
    const existingModel = getUserModel(userId);
    if (existingModel && !forceRetrain) {
      console.log(`[UserModel] User ${userId} already has a model (version ${existingModel.version})`);
      return {
        success: true,
        modelId: existingModel.model_id,
        metadata: JSON.parse(existingModel.metadata),
        message: 'Using existing model',
      };
    }

    // 2. Get all user data statistics
    const userDocCount = getUserDocCount(userId);
    if (userDocCount === 0) {
      throw new Error('No training data available. Please import data first.');
    }

    // 3. Get user's recent memory fragments (for building persona)
    const recentChunks = getRecentChunksByUser(userId, 500); // Max 500 chunks
    if (recentChunks.length === 0) {
      throw new Error('No memory chunks found for training');
    }

    // 4. Build user persona profile
    console.log(`[UserModel] Building persona profile from ${recentChunks.length} chunks...`);
    const personaProfile = buildPersonaProfile(userId, { maxChunks: 500 });

    // 5. Extract user's data source list
    const dataSources = extractUserDataSources(userId);

    // 6. Generate model ID and version number
    const modelId = `user-${userId}-${randomUUID().slice(0, 8)}`;
    const version = `v${Date.now()}`;
    const now = Date.now();

    // 7. Create model metadata
    const metadata: UserModelMetadata = {
      userId,
      modelId,
      version,
      createdAt: now,
      updatedAt: now,
      trainingDataStats: {
        totalDocuments: userDocCount,
        totalChunks: recentChunks.length,
        dataSources,
      },
      personaProfile,
      status: 'ready',
    };

    // 8. Save model to database
    if (existingModel && forceRetrain) {
      // Update existing model
      updateUserModel(userId, {
        model_id: modelId,
        version,
        metadata: JSON.stringify(metadata),
        updated_at: now,
      });
      console.log(`[UserModel] Updated model for user ${userId}: ${modelId} (${version})`);
    } else {
      // Insert new model
      insertUserModel({
        user_id: userId,
        model_id: modelId,
        version,
        metadata: JSON.stringify(metadata),
        created_at: now,
        updated_at: now,
      });
      console.log(`[UserModel] Created new model for user ${userId}: ${modelId} (${version})`);
    }

    return {
      success: true,
      modelId,
      metadata,
      message: forceRetrain ? 'Model retrained successfully' : 'Model trained successfully',
    };

  } catch (error: any) {
    console.error(`[UserModel] Training failed for user ${userId}:`, error);

    // Record error state
    const errorMetadata: UserModelMetadata = {
      userId,
      modelId: 'error',
      version: 'v0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      trainingDataStats: {
        totalDocuments: 0,
        totalChunks: 0,
        dataSources: [],
      },
      personaProfile: {},
      status: 'error',
      errorMessage: error.message,
    };

    return {
      success: false,
      modelId: '',
      metadata: errorMetadata,
      message: `Training failed: ${error.message}`,
    };
  }
}

/**
 * Get user model information
 */
export function getUserModelInfo(userId: string): UserModelMetadata | null {
  const model = getUserModel(userId);
  if (!model) {
    return null;
  }

  return JSON.parse(model.metadata) as UserModelMetadata;
}

/**
 * Generate response using user-specific model
 */
export function generateWithUserModel(
  userId: string,
  query: string,
  contextChunks: string[]
): string {
  // 1. Get user model metadata
  const modelInfo = getUserModelInfo(userId);
  if (!modelInfo) {
    throw new Error('User model not found. Please train a model first.');
  }

  // 2. Build context
  const context = contextChunks.join('\n\n---\n\n');

  // 3. Extract available data sources
  const availableSources = modelInfo.trainingDataStats.dataSources;

  // 4. Build persona prompt (includes user personalized information)
  const personaPrompt = buildPersonaPrompt(modelInfo.personaProfile, context, availableSources);

  // 5. Combine final prompt
  const finalPrompt = `${personaPrompt}\n\n## User Question\n${query}\n\nPlease answer in first person based on your personality traits and the above memory context:`;

  return finalPrompt;
}

/**
 * Check if user model needs update
 * Rule: If new data volume > 20% of existing data, recommend retraining
 */
export function shouldRetrainUserModel(userId: string): boolean {
  const modelInfo = getUserModelInfo(userId);
  if (!modelInfo) {
    return true; // No model, training needed
  }

  const currentDocCount = getUserDocCount(userId);
  const trainedDocCount = modelInfo.trainingDataStats.totalDocuments;

  // New data threshold: 20%
  const threshold = trainedDocCount * 0.2;
  const newDocs = currentDocCount - trainedDocCount;

  if (newDocs > threshold) {
    console.log(`[UserModel] User ${userId} has ${newDocs} new documents (threshold: ${threshold}), retraining recommended`);
    return true;
  }

  return false;
}

/**
 * Extract all data sources used by user
 */
function extractUserDataSources(userId: string): string[] {
  // Query all document source fields for user from database
  const db = require('../db/index.js').getDb();
  const stmt = db.prepare(`
    SELECT DISTINCT source FROM documents WHERE user_id = ?
  `);
  
  const results = stmt.all(userId) as Array<{ source: string }>;
  return results.map(r => r.source);
}

/**
 * Delete user model (GDPR compliant - users can request AI model deletion)
 */
export function deleteUserModel(userId: string): boolean {
  const db = require('../db/index.js').getDb();
  const stmt = db.prepare(`DELETE FROM user_models WHERE user_id = ?`);
  const result = stmt.run(userId);
  
  console.log(`[UserModel] Deleted model for user ${userId}`);
  return result.changes > 0;
}

/**
 * Get all user model statistics (admin function)
 */
export function getAllUserModelsStats(): Array<{
  userId: string;
  modelId: string;
  version: string;
  status: string;
  dataSourcesCount: number;
  totalDocuments: number;
  lastUpdated: string;
}> {
  const db = require('../db/index.js').getDb();
  const stmt = db.prepare(`SELECT * FROM user_models ORDER BY updated_at DESC`);
  const models = stmt.all();

  return models.map((m: any) => {
    const metadata = JSON.parse(m.metadata) as UserModelMetadata;
    return {
      userId: m.user_id,
      modelId: m.model_id,
      version: m.version,
      status: metadata.status,
      dataSourcesCount: metadata.trainingDataStats.dataSources.length,
      totalDocuments: metadata.trainingDataStats.totalDocuments,
      lastUpdated: new Date(m.updated_at).toISOString(),
    };
  });
}
