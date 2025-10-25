/**
 * Phase 1: Deep Persona Profile Analyzer
 * 
 * Extracts 6-layer personality traits from user's memory data:
 * - Core Identity (values, beliefs, experiences)
 * - Cognitive Style (reasoning, decision-making)
 * - Linguistic Signature (vocabulary, style, patterns)
 * - Emotional Profile (mood, expressiveness, empathy)
 * - Social Dynamics (introversion, conflict handling)
 * - Temporal & Context (active hours, life phase)
 */

import { getDB } from "../db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface DeepPersonaProfile {
  userId: string;
  
  // Layer 1: Core Identity
  coreValues?: string[]; // ["authenticity", "growth", "connection"]
  beliefsWorldview?: Record<string, any>;
  lifeExperiences?: Array<{ event: string; impact: string; year?: number }>;
  educationalBackground?: string;
  professionalIdentity?: string;
  
  // Layer 2: Cognitive Style
  reasoningPatterns?: string; // "analytical" | "intuitive" | "holistic"
  decisionMakingStyle?: string; // "deliberate" | "spontaneous"
  problemSolvingApproach?: string;
  learningPreference?: string; // "visual" | "experiential"
  
  // Layer 3: Linguistic Signature
  vocabularyLevel?: string; // "casual" | "professional" | "academic"
  sentenceStructure?: string; // "simple" | "complex"
  punctuationStyle?: string; // "minimal" | "expressive"
  emojiUsage?: number; // 0-1
  slangFrequency?: number; // 0-1
  avgMessageLength?: number;
  formalityScore?: number; // 0-1
  humorStyle?: string; // "sarcastic" | "wholesome" | "dry" | "none"
  
  // Layer 4: Emotional Profile
  baselineMood?: string; // "optimistic" | "neutral" | "cautious"
  emotionalExpressiveness?: number; // 0-1
  empathyLevel?: number; // 0-1
  stressResponsePattern?: string;
  emotionalTriggers?: string[];
  
  // Layer 5: Social Dynamics
  introversionExtroversion?: number; // 0=introvert, 1=extrovert
  conflictHandlingStyle?: string; // "avoidant" | "collaborative" | "assertive"
  communicationDirectness?: number; // 0-1
  socialEnergyPattern?: string;
  
  // Layer 6: Temporal & Context
  activeHours?: Array<{ start: number; end: number }>;
  timezone?: string;
  culturalContext?: string;
  currentLifePhase?: string;
  
  // Metadata
  confidenceScore?: number; // 0-1
  lastUpdated?: number;
  updateCount?: number;
}

export interface AnalysisConfig {
  useAI?: boolean; // Use AI for deep analysis (slower but more accurate)
  sampleSize?: number; // Number of messages to analyze
  minConfidence?: number; // Minimum confidence to accept a trait
}

/**
 * Extract linguistic features from user messages
 */
async function extractLinguisticSignature(
  userId: string,
  config: AnalysisConfig = {}
): Promise<Partial<DeepPersonaProfile>> {
  const db = getDB();
  const limit = config.sampleSize || 500;
  
  // Get recent messages from chunks
  const messages = db.prepare(`
    SELECT text, metadata 
    FROM chunks 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `).all(userId, limit) as Array<{ text: string; metadata: string }>;
  
  if (messages.length === 0) {
    return { confidenceScore: 0 };
  }
  
  // Calculate statistical features
  let totalLength = 0;
  let emojiCount = 0;
  let punctuationCount = 0;
  let slangCount = 0;
  let totalChars = 0;
  
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const expressivePunctuation = /[!?]{2,}|\.{3,}/g;
  const commonSlang = /\b(lol|omg|btw|tbh|imo|idk|ngl|fr|lowkey|highkey|vibes?|mood|slay|cap|no cap|bet|sus|bruh|fam)\b/gi;
  
  for (const msg of messages) {
    const text = msg.text || "";
    totalLength += text.split(/\s+/).length; // word count
    totalChars += text.length;
    emojiCount += (text.match(emojiRegex) || []).length;
    punctuationCount += (text.match(expressivePunctuation) || []).length;
    slangCount += (text.match(commonSlang) || []).length;
  }
  
  const avgMessageLength = totalLength / messages.length;
  const emojiUsage = Math.min(1, emojiCount / messages.length);
  const slangFrequency = Math.min(1, slangCount / messages.length);
  const avgCharsPerMessage = totalChars / messages.length;
  
  // Estimate formality (inverse of slang + emoji usage)
  const formalityScore = Math.max(0, 1 - (emojiUsage + slangFrequency) / 2);
  
  // Estimate punctuation style
  const punctuationStyle = punctuationCount / messages.length > 0.3 ? "expressive" : "minimal";
  
  // Estimate sentence structure (complex if avg length > 20 words)
  const sentenceStructure = avgMessageLength > 20 ? "complex" : "simple";
  
  // Estimate vocabulary level based on formality and length
  let vocabularyLevel = "casual";
  if (formalityScore > 0.7 && avgMessageLength > 15) {
    vocabularyLevel = "professional";
  } else if (formalityScore > 0.85 && avgMessageLength > 25) {
    vocabularyLevel = "academic";
  }
  
  return {
    vocabularyLevel,
    sentenceStructure,
    punctuationStyle,
    emojiUsage,
    slangFrequency,
    avgMessageLength,
    formalityScore,
    confidenceScore: 0.7, // Statistical analysis confidence
  };
}

