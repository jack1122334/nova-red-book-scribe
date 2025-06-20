import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/bluechat': {
        // target: 'http://172.22.45.74:8000', // 局域网服务器
        target: 'http://47.84.70.98:8088', // 公网服务器
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bluechat/, '/api/v1/bluechat'),
      }
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
