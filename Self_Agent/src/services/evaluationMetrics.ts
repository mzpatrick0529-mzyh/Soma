/**
 * Phase 0: Comprehensive Evaluation Metrics
 * 
 * Multi-dimensional evaluation for persona similarity:
 * - Embedding distance (semantic similarity)
 * - Style consistency (linguistic patterns)
 * - BLEU/ROUGE (n-gram overlap)
 * - Relationship adaptation (context-aware appropriateness)
 */

import { getDB } from "../db";
import { embedText } from "../pipeline/embeddings";
import { loadPersonaProfile } from "./profileAnalyzer";
import { loadRelationshipProfile } from "./relationshipAnalyzer";
import crypto from "crypto";

export interface EvaluationResult {
  id: string;
  userId: string;
  modelVersion: string;
  evalType: string; // "baseline" | "comparison" | "ab_test"
  
  // Persona Similarity Metrics
  embeddingDistance?: number; // cosine distance 0-1
  styleConsistencyScore?: number; // 0-1
  vocabOverlapScore?: number; // 0-1
  sentenceStructureSimilarity?: number; // 0-1
  
  // Content Quality Metrics
  bleuScore?: number; // 0-1
  rougeScore?: number; // 0-1
  perplexity?: number;
  factualAccuracy?: number; // 0-1
  
  // Relationship Adaptation Metrics
  relationshipAwarenessScore?: number; // 0-1
  formalityAdaptationAccuracy?: number; // 0-1
  emotionalAppropriateNess?: number; // 0-1
  
  // Aggregate Scores
  overallPersonaSimilarity?: number; // 0-1
  turingTestPassRate?: number; // 0-1
  
  // Test Details
  numTestSamples: number;
  testSampleIds?: string[];
  detailedResults?: Record<string, any>;
  
  createdAt: number;
}

