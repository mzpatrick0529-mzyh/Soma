/**
 * 人格模拟系统 - TypeScript 类型定义
 */

// ==========================================
// 核心人格向量类型
// ==========================================

export interface PersonalityVector {
  userId: string;
  
  linguistic: LinguisticFeatures;
  emotional: EmotionalFeatures;
  cognitive: CognitiveFeatures;
  values: ValueSystem;
  social: SocialFeatures;
  behavioral: BehavioralFeatures;
  
  metadata: PersonalityMetadata;
}

export interface LinguisticFeatures {
  vocabularyComplexity: number;      // [0-1]
  sentenceLengthPreference: number;  // 平均句长
  formalityLevel: number;            // [0-1] 0=非常随意, 1=非常正式
  humorFrequency: number;            // [0-1]
  emojiUsageRate: number;            // [0-1]
  catchphrases: string[];            // 口头禅列表
  punctuationStyle: {
    exclamation: number;             // 感叹号使用频率
    question: number;                // 问号使用频率
    ellipsis: number;                // 省略号使用频率
    comma: number;                   // 逗号使用频率
  };
  commonWords: Array<{ word: string; frequency: number }>;
  sentenceStructurePreference: string; // 'simple', 'complex', 'mixed'
}

export interface EmotionalFeatures {
  baselineSentiment: number;         // [-1, 1] 基线情绪
  emotionalVolatility: number;       // [0-1] 情绪波动性
  empathyLevel: number;              // [0-1] 共情能力
  optimismScore: number;             // [0-1] 乐观度
  anxietyTendency: number;           // [0-1] 焦虑倾向
  angerThreshold: number;            // [0-1] 愤怒阈值
  emotionExpressionStyle: 'direct' | 'subtle' | 'mixed';
  
  emotionDistribution: {             // 情绪分布统计
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    neutral: number;
  };
}

export interface CognitiveFeatures {
  analyticalVsIntuitive: number;     // [-1, 1] -1=直觉型, 1=分析型
  detailOriented: number;            // [0-1]
  abstractThinking: number;          // [0-1]
  decisionSpeed: number;             // [0-1] 0=慢, 1=快
  riskTolerance: number;             // [0-1]
  openMindedness: number;            // [0-1]
  creativityLevel: number;           // [0-1]
  logicalReasoning: number;          // [0-1]
}

export interface ValueSystem {
  priorities: Map<string, number>;   // 价值优先级
  moralFramework: {
    fairness: number;
    loyalty: number;
    authority: number;
    purity: number;
    care: number;
  };
  lifePhilosophy: string[];          // 人生哲学关键词
  politicalLeaning: number;          // [-1, 1] -1=左, 1=右
  religiousSpiritual: number;        // [0-1]
  environmentalConcern: number;      // [0-1]
  socialResponsibility: number;      // [0-1]
}

export interface SocialFeatures {
  extraversionScore: number;         // [0-1]
  relationshipMap: Map<string, RelationshipProfile>;
  responseTimePattern: {
    averageDelayMinutes: number;
    timeOfDayPreferences: number[];  // 24小时，每小时的活跃度
    weekdayPreferences: number[];    // 7天，每天的活跃度
  };
  topicPreferences: Map<string, number>;
  conflictResolutionStyle: 'avoidance' | 'compromise' | 'collaboration' | 'competition' | 'accommodation';
  communicationInitiativeScore: number; // [0-1] 主动发起对话的倾向
}

export interface BehavioralFeatures {
  dailyRoutine: {
    wakeUpTime?: string;
    sleepTime?: string;
    workHours?: { start: string; end: string };
    breakPatterns?: string[];
  };
  hobbyInterests: Array<{ name: string; intensity: number }>;
  consumptionPreferences: {
    brands: string[];
    categories: string[];
    priceRange: string;
  };
  travelPreferences?: {
    frequency: number;
    destinations: string[];
    travelStyle: string;
  };
}

export interface PersonalityMetadata {
  version: number;
  lastTrainedAt: Date;
  trainingSamplesCount: number;
  confidenceScore: number;           // [0-1] 整体置信度
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// 关系图谱类型
// ==========================================

export interface RelationshipProfile {
  personIdentifier: string;
  personName?: string;
  relationshipType: RelationshipType;
  
  // 关系指标
  intimacyLevel: number;             // [0-1]
  interactionFrequency: number;      // [0-1]
  emotionalTone: number;             // [-1, 1]
  
  // 沟通特征
  topicsDiscussed: string[];
  communicationStyleAdjustments: {
    formalityDelta: number;          // 相对于基准的调整
    emojiUsageDelta: number;
    responseTimeDelta: number;
    verbalIntimacy: number;          // 语言亲密度
  };
  
  // 统计信息
  totalInteractions: number;
  lastInteractionAt?: Date;
  firstInteractionAt?: Date;
}

export type RelationshipType = 
  | 'family'
  | 'close_friend'
  | 'friend'
  | 'colleague'
  | 'acquaintance'
  | 'stranger'
  | 'romantic_partner'
  | 'mentor'
  | 'mentee';

// ==========================================
// 训练与推理类型
// ==========================================

export interface PersonalityTrainingSample {
  id: string;
  userId: string;
  
  // 输入
  conversationContext: ConversationMessage[];
  targetPerson?: string;
  timestampContext: Date;
  emotionalContext?: string;
  
  // 输出（目标）
  userResponse: string;
  
