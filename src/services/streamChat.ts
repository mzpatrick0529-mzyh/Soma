/**
 * 🌊 Streaming Chat Service
 * 支持 SSE 流式对话
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamChatOptions {
  userId: string;
  history: ChatMessage[];
  hint?: string;
  onChunk?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 流式对话 API 调用
 */
export async function streamChat(options: StreamChatOptions): Promise<void> {
  const { userId, history, hint, onChunk, onComplete, onError } = options;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

  try {
    const response = await fetch(`${API_BASE}/api/self-agent/generate/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, history, hint }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6); // Remove "data: " prefix
        if (data === "[DONE]") {
          onComplete?.(fullText);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            fullText += parsed.text;
            onChunk?.(parsed.text);
          }
        } catch (e) {
          console.error("[StreamChat] Failed to parse:", e, data);
        }
      }
    }

    onComplete?.(fullText);
  } catch (error) {
    onError?.(error as Error);
  }
}

/**
 * Provider 信息查询
 */
export interface ProviderInfo {
  provider: "gemini" | "openai";
  model: string;
  geminiConfigured: boolean;
  streaming?: boolean;
}

export async function getProviderInfo(): Promise<ProviderInfo> {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";
  const res = await fetch(`${API_BASE}/api/self-agent/provider-info`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * 测试 Provider 连接
 */
export async function testProviderConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const info = await getProviderInfo();
    if (info.provider === "openai" && info.model === "openai-stub") {
      return {
        success: false,
        message: "当前使用模拟 Provider，请配置 GEMINI_API_KEY",
      };
    }
    return {
      success: true,
      message: `✅ ${info.provider} (${info.model}) 配置成功`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
    };
  }
}
