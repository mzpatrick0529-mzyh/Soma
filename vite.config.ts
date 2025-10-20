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
      "/api": {
        target: `http://127.0.0.1:${process.env.SELF_AGENT_PORT || 8787}`,
        changeOrigin: true,
        // 不改写路径，后端已挂载到 /api
      },
      // Google OAuth 回调需要直达后端
      "/auth/google/callback": {
        target: `http://127.0.0.1:${process.env.SELF_AGENT_PORT || 8787}`,
        changeOrigin: true,
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
