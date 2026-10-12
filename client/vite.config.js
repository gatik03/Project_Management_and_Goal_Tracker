import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": process.env.VITE_DEV_API_TARGET || "http://localhost:4000"
    }
  },
  preview: {
    proxy: {
      "/api": process.env.VITE_DEV_API_TARGET || "http://localhost:4000"
    }
  }
});
