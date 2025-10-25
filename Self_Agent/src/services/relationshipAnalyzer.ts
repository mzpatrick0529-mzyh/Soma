/**
 * Phase 1: Relationship Profile Analyzer
 * 
 * Builds relationship graph and intimacy scoring for each person
 * the user interacts with. Enables relationship-aware inference.
 */

import { getDB } from "../db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface RelationshipProfile {
  id: string;
  userId: string;
  targetPerson: string;
  
  // Relationship Attributes
  intimacyLevel: number; // 0-1
  relationshipType?: string; // family/friend/colleague/romantic/acquaintance
  relationshipDurationDays?: number;
  interactionFrequency?: string; // daily/weekly/monthly/rare
  
  // Communication Style Adaptation
  formalityWithPerson: number; // 0-1
  expressivenessLevel: number; // 0-1
  humorUsage: number; // 0-1
  topicsDiscussed?: string[];
  
  // Emotional Connection
  emotionalCloseness: number; // 0-1
  trustLevel: number; // 0-1
  sharedExperiences?: Array<{ event: string; date?: number }>;
  conflictHistory?: Array<{ description: string; date: number }>;
  
  // Interaction History
  totalMessages: number;
  lastInteraction?: number;
  positiveInteractions: number;
  negativeInteractions: number;
  
  // Context
  firstMetDate?: number;
  relationshipNotes?: string;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

/**
 * Analyze intimacy level based on message patterns
 */
function calculateIntimacyLevel(
  totalMessages: number,
  avgLength: number,
  emotionalWords: number,
  durationDays: number
): number {
  // Factors:
  // 1. Message frequency (more messages = closer)
  // 2. Message length (longer = more intimate)
  // 3. Emotional language (more emotion = closer)
  // 4. Relationship duration (longer = likely closer)
  
  const frequencyScore = Math.min(1, totalMessages / 100); // Normalize to 0-1
  const lengthScore = Math.min(1, avgLength / 200); // Longer messages = intimate
  const emotionScore = Math.min(1, emotionalWords / 10); // Emotional words count
  const durationScore = Math.min(1, durationDays / 365); // Years of interaction
  
  // Weighted average
  const intimacy = (
    frequencyScore * 0.35 +
    lengthScore * 0.25 +
    emotionScore * 0.25 +
    durationScore * 0.15
  );
  
  return Math.min(1, Math.max(0, intimacy));
}

/**
 * Analyze formality based on language patterns
 */
function calculateFormality(
  messages: Array<{ user_response: string }>
): number {
  let formalIndicators = 0;
  let casualIndicators = 0;
  
  const formalWords = /\b(please|kindly|regards|sincerely|thank you|appreciate|apologize|unfortunately)\b/gi;
  const casualWords = /\b(hey|hi|yeah|yep|nope|gonna|wanna|gotta|kinda|sorta|lol|haha)\b/gi;
  const slang = /\b(omg|btw|tbh|imo|idk|bruh|fam|vibes?)\b/gi;
  
  for (const msg of messages) {
    const text = msg.user_response || "";
    formalIndicators += (text.match(formalWords) || []).length;
    casualIndicators += (text.match(casualWords) || []).length;
    casualIndicators += (text.match(slang) || []).length * 2; // Slang is strong casual indicator
  }
  
  // Calculate formality score (0 = very casual, 1 = very formal)
  const total = formalIndicators + casualIndicators;
  if (total === 0) return 0.5; // Default neutral
  
  return formalIndicators / total;
}

/**
 * Analyze emotional expressiveness with a person
 */
function calculateExpressiveness(
  messages: Array<{ user_response: string; emotional_context?: string }>
): number {
  let expressiveCount = 0;
  
  const emotionalWords = /\b(love|hate|excited|happy|sad|angry|worried|anxious|grateful|proud|miss|hope|fear)\b/gi;
  const exclamations = /[!?]{1,}/g;
  const emoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu;
  
  for (const msg of messages) {
    const text = (msg.user_response || "") + " " + (msg.emotional_context || "");
    
    if (
      text.match(emotionalWords) ||
      text.match(exclamations) ||
      text.match(emoji)
    ) {
      expressiveCount++;
    }
  }
  
  return Math.min(1, expressiveCount / messages.length);
}

