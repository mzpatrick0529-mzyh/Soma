/**
 * 🌊 Streaming Chat Service
 * Support SSE streaming conversation
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamChatOptions {
  userId: string;
  history: ChatMessage[];
  hint?: string;
  sources?: string[]; // Optional: limit retrieval sources, such as ["instagram","google"]
  onChunk?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Streaming conversation API call
 */
export async function streamChat(options: StreamChatOptions): Promise<void> {
  const { userId, history, hint, sources, onChunk, onComplete, onError } = options;
  // Use relative path uniformly, proxied to backend by Vite
  const API_BASE = "/api";

  try {
  const qs = sources && sources.length ? `?sources=${encodeURIComponent(sources.join(","))}` : "";
  const response = await fetch(`${API_BASE}/self-agent/generate/chat/stream${qs}`, {
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
 * Provider information query
 */
export interface ProviderInfo {
  provider: "gemini" | "openai";
  model: string;
  geminiConfigured: boolean;
  streaming?: boolean;
}

export async function getProviderInfo(): Promise<ProviderInfo> {
  const API_BASE = "/api";
  const res = await fetch(`${API_BASE}/self-agent/provider-info`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Test Provider connection
 */
export async function testProviderConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const info = await getProviderInfo();
    if (info.provider === "openai" && info.model === "openai-stub") {
      return {
        success: false,
        message: "Currently using simulated Provider, please configure GEMINI_API_KEY",
      };
    }
    return {
      success: true,
      message: `✅ ${info.provider} (${info.model}) Configuration successful`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
    };
  }
}
