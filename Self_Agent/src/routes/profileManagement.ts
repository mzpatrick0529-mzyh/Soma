/**
 * Profile Management & Evaluation API Routes
 * 
 * Phase 0 & Phase 1 Integration:
 * - Build/update persona profiles
 * - Build/query relationship profiles
 * - Run evaluation metrics
 * - Compare models
 */

import express from "express";
import { 
  buildDeepPersonaProfile, 
  savePersonaProfile, 
  loadPersonaProfile 
} from "../services/profileAnalyzer";
import {
  buildRelationshipProfile,
  buildAllRelationshipProfiles,
  saveRelationshipProfile,
  loadRelationshipProfile,
  getAllRelationships
} from "../services/relationshipAnalyzer";
import {
  runEvaluation,
  saveEvaluationResult,
  compareModels,
  TestSample
} from "../services/evaluationMetrics";

const router = express.Router();

// ============================================================
// Persona Profile Management
// ============================================================

/**
 * POST /api/self-agent/profile/build-persona
 * Build deep persona profile from user's memory data
 */
router.post("/build-persona", async (req, res) => {
  try {
    const { userId, useAI = false, sampleSize = 500 } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    console.log(`🔨 Building persona profile for user: ${userId}`);
    
    const profile = await buildDeepPersonaProfile(userId, { useAI, sampleSize });
    savePersonaProfile(profile);
    
    res.json({
      success: true,
      profile: {
        userId: profile.userId,
        confidenceScore: profile.confidenceScore,
        vocabularyLevel: profile.vocabularyLevel,
        formalityScore: profile.formalityScore,
        emojiUsage: profile.emojiUsage,
        baselineMood: profile.baselineMood,
        emotionalExpressiveness: profile.emotionalExpressiveness,
        introversionExtroversion: profile.introversionExtroversion,
        humorStyle: profile.humorStyle,
        lastUpdated: profile.lastUpdated
      }
    });
  } catch (error: any) {
    console.error("Failed to build persona profile:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/self-agent/profile/persona/:userId
 * Get persona profile
 */
router.get("/persona/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = loadPersonaProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    
    res.json({
      success: true,
      profile
    });
  } catch (error: any) {
    console.error("Failed to load persona profile:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Relationship Profile Management
// ============================================================

/**
 * POST /api/self-agent/profile/build-relationships
 * Build all relationship profiles for a user
 */
router.post("/build-relationships", async (req, res) => {
  try {
    const { userId, useAI = false } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    console.log(`🔨 Building relationship profiles for user: ${userId}`);
    
    const profiles = await buildAllRelationshipProfiles(userId, useAI);
    
    // Save all profiles
    for (const profile of profiles) {
      saveRelationshipProfile(profile);
    }
    
    res.json({
      success: true,
      count: profiles.length,
      relationships: profiles.map(p => ({
        targetPerson: p.targetPerson,
        intimacyLevel: p.intimacyLevel,
        relationshipType: p.relationshipType,
        totalMessages: p.totalMessages
      }))
    });
  } catch (error: any) {
    console.error("Failed to build relationship profiles:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/self-agent/profile/relationships/:userId
 * Get all relationships for a user
 */
router.get("/relationships/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    
    const relationships = getAllRelationships(userId);
    
    res.json({
      success: true,
      count: relationships.length,
      relationships
    });
  } catch (error: any) {
    console.error("Failed to load relationships:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/self-agent/profile/relationship/:userId/:targetPerson
 * Get specific relationship profile
 */
router.get("/relationship/:userId/:targetPerson", (req, res) => {
  try {
    const { userId, targetPerson } = req.params;
    
    const profile = loadRelationshipProfile(userId, decodeURIComponent(targetPerson));
    
    if (!profile) {
      return res.status(404).json({ error: "Relationship not found" });
    }
    
    res.json({
      success: true,
      relationship: profile
    });
  } catch (error: any) {
    console.error("Failed to load relationship:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Evaluation & Metrics
// ============================================================

/**
 * POST /api/self-agent/evaluation/run
 * Run comprehensive evaluation on test samples
 */
router.post("/run", async (req, res) => {
  try {
    const { 
      userId, 
      modelVersion, 
      testSamples, 
      evalType = "baseline" 
    } = req.body;
    
    if (!userId || !modelVersion || !testSamples || !Array.isArray(testSamples)) {
      return res.status(400).json({ 
        error: "userId, modelVersion, and testSamples array are required" 
      });
    }
    
    console.log(`📊 Running evaluation for user ${userId}, model ${modelVersion}`);
    
    const result = await runEvaluation(userId, modelVersion, testSamples, evalType);
    saveEvaluationResult(result);
    
    res.json({
      success: true,
      evaluation: {
        id: result.id,
        overallPersonaSimilarity: result.overallPersonaSimilarity,
        styleConsistencyScore: result.styleConsistencyScore,
        relationshipAwarenessScore: result.relationshipAwarenessScore,
        turingTestPassRate: result.turingTestPassRate,
        bleuScore: result.bleuScore,
        rougeScore: result.rougeScore,
        numTestSamples: result.numTestSamples
      }
    });
  } catch (error: any) {
    console.error("Evaluation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/self-agent/evaluation/compare
 * Compare two model versions
 */
router.post("/compare", (req, res) => {
  try {
    const { userId, version1, version2 } = req.body;
    
    if (!userId || !version1 || !version2) {
      return res.status(400).json({ 
        error: "userId, version1, and version2 are required" 
      });
    }
    
    const comparison = compareModels(userId, version1, version2);
    
    res.json({
      success: true,
      comparison
    });
  } catch (error: any) {
    console.error("Model comparison failed:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/self-agent/evaluation/baseline
 * Establish baseline metrics for current model
 */
router.post("/baseline", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    // Get test samples from database (holdout set)
    const { getDB } = await import("../db");
    const db = getDB();
    
    const samples = db.prepare(`
      SELECT 
        id,
        conversation_context as prompt,
        user_response as groundTruth,
        target_person as targetPerson
      FROM personality_training_samples
      WHERE user_id = ? AND used_for_training = 0
      ORDER BY RANDOM()
      LIMIT 50
    `).all(userId) as Array<{
      id: string;
      prompt: string;
      groundTruth: string;
      targetPerson?: string;
    }>;
    
    if (samples.length < 10) {
      return res.status(400).json({ 
        error: "Insufficient test samples (need at least 10 unused samples)" 
      });
    }
    
    // For baseline, we need to generate predictions
    // Using the current model (simplified - assumes last trained model)
    const modelRow = db.prepare(`
      SELECT model_version 
      FROM personality_models 
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `).get(userId) as { model_version: number } | undefined;
    
    const modelVersion = modelRow ? `v${modelRow.model_version}` : "baseline";
    
    // TODO: Generate predictions using inference engine
    // For now, use ground truth as prediction (placeholder)
    const testSamples: TestSample[] = samples.map(s => ({
      id: s.id,
      prompt: s.prompt,
      groundTruth: s.groundTruth,
      prediction: s.groundTruth, // TODO: Replace with actual inference
      targetPerson: s.targetPerson
    }));
    
    const result = await runEvaluation(userId, modelVersion, testSamples, "baseline");
    saveEvaluationResult(result);
    
    res.json({
      success: true,
      message: "Baseline metrics established",
      evaluation: {
        id: result.id,
        modelVersion,
        overallPersonaSimilarity: result.overallPersonaSimilarity,
        styleConsistencyScore: result.styleConsistencyScore,
        relationshipAwarenessScore: result.relationshipAwarenessScore,
        turingTestPassRate: result.turingTestPassRate,
        numTestSamples: result.numTestSamples
      }
    });
  } catch (error: any) {
    console.error("Baseline evaluation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/self-agent/evaluation/history/:userId
 * Get evaluation history for a user
 */
router.get("/history/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const { getDB } = require("../db");
    const db = getDB();
    
    const results = db.prepare(`
      SELECT 
        id, model_version, eval_type,
        overall_persona_similarity, style_consistency_score,
        relationship_awareness_score, turing_test_pass_rate,
        num_test_samples, created_at
      FROM evaluation_metrics
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, Number(limit));
    
    res.json({
      success: true,
      count: results.length,
      evaluations: results
    });
  } catch (error: any) {
    console.error("Failed to load evaluation history:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