/**
 * Analyze humor usage with a person
 */
function calculateHumorUsage(
  messages: Array<{ user_response: string }>
): number {
  let humorCount = 0;
  
  const humorIndicators = /\b(haha|lol|lmao|rofl|funny|joke|kidding|jk|hilarious)\b/gi;
  const sarcasm = /\b(yeah right|sure thing|obviously|totally|definitely)\b/gi;
  
  for (const msg of messages) {
    const text = msg.user_response || "";
    
    if (text.match(humorIndicators) || text.match(sarcasm)) {
      humorCount++;
    }
  }
  
  return Math.min(1, humorCount / messages.length);
}

/**
 * Use AI to infer relationship type
 */
async function inferRelationshipType(
  targetPerson: string,
  samples: Array<{ conversation_context: string; user_response: string }>
): Promise<string> {
  if (samples.length < 3) return "acquaintance";
  
  const sampleText = samples.slice(0, 5).map((s, i) => 
    `Context: ${s.conversation_context}\nResponse: ${s.user_response}\n`
  ).join("\n");
  
  const prompt = `Based on these conversation samples with a person named "${targetPerson}", determine the relationship type.

${sampleText}

Return ONLY one word from: family, friend, colleague, romantic, acquaintance`;
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const type = result.response.text().trim().toLowerCase();
    
    if (["family", "friend", "colleague", "romantic", "acquaintance"].includes(type)) {
      return type;
    }
  } catch (error) {
    console.error("AI relationship type inference failed:", error);
  }
  
  return "acquaintance";
}

/**
 * Build relationship profile for a specific person
 */
