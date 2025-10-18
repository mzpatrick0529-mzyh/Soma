import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Bind explicitly to IPv4 localhost to avoid IPv6-only binding issues on macOS
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
    proxy: {
      "/api/self-agent": {
        target:
          (process.env.VITE_SELF_AGENT_API_BASE_URL?.replace(/\/$/, "")) ||
          `http://localhost:${process.env.SELF_AGENT_PORT || 8787}`,
        changeOrigin: true,
        rewrite: (path) => path,
      },
      "/api/google-import": {
        target:
          (process.env.VITE_SELF_AGENT_API_BASE_URL?.replace(/\/$/, "")) ||
          `http://localhost:${process.env.SELF_AGENT_PORT || 8787}`,
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // Auth & user profile APIs served by Self_AI_Agent
      "/auth": {
        target:
          (process.env.VITE_SELF_AGENT_API_BASE_URL?.replace(/\/$/, "")) ||
          `http://localhost:${process.env.SELF_AGENT_PORT || 8787}`,
        changeOrigin: true,
        rewrite: (path) => path,
      },
      "/user": {
        target:
          (process.env.VITE_SELF_AGENT_API_BASE_URL?.replace(/\/$/, "")) ||
          `http://localhost:${process.env.SELF_AGENT_PORT || 8787}`,
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