  // 元数据
  sourceDocId?: string;
  qualityScore?: number;
  usedForTraining: boolean;
  createdAt: Date;
}

export interface ConversationMessage {
  role: 'user' | 'other' | 'system';
  content: string;
  timestamp: Date;
  sender?: string;
  emotion?: string;
}

export interface PersonalityInferenceContext {
  message: string;
  sender: string;
  conversationHistory: ConversationMessage[];
  currentTime: Date;
  location?: string;
  emotionalState?: EmotionalState;
}

export interface EmotionalState {
  currentEmotion: string;
  intensity: number;
  trigger?: string;
  duration?: number;
}

export interface PersonalityInferenceResult {
  response: string;
  confidence: number;
  adjustedPersonality: Partial<PersonalityVector>;
  usedMemories: Array<{ docId: string; relevance: number }>;
  reasoning?: string;
  metadata: {
    inferenceTimeMs: number;
    modelVersion: string;
    strategyUsed: 'prompt' | 'lora' | 'hybrid';
  };
}

// ==========================================
// ML 训练类型
// ==========================================

export interface PersonalityModelVersion {
  id: string;
  userId: string;
  versionNumber: number;
  modelType: 'prompt_based' | 'lora' | 'full_finetune';
  modelPath?: string;
  
  trainingInfo: {
    samplesCount: number;
    durationSeconds: number;
    trainingLoss?: number;
    hyperparameters: Record<string, any>;
  };
  
  evaluationMetrics: {
    personalitySimilarityScore?: number;
    turingTestPassRate?: number;
    userSatisfactionAvg?: number;
    consistencyScore?: number;
  };
  
  isActive: boolean;
  createdAt: Date;
}

export interface TrainingConfig {
  modelType: 'lora' | 'qlora' | 'full_finetune';
  baseModel: string;
  
  loraConfig?: {
    r: number;                         // LoRA rank
    loraAlpha: number;
    loraDropout: number;
    targetModules: string[];
  };
  
  trainingArgs: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    warmupSteps: number;
    gradientAccumulationSteps: number;
  };
  
  dataConfig: {
    minSamplesRequired: number;
    maxSamplesPerEpoch: number;
    validationSplit: number;
  };
}

// ==========================================
// 强化学习类型
// ==========================================

export interface RLHFFeedback {
  id: string;
  userId: string;
  conversationId?: string;
  agentResponse: string;
  
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: 'style' | 'accuracy' | 'emotion' | 'relationship' | 'general';
  feedbackText?: string;
  suggestedResponse?: string;
  
  contextSnapshot: {
    personality: Partial<PersonalityVector>;
    targetPerson?: string;
    relationship?: RelationshipProfile;
  };
  
  createdAt: Date;
}

export interface RewardSignal {
  userFeedback: number;              // 用户评分
  styleConsistency: number;          // 风格一致性
  emotionConsistency: number;        // 情感一致性
  relationshipFit: number;           // 关系适配度
  factualAccuracy: number;           // 事实准确性
  
  totalReward: number;               // 综合奖励
  explanation?: string;
}

// ==========================================
// 特征提取类型
// ==========================================

export interface FeatureExtractionJob {
  id: string;
  userId: string;
  jobType: 'linguistic' | 'emotional' | 'social' | 'behavioral' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  inputDataRange: {
    startDate?: Date;
    endDate?: Date;
    documentIds?: string[];
    sources?: string[];
  };
  
  outputFeatures?: Partial<PersonalityVector>;
  errorMessage?: string;
  
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

// ==========================================
// API 请求/响应类型
// ==========================================

export interface GetPersonalityRequest {
  userId: string;
  version?: number;
}

export interface GetPersonalityResponse {
  personality: PersonalityVector;
  modelVersion: PersonalityModelVersion;
}

export interface GenerateResponseRequest {
  userId: string;
  message: string;
  sender: string;
  conversationHistory?: ConversationMessage[];
  options?: {
    useActiveModel?: boolean;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface GenerateResponseResponse {
  response: string;
  inference: PersonalityInferenceResult;
}

export interface SubmitFeedbackRequest {
  userId: string;
  conversationId?: string;
  agentResponse: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: RLHFFeedback['feedbackType'];
  feedbackText?: string;
  suggestedResponse?: string;
}

export interface TriggerTrainingRequest {
  userId: string;
  trainingConfig: TrainingConfig;
  force?: boolean;  // 强制重新训练
}

export interface TriggerTrainingResponse {
  jobId: string;
  estimatedDurationMinutes: number;
  message: string;
}

export interface ExtractFeaturesRequest {
  userId: string;
  jobType: FeatureExtractionJob['jobType'];
  dataRange?: FeatureExtractionJob['inputDataRange'];
}

export interface ExtractFeaturesResponse {
  jobId: string;
  status: FeatureExtractionJob['status'];
  estimatedCompletionTime?: Date;
}

// ==========================================
// 工具函数类型
// ==========================================

export interface PersonalityDistance {
  overallDistance: number;           // 总体距离 [0-1]
  componentDistances: {
    linguistic: number;
    emotional: number;
    cognitive: number;
    social: number;
  };
}

export interface PersonalityEvolution {
  userId: string;
  timeline: Array<{
    version: number;
    timestamp: Date;
    personality: PersonalityVector;
    majorChanges: string[];
  }>;
}

// ==========================================
// 配置类型
// ==========================================

export interface PersonalitySystemConfig {
  features: {
    enableRLHF: boolean;
    enableAutoTraining: boolean;
    enableMultiModal: boolean;
  };
  
  models: {
    defaultBaseModel: string;
    loraEnabled: boolean;
    quantization: 'none' | 'int8' | 'int4';
  };
  
  training: {
    minSamplesForTraining: number;
    autoTrainThreshold: number;       // 新样本数达到此值自动训练
    maxTrainingDurationHours: number;
  };
  
  inference: {
    cacheEnabled: boolean;
    maxCacheSize: number;
    consistencyCheckEnabled: boolean;
  };
  
  privacy: {
    encryptPersonalityVectors: boolean;
    allowDataExport: boolean;
    dataRetentionDays?: number;
  };
}