export async function buildRelationshipProfile(
  userId: string,
  targetPerson: string,
  useAI: boolean = false
): Promise<RelationshipProfile> {
  const db = getDB();
  
  console.log(`🔍 Building relationship profile: ${userId} <-> ${targetPerson}`);
  
  // Get all messages with this person
  const messages = db.prepare(`
    SELECT 
      conversation_context,
      user_response,
      emotional_context,
      created_at,
      quality_score
    FROM personality_training_samples
    WHERE user_id = ? AND target_person = ?
    ORDER BY created_at ASC
  `).all(userId, targetPerson) as Array<{
    conversation_context: string;
    user_response: string;
    emotional_context?: string;
    created_at: number;
    quality_score?: number;
  }>;
  
  if (messages.length === 0) {
    throw new Error(`No messages found for ${targetPerson}`);
  }
  
  // Calculate statistics
  const firstMessage = messages[0].created_at;
  const lastMessage = messages[messages.length - 1].created_at;
  const durationDays = (lastMessage - firstMessage) / (1000 * 60 * 60 * 24);
  
  const avgLength = messages.reduce((sum, m) => sum + (m.user_response?.length || 0), 0) / messages.length;
  
  const emotionalWords = messages.reduce((sum, m) => {
    const text = (m.user_response || "") + " " + (m.emotional_context || "");
    return sum + (text.match(/\b(love|happy|excited|sad|worried|grateful)\b/gi) || []).length;
  }, 0);
  
  // Calculate intimacy level
  const intimacyLevel = calculateIntimacyLevel(
    messages.length,
    avgLength,
    emotionalWords,
    durationDays
  );
  
  // Calculate communication style metrics
  const formalityWithPerson = calculateFormality(messages);
  const expressivenessLevel = calculateExpressiveness(messages);
  const humorUsage = calculateHumorUsage(messages);
  
  // Infer relationship type
  let relationshipType = "acquaintance";
  if (useAI) {
    relationshipType = await inferRelationshipType(targetPerson, messages);
  } else {
    // Simple heuristic: high intimacy + high expressiveness = friend/family
    if (intimacyLevel > 0.7 && expressivenessLevel > 0.6) {
      relationshipType = "friend";
    } else if (intimacyLevel > 0.4 && formalityWithPerson > 0.6) {
      relationshipType = "colleague";
    }
  }
  
  // Determine interaction frequency
  let interactionFrequency = "rare";
  const messagesPerDay = messages.length / Math.max(1, durationDays);
  if (messagesPerDay > 1) {
    interactionFrequency = "daily";
  } else if (messagesPerDay > 0.2) {
    interactionFrequency = "weekly";
  } else if (messagesPerDay > 0.03) {
    interactionFrequency = "monthly";
  }
  
  // Count positive vs negative interactions
  let positiveInteractions = 0;
  let negativeInteractions = 0;
  
  const positiveWords = /\b(happy|love|thanks|great|awesome|excited)\b/gi;
  const negativeWords = /\b(sad|angry|upset|frustrated|sorry|disappointed)\b/gi;
  
  for (const msg of messages) {
    const text = msg.user_response || "";
    if (text.match(positiveWords)) positiveInteractions++;
    if (text.match(negativeWords)) negativeInteractions++;
  }
  
  // Emotional closeness (similar to intimacy but weighted differently)
  const emotionalCloseness = Math.min(1, (
    intimacyLevel * 0.5 +
    expressivenessLevel * 0.3 +
    (positiveInteractions / Math.max(1, messages.length)) * 0.2
  ));
  
  // Trust level (high quality score + long duration + positive ratio)
  const avgQuality = messages.reduce((sum, m) => sum + (m.quality_score || 0.5), 0) / messages.length;
  const positiveRatio = positiveInteractions / Math.max(1, positiveInteractions + negativeInteractions);
  const trustLevel = Math.min(1, (
    avgQuality * 0.4 +
    Math.min(1, durationDays / 180) * 0.3 +
    positiveRatio * 0.3
  ));
  
  const profile: RelationshipProfile = {
    id: `${userId}_${targetPerson}`,
    userId,
    targetPerson,
    intimacyLevel,
    relationshipType,
    relationshipDurationDays: Math.round(durationDays),
    interactionFrequency,
    formalityWithPerson,
    expressivenessLevel,
    humorUsage,
    emotionalCloseness,
    trustLevel,
    totalMessages: messages.length,
    lastInteraction: lastMessage,
    positiveInteractions,
    negativeInteractions,
    firstMetDate: firstMessage,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  console.log(`✅ Relationship profile built: ${targetPerson} (intimacy: ${(intimacyLevel * 100).toFixed(0)}%, type: ${relationshipType})`);
  
  return profile;
}

/**
 * Build all relationship profiles for a user
 */
export async function buildAllRelationshipProfiles(
  userId: string,
  useAI: boolean = false
): Promise<RelationshipProfile[]> {
  const db = getDB();
  
  // Get all unique target persons
  const persons = db.prepare(`
    SELECT DISTINCT target_person, COUNT(*) as msg_count
    FROM personality_training_samples
    WHERE user_id = ? AND target_person IS NOT NULL AND target_person != ''
    GROUP BY target_person
    HAVING msg_count >= 3
    ORDER BY msg_count DESC
  `).all(userId) as Array<{ target_person: string; msg_count: number }>;
  
  console.log(`🔍 Found ${persons.length} unique relationships for user: ${userId}`);
  
  const profiles: RelationshipProfile[] = [];
  
  for (const person of persons) {
    try {
      const profile = await buildRelationshipProfile(userId, person.target_person, useAI);
      profiles.push(profile);
    } catch (error) {
      console.error(`Failed to build profile for ${person.target_person}:`, error);
    }
  }
  
  return profiles;
}

/**
 * Save relationship profile to database
 */
export function saveRelationshipProfile(profile: RelationshipProfile) {
  const db = getDB();
  
  db.prepare(`
    INSERT INTO relationship_profiles (
      id, user_id, target_person,
      intimacy_level, relationship_type, relationship_duration_days, interaction_frequency,
      formality_with_person, expressiveness_level, humor_usage, topics_discussed,
      emotional_closeness, trust_level, shared_experiences, conflict_history,
      total_messages, last_interaction, positive_interactions, negative_interactions,
      first_met_date, relationship_notes,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      intimacy_level = excluded.intimacy_level,
      relationship_type = excluded.relationship_type,
      relationship_duration_days = excluded.relationship_duration_days,
      interaction_frequency = excluded.interaction_frequency,
      formality_with_person = excluded.formality_with_person,
      expressiveness_level = excluded.expressiveness_level,
      humor_usage = excluded.humor_usage,
      topics_discussed = excluded.topics_discussed,
      emotional_closeness = excluded.emotional_closeness,
      trust_level = excluded.trust_level,
      total_messages = excluded.total_messages,
      last_interaction = excluded.last_interaction,
      positive_interactions = excluded.positive_interactions,
      negative_interactions = excluded.negative_interactions,
      updated_at = excluded.updated_at
  `).run(
    profile.id,
    profile.userId,
    profile.targetPerson,
    profile.intimacyLevel,
    profile.relationshipType || null,
    profile.relationshipDurationDays || null,
    profile.interactionFrequency || null,
    profile.formalityWithPerson,
    profile.expressivenessLevel,
    profile.humorUsage,
    JSON.stringify(profile.topicsDiscussed || []),
    profile.emotionalCloseness,
    profile.trustLevel,
    JSON.stringify(profile.sharedExperiences || []),
    JSON.stringify(profile.conflictHistory || []),
    profile.totalMessages,
    profile.lastInteraction || null,
    profile.positiveInteractions,
    profile.negativeInteractions,
    profile.firstMetDate || null,
    profile.relationshipNotes || null,
    profile.createdAt,
    profile.updatedAt
  );
  
  console.log(`💾 Relationship profile saved: ${profile.targetPerson}`);
}

/**
 * Load relationship profile from database
 */
export function loadRelationshipProfile(
  userId: string,
  targetPerson: string
): RelationshipProfile | null {
  const db = getDB();
  
  const row = db.prepare(`
    SELECT * FROM relationship_profiles 
    WHERE user_id = ? AND target_person = ?
  `).get(userId, targetPerson) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    userId: row.user_id,
    targetPerson: row.target_person,
    intimacyLevel: row.intimacy_level,
    relationshipType: row.relationship_type,
    relationshipDurationDays: row.relationship_duration_days,
    interactionFrequency: row.interaction_frequency,
    formalityWithPerson: row.formality_with_person,
    expressivenessLevel: row.expressiveness_level,
    humorUsage: row.humor_usage,
    topicsDiscussed: JSON.parse(row.topics_discussed || "[]"),
    emotionalCloseness: row.emotional_closeness,
    trustLevel: row.trust_level,
    sharedExperiences: JSON.parse(row.shared_experiences || "[]"),
    conflictHistory: JSON.parse(row.conflict_history || "[]"),
    totalMessages: row.total_messages,
    lastInteraction: row.last_interaction,
    positiveInteractions: row.positive_interactions,
    negativeInteractions: row.negative_interactions,
    firstMetDate: row.first_met_date,
    relationshipNotes: row.relationship_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all relationships for a user
 */
export function getAllRelationships(userId: string): RelationshipProfile[] {
  const db = getDB();
  
  const rows = db.prepare(`
    SELECT * FROM relationship_profiles 
    WHERE user_id = ?
    ORDER BY intimacy_level DESC
  `).all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    targetPerson: row.target_person,
    intimacyLevel: row.intimacy_level,
    relationshipType: row.relationship_type,
    relationshipDurationDays: row.relationship_duration_days,
    interactionFrequency: row.interaction_frequency,
    formalityWithPerson: row.formality_with_person,
    expressivenessLevel: row.expressiveness_level,
    humorUsage: row.humor_usage,
    topicsDiscussed: JSON.parse(row.topics_discussed || "[]"),
    emotionalCloseness: row.emotional_closeness,
    trustLevel: row.trust_level,
    sharedExperiences: JSON.parse(row.shared_experiences || "[]"),
    conflictHistory: JSON.parse(row.conflict_history || "[]"),
    totalMessages: row.total_messages,
    lastInteraction: row.last_interaction,
    positiveInteractions: row.positive_interactions,
    negativeInteractions: row.negative_interactions,
    firstMetDate: row.first_met_date,
    relationshipNotes: row.relationship_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
