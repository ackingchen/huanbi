import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        timeout: 540000,
        proxyTimeout: 540000,
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
