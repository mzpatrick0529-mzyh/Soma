import { z } from "zod";

export const MemoryType = z.enum(["text", "image", "video", "audio", "link"]);

export const MemoryItem = z.object({
  id: z.string(),
  type: MemoryType,
  content: z.string().optional(), // text or URL
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
});
export type MemoryItem = z.infer<typeof MemoryItem>;

export const PersonaProfile = z.object({
  userId: z.string(),
  name: z.string().optional(),
  bio: z.string().optional(),
  tone: z.string().optional(), // e.g., "friendly, concise"
  speakingStyle: z.string().optional(),
  topics: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});
export type PersonaProfile = z.infer<typeof PersonaProfile>;

export const TrainingJob = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(["queued", "running", "succeeded", "failed"]),
  createdAt: z.number(),
  updatedAt: z.number(),
  error: z.string().optional(),
});
export type TrainingJob = z.infer<typeof TrainingJob>;

export type ChatGenerateInput = {
  userId: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  hint?: string;
};

export type PostGenerateInput = {
  userId: string;
  context?: string;
  mediaHint?: Array<Pick<MemoryItem, "type" | "content">>;
};
