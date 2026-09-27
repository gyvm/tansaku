import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 開発時は wrangler dev（:8787）へ API と WebSocket をプロキシする
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8787",
      "/ws": { target: "ws://localhost:8787", ws: true },
    },
  },
});
