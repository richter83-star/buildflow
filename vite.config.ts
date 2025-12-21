/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { reactRouter } from "@react-router/dev/vite";
import path from 'path';

// Define paths to ignore for file watching
const ignoredPaths = [
  "**/venv/**",
  '/app/venv/**',
  '/app/venv/lib/**',
  '/app/venv/lib/python3.12/**',
  '/app/venv/lib/python3.12/site-packages/**',
  "**/app/venv/**", 
  "**/__pycache__/**", 
  "**/*.pyc", 
  "**/node_modules/**",
  "**/site-packages/**"
];

export default defineConfig(async () => {
  const tsconfigPaths = await import('vite-tsconfig-paths');

  return {
    plugins: [
      reactRouter(),
      tsconfigPaths.default(),
      // WebSocket server is now initialized in app/entry.server.tsx
    ],
    server: {
      watch: {
        ignored: ignoredPaths
      },
      proxy: {
        // Proxy WebSocket connections to the internal WebSocket server
        '/api/ws': {
          target: 'ws://localhost:3002',
          ws: true, // Enable WebSocket proxying
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ws/, '/'),
        }
      }
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Same proxy config for preview mode
        '/api/ws': {
          target: 'ws://localhost:3002',
          ws: true,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/ws/, '/'),
        }
      }
    },
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './app'),
      },
    },
  };
});
