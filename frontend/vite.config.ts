import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  };
});