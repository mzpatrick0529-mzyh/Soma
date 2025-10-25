import * as dotenv from "dotenv";

dotenv.config();

export const config = {
  // Prefer explicit SELF_AGENT_PORT, then PORT, default to 8787 to match Vite proxy config
  port: Number(process.env.SELF_AGENT_PORT || process.env.PORT) || 8787,
  dbUrl: process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/soma_local",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-DO-NOT-USE-IN-PRODUCTION",
  googleKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
  // 纯文本使用 Flash Lite（快速、经济）
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  // 多模态（图片/视频/文件）使用 Flash（功能完整）
  geminiMultimodalModel: process.env.GEMINI_MULTIMODAL_MODEL || "gemini-2.5-flash",
  openaiKey: process.env.OPENAI_API_KEY || "",
  pineconeKey: process.env.PINECONE_API_KEY || "",
  pineconeIndexHost: process.env.PINECONE_INDEX_HOST || "",
};