/**
 * Extract emotional profile from message content
 */
async function extractEmotionalProfile(
  userId: string,
  config: AnalysisConfig = {}
): Promise<Partial<DeepPersonaProfile>> {
  const db = getDB();
  const limit = config.sampleSize || 200;
  
  // Get messages with emotional context
  const samples = db.prepare(`
    SELECT emotional_context, conversation_context, user_response
    FROM personality_training_samples
    WHERE user_id = ? AND emotional_context IS NOT NULL
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit) as Array<{ 
    emotional_context: string; 
    conversation_context: string;
    user_response: string;
  }>;
  
  if (samples.length === 0) {
    return { confidenceScore: 0.3 };
  }
  
  // Count emotional expressions
  const positiveWords = /\b(happy|excited|love|joy|great|awesome|wonderful|amazing|thanks|grateful)\b/gi;
  const negativeWords = /\b(sad|angry|frustrated|upset|disappointed|worried|anxious|stress|hate)\b/gi;
  const empatheticWords = /\b(understand|feel|sorry|support|here for|care|concern|empathize)\b/gi;
  
  let positiveCount = 0;
  let negativeCount = 0;
  let empatheticCount = 0;
  let expressiveCount = 0; // Count of emotionally charged messages
  
  for (const sample of samples) {
    const text = (sample.user_response || "") + " " + (sample.emotional_context || "");
    positiveCount += (text.match(positiveWords) || []).length;
    negativeCount += (text.match(negativeWords) || []).length;
    empatheticCount += (text.match(empatheticWords) || []).length;
    
    // Check if message is emotionally expressive
    if (text.match(/[!?]{1,}/) || text.match(positiveWords) || text.match(negativeWords)) {
      expressiveCount++;
    }
  }
  
  // Calculate scores
  const emotionalExpressiveness = Math.min(1, expressiveCount / samples.length);
  const empathyLevel = Math.min(1, empatheticCount / (samples.length * 0.5)); // normalize
  
  // Determine baseline mood
  let baselineMood = "neutral";
  const positiveRatio = positiveCount / Math.max(1, positiveCount + negativeCount);
  if (positiveRatio > 0.6) {
    baselineMood = "optimistic";
  } else if (positiveRatio < 0.4) {
    baselineMood = "cautious";
  }
  
  return {
    baselineMood,
    emotionalExpressiveness,
    empathyLevel,
    confidenceScore: 0.6,
  };
}

/**
 * Extract social dynamics from interaction patterns
 */
async function extractSocialDynamics(
  userId: string,
  config: AnalysisConfig = {}
): Promise<Partial<DeepPersonaProfile>> {
  const db = getDB();
  
  // Get interaction frequency and patterns
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_messages,
      COUNT(DISTINCT DATE(created_at / 1000, 'unixepoch')) as active_days,
      AVG(LENGTH(user_response)) as avg_length
    FROM personality_training_samples
    WHERE user_id = ?
  `).get(userId) as { total_messages: number; active_days: number; avg_length: number };
  
  // Estimate introversion/extroversion based on message frequency
  const messagesPerDay = stats.total_messages / Math.max(1, stats.active_days);
  const introversionExtroversion = Math.min(1, messagesPerDay / 20); // Normalize (20+ msgs/day = extrovert)
  
  // Estimate communication directness from message length and structure
  const communicationDirectness = stats.avg_length < 50 ? 0.7 : 0.4; // Shorter = more direct
  
  return {
    introversionExtroversion,
    communicationDirectness,
    confidenceScore: 0.5,
  };
}

/**
 * Use AI to extract deep personality traits (expensive, high quality)
 */
