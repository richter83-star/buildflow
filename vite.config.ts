/// <reference types="vitest" />
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths to ignore for file watching
const ignoredPaths = [
  "**/venv/**",
  "/app/venv/**",
  "/app/venv/lib/**",
  "/app/venv/lib/python3.12/**",
  "/app/venv/lib/python3.12/site-packages/**",
  "**/app/venv/**",
  "**/__pycache__/**",
  "**/*.pyc",
  "**/node_modules/**",
  "**/site-packages/**",
];

// Toggle ws proxy only if you actually run a ws server
// Set ENABLE_WS_PROXY=true in .env if needed
const enableWsProxy = process.env.ENABLE_WS_PROXY === "true";

export default defineConfig(() => {
  const wsProxy = enableWsProxy
    ? {
        "/api/ws": {
          target: "ws://localhost:3002",
          ws: true,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/ws/, "/"),
        },
      }
    : {};

  return {
    plugins: [reactRouter(), tsconfigPaths()],
    server: {
      watch: { ignored: ignoredPaths },
      proxy: {
        ...wsProxy,
      },
    },
    preview: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        ...wsProxy,
      },
    },
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./app"),
      },
    },
  };
});
