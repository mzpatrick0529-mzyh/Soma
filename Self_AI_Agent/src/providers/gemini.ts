import { ChatGenerateInput, PostGenerateInput } from "../types";
import { config } from "../utils/config";

type GenerateContentRequest = {
  contents: Array<{ role?: string; parts: Array<{ text: string }> }>;
};

type GenerateContentResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export class GeminiProvider {
  name = "gemini";

  async trainPersona(userId: string, dataset: string): Promise<{ modelId: string }> {
    // Placeholder: Gemini fine-tune API not used here
    await new Promise((r) => setTimeout(r, 300));
    return { modelId: `gemini-proxy-${userId}-${Date.now()}` };
  }

  /**
   * 检测输入是否包含多模态内容（图片/视频/文件）
   */
  private detectMultimodal(input: ChatGenerateInput): boolean {
    // 检查历史消息中是否有图片、视频或文件相关的关键词
    const multimodalKeywords = [
      "data:image/", // Base64 图片
      "data:video/", // Base64 视频
      "blob:", // Blob URL
      "file://", // 文件路径
      "[IMAGE]", // 图片标记
      "[VIDEO]", // 视频标记
      "[FILE]", // 文件标记
    ];

    // 检查所有历史消息内容
    for (const msg of input.history) {
      for (const keyword of multimodalKeywords) {
        if (msg.content.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }

  async generateChat(input: ChatGenerateInput): Promise<string> {
    // 智能选择模型：多模态使用 Flash，纯文本使用 Flash Lite
    const isMultimodal = this.detectMultimodal(input);
    const model = isMultimodal ? config.geminiMultimodalModel : config.geminiModel;
    
    console.log(`[Gemini] Using model: ${model} (multimodal: ${isMultimodal})`);
    
    const url = `${config.geminiEndpoint}/models/${model}:generateContent?key=${encodeURIComponent(config.googleKey)}`;
    const historyParts = input.history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const sys = input.hint ? [{ role: "user", parts: [{ text: `系统/风格提示:\n${input.hint}` }] }] : [];
    const body: GenerateContentRequest = {
      contents: [...sys, ...historyParts],
    };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Gemini chat error: ${res.status}`);
    const data = (await res.json()) as GenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text || "(no response)";
  }

  async generatePost(input: PostGenerateInput): Promise<string> {
    const model = config.geminiModel;
    const url = `${config.geminiEndpoint}/models/${model}:generateContent?key=${encodeURIComponent(config.googleKey)}`;
    const prompt = `请以用户(${input.userId})的Language风格写一条动态。${input.context ? `\nContext:\n${input.context}` : ""}`;
    const body: GenerateContentRequest = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Gemini post error: ${res.status}`);
    const data = (await res.json()) as GenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text || "(no response)";
  }
}