async function extractWithAI(
  userId: string,
  config: AnalysisConfig = {}
): Promise<Partial<DeepPersonaProfile>> {
  const db = getDB();
  const limit = config.sampleSize || 100;
  
  // Get representative samples
  const samples = db.prepare(`
    SELECT conversation_context, user_response, emotional_context, target_person
    FROM personality_training_samples
    WHERE user_id = ?
    ORDER BY quality_score DESC
    LIMIT ?
  `).all(userId, limit) as Array<{
    conversation_context: string;
    user_response: string;
    emotional_context?: string;
    target_person?: string;
  }>;
  
  if (samples.length < 10) {
    return { confidenceScore: 0.2 };
  }
  
  // Build context for AI analysis
  const sampleText = samples.slice(0, 20).map((s, i) => 
    `Example ${i + 1}:\nContext: ${s.conversation_context}\nResponse: ${s.user_response}\n`
  ).join("\n");
  
  const prompt = `You are a personality psychologist analyzing a person's communication style and personality traits.

Based on these conversation samples, extract the following personality dimensions:

${sampleText}

Analyze and provide JSON output with these fields:
{
  "coreValues": ["value1", "value2"],
  "reasoningPatterns": "analytical|intuitive|holistic",
  "decisionMakingStyle": "deliberate|spontaneous",
  "humorStyle": "sarcastic|wholesome|dry|none",
  "stressResponsePattern": "description",
  "conflictHandlingStyle": "avoidant|collaborative|assertive",
  "socialEnergyPattern": "description",
  "currentLifePhase": "description"
}

Only include fields you can confidently determine. Be concise.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        confidenceScore: 0.85, // AI analysis high confidence
      };
    }
  } catch (error) {
    console.error("AI analysis failed:", error);
  }
  
  return { confidenceScore: 0.3 };
}

/**
 * Build complete Deep Persona Profile
 */
export async function buildDeepPersonaProfile(
  userId: string,
  config: AnalysisConfig = {}
): Promise<DeepPersonaProfile> {
  console.log(`🔍 Building Deep Persona Profile for user: ${userId}`);
  
  // Run all extractors in parallel
  const [linguistic, emotional, social, aiTraits] = await Promise.all([
    extractLinguisticSignature(userId, config),
    extractEmotionalProfile(userId, config),
    extractSocialDynamics(userId, config),
    config.useAI ? extractWithAI(userId, config) : Promise.resolve({})
  ]);
  
  // Merge all traits
  const profile: DeepPersonaProfile = {
    userId,
    ...linguistic,
    ...emotional,
    ...social,
    ...aiTraits,
    lastUpdated: Date.now(),
    updateCount: 0,
  };
  
  // Calculate overall confidence
  const confidences = [
    linguistic.confidenceScore || 0,
    emotional.confidenceScore || 0,
    social.confidenceScore || 0,
    (aiTraits as Partial<DeepPersonaProfile>).confidenceScore || 0,
  ];
  profile.confidenceScore = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  
  console.log(`✅ Profile built with confidence: ${(profile.confidenceScore! * 100).toFixed(1)}%`);
  
  return profile;
}

/**
 * Save profile to database
 */
export function savePersonaProfile(profile: DeepPersonaProfile) {
  const db = getDB();
  
  // Check if profile exists
  const existing = db.prepare(
    "SELECT update_count FROM persona_profiles WHERE user_id = ?"
  ).get(profile.userId) as { update_count: number } | undefined;
  
  const updateCount = (existing?.update_count || 0) + 1;
  
  db.prepare(`
    INSERT INTO persona_profiles (
      user_id, core_values, beliefs_worldview, life_experiences,
      educational_background, professional_identity,
      reasoning_patterns, decision_making_style, problem_solving_approach, learning_preference,
      vocabulary_level, sentence_structure, punctuation_style, emoji_usage, slang_frequency,
      avg_message_length, formality_score, humor_style,
      baseline_mood, emotional_expressiveness, empathy_level, stress_response_pattern, emotional_triggers,
      introversion_extroversion, conflict_handling_style, communication_directness, social_energy_pattern,
      active_hours, timezone, cultural_context, current_life_phase,
      confidence_score, last_updated, update_count, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(user_id) DO UPDATE SET
      core_values = excluded.core_values,
      beliefs_worldview = excluded.beliefs_worldview,
      reasoning_patterns = excluded.reasoning_patterns,
      decision_making_style = excluded.decision_making_style,
      vocabulary_level = excluded.vocabulary_level,
      sentence_structure = excluded.sentence_structure,
      punctuation_style = excluded.punctuation_style,
      emoji_usage = excluded.emoji_usage,
      slang_frequency = excluded.slang_frequency,
      avg_message_length = excluded.avg_message_length,
      formality_score = excluded.formality_score,
      humor_style = excluded.humor_style,
      baseline_mood = excluded.baseline_mood,
      emotional_expressiveness = excluded.emotional_expressiveness,
      empathy_level = excluded.empathy_level,
      stress_response_pattern = excluded.stress_response_pattern,
      introversion_extroversion = excluded.introversion_extroversion,
      conflict_handling_style = excluded.conflict_handling_style,
      communication_directness = excluded.communication_directness,
      social_energy_pattern = excluded.social_energy_pattern,
      current_life_phase = excluded.current_life_phase,
      confidence_score = excluded.confidence_score,
      last_updated = excluded.last_updated,
      update_count = excluded.update_count
  `).run(
    profile.userId,
    JSON.stringify(profile.coreValues || []),
    JSON.stringify(profile.beliefsWorldview || {}),
    JSON.stringify(profile.lifeExperiences || []),
    profile.educationalBackground || null,
    profile.professionalIdentity || null,
    profile.reasoningPatterns || null,
    profile.decisionMakingStyle || null,
    profile.problemSolvingApproach || null,
    profile.learningPreference || null,
    profile.vocabularyLevel || null,
    profile.sentenceStructure || null,
    profile.punctuationStyle || null,
    profile.emojiUsage || null,
    profile.slangFrequency || null,
    profile.avgMessageLength || null,
    profile.formalityScore || null,
    profile.humorStyle || null,
    profile.baselineMood || null,
    profile.emotionalExpressiveness || null,
    profile.empathyLevel || null,
    profile.stressResponsePattern || null,
    JSON.stringify(profile.emotionalTriggers || []),
    profile.introversionExtroversion || null,
    profile.conflictHandlingStyle || null,
    profile.communicationDirectness || null,
    profile.socialEnergyPattern || null,
    JSON.stringify(profile.activeHours || []),
    profile.timezone || null,
    profile.culturalContext || null,
    profile.currentLifePhase || null,
    profile.confidenceScore || 0.5,
    profile.lastUpdated || Date.now(),
    updateCount,
    existing ? undefined : Date.now()
  );
  
  console.log(`💾 Persona profile saved for user: ${profile.userId} (update #${updateCount})`);
}

/**
 * Load profile from database
 */
export function loadPersonaProfile(userId: string): DeepPersonaProfile | null {
  const db = getDB();
  
  const row = db.prepare(`
    SELECT * FROM persona_profiles WHERE user_id = ?
  `).get(userId) as any;
  
  if (!row) return null;
  
  return {
    userId: row.user_id,
    coreValues: JSON.parse(row.core_values || "[]"),
    beliefsWorldview: JSON.parse(row.beliefs_worldview || "{}"),
    lifeExperiences: JSON.parse(row.life_experiences || "[]"),
    educationalBackground: row.educational_background,
    professionalIdentity: row.professional_identity,
    reasoningPatterns: row.reasoning_patterns,
    decisionMakingStyle: row.decision_making_style,
    problemSolvingApproach: row.problem_solving_approach,
    learningPreference: row.learning_preference,
    vocabularyLevel: row.vocabulary_level,
    sentenceStructure: row.sentence_structure,
    punctuationStyle: row.punctuation_style,
    emojiUsage: row.emoji_usage,
    slangFrequency: row.slang_frequency,
    avgMessageLength: row.avg_message_length,
    formalityScore: row.formality_score,
    humorStyle: row.humor_style,
    baselineMood: row.baseline_mood,
    emotionalExpressiveness: row.emotional_expressiveness,
    empathyLevel: row.empathy_level,
    stressResponsePattern: row.stress_response_pattern,
    emotionalTriggers: JSON.parse(row.emotional_triggers || "[]"),
    introversionExtroversion: row.introversion_extroversion,
    conflictHandlingStyle: row.conflict_handling_style,
    communicationDirectness: row.communication_directness,
    socialEnergyPattern: row.social_energy_pattern,
    activeHours: JSON.parse(row.active_hours || "[]"),
    timezone: row.timezone,
    culturalContext: row.cultural_context,
    currentLifePhase: row.current_life_phase,
    confidenceScore: row.confidence_score,
    lastUpdated: row.last_updated,
    updateCount: row.update_count,
  };
}
