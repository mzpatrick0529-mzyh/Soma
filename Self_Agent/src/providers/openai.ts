import { TrainingProvider } from "./provider";
import { ChatGenerateInput, PostGenerateInput } from "../types";

// Minimal stubbed provider. Later we can swap to real OpenAI calls.
export class OpenAIProvider implements TrainingProvider {
  name = "openai";

  async trainPersona(userId: string, dataset: string): Promise<{ modelId: string }> {
    // Placeholder: In real impl, call fine-tuning APIs
    await new Promise((r) => setTimeout(r, 500));
    return { modelId: `openai-ft-${userId}-${Date.now()}` };
  }

  async generateChat(input: ChatGenerateInput): Promise<string> {
    const last = input.history[input.history.length - 1]?.content || "";
    return `【模拟${input.userId}的风格】回复：${last.slice(0, 80)}...`;
  }

  async generatePost(input: PostGenerateInput): Promise<string> {
    const ctx = input.context ? `基于上下文「${input.context.slice(0, 60)}」` : "";
    return `【模拟${input.userId}的风格】生成一条动态：今天很有收获。${ctx}`;
  }
}
