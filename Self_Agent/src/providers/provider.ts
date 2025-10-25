import { ChatGenerateInput, PostGenerateInput, TrainingJob } from "../types";

export interface TrainingProvider {
  name: string;
  trainPersona(userId: string, dataset: string): Promise<{ modelId: string }>;
  generateChat(input: ChatGenerateInput): Promise<string>;
  generatePost(input: PostGenerateInput): Promise<string>;
}
