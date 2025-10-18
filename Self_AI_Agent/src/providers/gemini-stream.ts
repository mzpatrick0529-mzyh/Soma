import { ChatGenerateInput } from "../types";
import { config } from "../utils/config";

type GenerateContentRequest = {
  contents: Array<{ role?: string; parts: Array<{ text: string }> }>;
};

/**
 * Gemini Streaming Provider
 * 使用 streamGenerateContent API 实现真正的流式输出
 */
export class GeminiStreamProvider {
  name = "gemini-stream";

  /**
   * 检测输入是否包含多模态内容（图片/视频/文件）
   */
  private detectMultimodal(input: ChatGenerateInput): boolean {
    const multimodalKeywords = [
      "data:image/",
      "data:video/",
      "blob:",
      "file://",
      "[IMAGE]",
      "[VIDEO]",
      "[FILE]",
    ];

    for (const msg of input.history) {
      for (const keyword of multimodalKeywords) {
        if (msg.content.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 流式生成对话响应
   * @param input 对话输入（包含历史记录和系统提示）
   * @returns AsyncGenerator 产生文本片段
   */
  async* generateChatStream(input: ChatGenerateInput): AsyncGenerator<string, void, unknown> {
    // 智能选择模型：多模态使用 Flash，纯文本使用 Flash Lite
    const isMultimodal = this.detectMultimodal(input);
    const model = isMultimodal ? config.geminiMultimodalModel : config.geminiModel;
    
    console.log(`[Gemini Stream] Using model: ${model} (multimodal: ${isMultimodal})`);
    
    const url = `${config.geminiEndpoint}/models/${model}:streamGenerateContent?key=${encodeURIComponent(config.googleKey)}&alt=sse`;
    
    const historyParts = input.history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    
    const sys = input.hint
      ? [{ role: "user", parts: [{ text: `系统/风格提示:\n${input.hint}` }] }]
      : [];
    
    const body: GenerateContentRequest = {
      contents: [...sys, ...historyParts],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini streaming error: ${res.status} - ${errorText}`);
    }

    if (!res.body) {
      throw new Error("Response body is null");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6); // Remove "data: " prefix
          if (jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            console.error("[Gemini Stream] Failed to parse JSON:", e, jsonStr);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 非流式生成（向后兼容）
   */
  async generateChat(input: ChatGenerateInput): Promise<string> {
    let fullText = "";
    for await (const chunk of this.generateChatStream(input)) {
      fullText += chunk;
    }
    return fullText || "(no response)";
  }
}