export interface TestSample {
  id: string;
  prompt: string;
  groundTruth: string;
  prediction: string;
  targetPerson?: string;
  context?: string;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vector length mismatch");
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate embedding distance (1 - cosine similarity)
 */
export async function calculateEmbeddingDistance(
  text1: string,
  text2: string
): Promise<number> {
  const [emb1, emb2] = await Promise.all([
    embedText(text1),
    embedText(text2)
  ]);
  
  const similarity = cosineSimilarity(emb1, emb2);
  return 1 - similarity; // Distance = 1 - similarity
}

/**
 * Calculate BLEU score (n-gram precision)
 */
export function calculateBLEU(
  reference: string,
  candidate: string,
  n: number = 4
): number {
  const refTokens = reference.toLowerCase().split(/\s+/);
  const candTokens = candidate.toLowerCase().split(/\s+/);
  
  if (candTokens.length === 0) return 0;
  
  let totalPrecision = 0;
  
  for (let i = 1; i <= n; i++) {
    const refNgrams = new Set<string>();
    const candNgrams = new Map<string, number>();
    
    // Generate n-grams
    for (let j = 0; j <= refTokens.length - i; j++) {
      refNgrams.add(refTokens.slice(j, j + i).join(" "));
    }
    
    for (let j = 0; j <= candTokens.length - i; j++) {
      const ngram = candTokens.slice(j, j + i).join(" ");
      candNgrams.set(ngram, (candNgrams.get(ngram) || 0) + 1);
    }
    
    // Calculate precision
    let matches = 0;
    let total = 0;
    for (const [ngram, count] of candNgrams) {
      total += count;
      if (refNgrams.has(ngram)) {
        matches += count;
      }
    }
    
    totalPrecision += total > 0 ? matches / total : 0;
  }
  
  return totalPrecision / n;
}

/**
 * Calculate ROUGE-L score (longest common subsequence)
 */
export function calculateROUGE(
  reference: string,
  candidate: string
): number {
  const refTokens = reference.toLowerCase().split(/\s+/);
  const candTokens = candidate.toLowerCase().split(/\s+/);
  
  // Dynamic programming for LCS
  const m = refTokens.length;
  const n = candTokens.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (refTokens[i - 1] === candTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const lcs = dp[m][n];
  const precision = lcs / n;
  const recall = lcs / m;
  
  if (precision + recall === 0) return 0;
  
  // F1 score
  return 2 * (precision * recall) / (precision + recall);
}

/**
 * Calculate style consistency score
 */
export function calculateStyleConsistency(
  groundTruth: string,
  prediction: string,
  userProfile?: any
): number {
  let score = 0;
  let checks = 0;
  
  const truthLower = groundTruth.toLowerCase();
  const predLower = prediction.toLowerCase();
  
  // Check emoji usage
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
  const truthEmojis = (groundTruth.match(emojiRegex) || []).length;
  const predEmojis = (prediction.match(emojiRegex) || []).length;
  
  if (userProfile?.emojiUsage !== undefined) {
    const expectedEmojis = userProfile.emojiUsage * 5; // Rough estimate
    const predDiff = Math.abs(predEmojis - expectedEmojis);
    score += Math.max(0, 1 - predDiff / 5);
    checks++;
  }
  
  // Check punctuation style
  const truthExclaim = (groundTruth.match(/[!?]{1,}/g) || []).length;
  const predExclaim = (prediction.match(/[!?]{1,}/g) || []).length;
  score += Math.max(0, 1 - Math.abs(truthExclaim - predExclaim) / 3);
  checks++;
  
  // Check message length similarity
  const lengthRatio = Math.min(prediction.length, groundTruth.length) / 
                      Math.max(prediction.length, groundTruth.length);
  score += lengthRatio;
  checks++;
  
  // Check formality (slang usage)
  const slangWords = /\b(lol|omg|btw|tbh|imo|idk|bruh|fam)\b/gi;
  const truthSlang = (truthLower.match(slangWords) || []).length;
  const predSlang = (predLower.match(slangWords) || []).length;
  score += Math.max(0, 1 - Math.abs(truthSlang - predSlang) / 2);
  checks++;
  
  return score / checks;
}

/**
 * Calculate vocabulary overlap
 */
export function calculateVocabOverlap(
  groundTruth: string,
  prediction: string
): number {
  const truthWords = new Set(groundTruth.toLowerCase().split(/\s+/));
  const predWords = new Set(prediction.toLowerCase().split(/\s+/));
  
  let intersection = 0;
  for (const word of predWords) {
    if (truthWords.has(word)) intersection++;
  }
  
  const union = truthWords.size + predWords.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Calculate relationship adaptation accuracy
 */
export function calculateRelationshipAdaptation(
  sample: TestSample,
  userId: string
): number {
  if (!sample.targetPerson) return 0.5; // No target = neutral score
  
  const relationship = loadRelationshipProfile(userId, sample.targetPerson);
  if (!relationship) return 0.5;
  
  let score = 0;
  let checks = 0;
  
  const predLower = sample.prediction.toLowerCase();
  
  // Check formality adaptation
  const formalWords = /\b(please|kindly|regards|thank you)\b/gi;
  const casualWords = /\b(hey|yeah|lol|haha)\b/gi;
  
  const predFormality = (predLower.match(formalWords) || []).length / 
                       Math.max(1, (predLower.match(casualWords) || []).length);
  
  const expectedFormality = relationship.formalityWithPerson;
  const formalityMatch = 1 - Math.abs(predFormality - expectedFormality);
  score += Math.max(0, formalityMatch);
  checks++;
  
  // Check expressiveness adaptation
  const emotionalWords = /\b(love|happy|excited|worried|sad)\b/gi;
  const predExpressiveness = (predLower.match(emotionalWords) || []).length / 
                            Math.max(1, sample.prediction.split(/\s+/).length) * 10;
  
  const expectedExpressiveness = relationship.expressivenessLevel;
  const expressivenessMatch = 1 - Math.abs(predExpressiveness - expectedExpressiveness);
  score += Math.max(0, expressivenessMatch);
  checks++;
  
  return score / checks;
}

/**
 * Evaluate a single test sample
 */
export async function evaluateSample(
  sample: TestSample,
  userId: string
): Promise<Record<string, number>> {
  const userProfile = loadPersonaProfile(userId);
  
  const [embeddingDistance, bleu, rouge, styleConsistency, vocabOverlap, relationshipAdaptation] = await Promise.all([
    calculateEmbeddingDistance(sample.groundTruth, sample.prediction),
    Promise.resolve(calculateBLEU(sample.groundTruth, sample.prediction)),
    Promise.resolve(calculateROUGE(sample.groundTruth, sample.prediction)),
    Promise.resolve(calculateStyleConsistency(sample.groundTruth, sample.prediction, userProfile)),
    Promise.resolve(calculateVocabOverlap(sample.groundTruth, sample.prediction)),
    Promise.resolve(calculateRelationshipAdaptation(sample, userId))
  ]);
  
  return {
    embeddingDistance,
    bleu,
    rouge,
    styleConsistency,
    vocabOverlap,
    relationshipAdaptation
  };
}

/**
 * Run comprehensive evaluation on test samples
 */
export async function runEvaluation(
  userId: string,
  modelVersion: string,
  testSamples: TestSample[],
  evalType: string = "baseline"
): Promise<EvaluationResult> {
  console.log(`📊 Starting evaluation for user ${userId}, model ${modelVersion}`);
  console.log(`   Test samples: ${testSamples.length}`);
  
  const detailedResults: Record<string, any>[] = [];
  
  let totalEmbeddingDistance = 0;
  let totalBleu = 0;
  let totalRouge = 0;
  let totalStyleConsistency = 0;
  let totalVocabOverlap = 0;
  let totalRelationshipAdaptation = 0;
  
  for (const sample of testSamples) {
    const metrics = await evaluateSample(sample, userId);
    
    totalEmbeddingDistance += metrics.embeddingDistance;
    totalBleu += metrics.bleu;
    totalRouge += metrics.rouge;
    totalStyleConsistency += metrics.styleConsistency;
    totalVocabOverlap += metrics.vocabOverlap;
    totalRelationshipAdaptation += metrics.relationshipAdaptation;
    
    detailedResults.push({
      sampleId: sample.id,
      metrics
    });
  }
  
  const n = testSamples.length;
  
  // Calculate averages
  const embeddingDistance = totalEmbeddingDistance / n;
  const bleuScore = totalBleu / n;
  const rougeScore = totalRouge / n;
  const styleConsistencyScore = totalStyleConsistency / n;
  const vocabOverlapScore = totalVocabOverlap / n;
  const relationshipAwarenessScore = totalRelationshipAdaptation / n;
  
  // Calculate aggregate scores
  const overallPersonaSimilarity = (
    (1 - embeddingDistance) * 0.3 +  // Semantic similarity
    bleuScore * 0.15 +
    rougeScore * 0.15 +
    styleConsistencyScore * 0.25 +   // Style is important
    vocabOverlapScore * 0.15
  );
  
  // Turing test pass rate (heuristic: if overall > 0.75, likely to pass)
  const turingTestPassRate = overallPersonaSimilarity > 0.75 ? 0.8 : overallPersonaSimilarity * 0.9;
  
  const result: EvaluationResult = {
    id: crypto.randomUUID(),
    userId,
    modelVersion,
    evalType,
    embeddingDistance,
    styleConsistencyScore,
    vocabOverlapScore,
    bleuScore,
    rougeScore,
    relationshipAwarenessScore,
    overallPersonaSimilarity,
    turingTestPassRate,
    numTestSamples: n,
    testSampleIds: testSamples.map(s => s.id),
    detailedResults: { samples: detailedResults },
    createdAt: Date.now()
  };
  
  console.log(`✅ Evaluation complete:`);
  console.log(`   Overall Similarity: ${(overallPersonaSimilarity * 100).toFixed(1)}%`);
  console.log(`   Style Consistency: ${(styleConsistencyScore * 100).toFixed(1)}%`);
  console.log(`   Relationship Awareness: ${(relationshipAwarenessScore * 100).toFixed(1)}%`);
  console.log(`   Turing Test Pass Rate: ${(turingTestPassRate * 100).toFixed(1)}%`);
  
  return result;
}

/**
 * Save evaluation result to database
 */
export function saveEvaluationResult(result: EvaluationResult) {
  const db = getDB();
  
  db.prepare(`
    INSERT INTO evaluation_metrics (
      id, user_id, model_version, eval_type,
      embedding_distance, style_consistency_score, vocab_overlap_score, sentence_structure_similarity,
      bleu_score, rouge_score, perplexity, factual_accuracy,
      relationship_awareness_score, formality_adaptation_accuracy, emotional_appropriateness,
      overall_persona_similarity, turing_test_pass_rate,
      num_test_samples, test_sample_ids, detailed_results,
      created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `).run(
    result.id,
    result.userId,
    result.modelVersion,
    result.evalType,
    result.embeddingDistance || null,
    result.styleConsistencyScore || null,
    result.vocabOverlapScore || null,
    result.sentenceStructureSimilarity || null,
    result.bleuScore || null,
    result.rougeScore || null,
    result.perplexity || null,
    result.factualAccuracy || null,
    result.relationshipAwarenessScore || null,
    result.formalityAdaptationAccuracy || null,
    result.emotionalAppropriateNess || null,
    result.overallPersonaSimilarity || null,
    result.turingTestPassRate || null,
    result.numTestSamples,
    JSON.stringify(result.testSampleIds || []),
    JSON.stringify(result.detailedResults || {}),
    result.createdAt
  );
  
  console.log(`💾 Evaluation result saved: ${result.id}`);
}

/**
 * Compare two model versions
 */
export function compareModels(
  userId: string,
  version1: string,
  version2: string
): {
  version1: EvaluationResult | null;
  version2: EvaluationResult | null;
  improvement: Record<string, number>;
} {
  const db = getDB();
  
  const result1 = db.prepare(`
    SELECT * FROM evaluation_metrics
    WHERE user_id = ? AND model_version = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(userId, version1) as any;
  
  const result2 = db.prepare(`
    SELECT * FROM evaluation_metrics
    WHERE user_id = ? AND model_version = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(userId, version2) as any;
  
  if (!result1 || !result2) {
    return {
      version1: result1 ? parseEvaluationRow(result1) : null,
      version2: result2 ? parseEvaluationRow(result2) : null,
      improvement: {}
    };
  }
  
  const improvement = {
    overallPersonaSimilarity: ((result2.overall_persona_similarity - result1.overall_persona_similarity) / result1.overall_persona_similarity * 100),
    styleConsistency: ((result2.style_consistency_score - result1.style_consistency_score) / result1.style_consistency_score * 100),
    relationshipAwareness: ((result2.relationship_awareness_score - result1.relationship_awareness_score) / result1.relationship_awareness_score * 100),
    turingTestPassRate: ((result2.turing_test_pass_rate - result1.turing_test_pass_rate) / result1.turing_test_pass_rate * 100)
  };
  
  return {
    version1: parseEvaluationRow(result1),
    version2: parseEvaluationRow(result2),
    improvement
  };
}

function parseEvaluationRow(row: any): EvaluationResult {
  return {
    id: row.id,
    userId: row.user_id,
    modelVersion: row.model_version,
    evalType: row.eval_type,
    embeddingDistance: row.embedding_distance,
    styleConsistencyScore: row.style_consistency_score,
    vocabOverlapScore: row.vocab_overlap_score,
    sentenceStructureSimilarity: row.sentence_structure_similarity,
    bleuScore: row.bleu_score,
    rougeScore: row.rouge_score,
    perplexity: row.perplexity,
    factualAccuracy: row.factual_accuracy,
    relationshipAwarenessScore: row.relationship_awareness_score,
    formalityAdaptationAccuracy: row.formality_adaptation_accuracy,
    emotionalAppropriateNess: row.emotional_appropriateness,
    overallPersonaSimilarity: row.overall_persona_similarity,
    turingTestPassRate: row.turing_test_pass_rate,
    numTestSamples: row.num_test_samples,
    testSampleIds: JSON.parse(row.test_sample_ids || "[]"),
    detailedResults: JSON.parse(row.detailed_results || "{}"),
    createdAt: row.created_at
  };
}
