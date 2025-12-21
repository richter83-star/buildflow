import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from './trpc/root';
import { createContext } from './trpc/context';
import type { Server } from 'http';

// Use globalThis to survive Vite HMR - module-level vars get reset on hot reload
// but the actual server process stays bound to the port, causing EADDRINUSE
declare global {
  var __wss: WebSocketServer | undefined;
  var __wsHandler: any | undefined;
}

// Create standalone WebSocket server (development)
export function createWebSocketServer(port: number = 3002) {
  if (globalThis.__wss) {
    return globalThis.__wss;
  }

  console.log('🚀 Starting standalone WebSocket server on port', port);

  globalThis.__wss = new WebSocketServer({
    port,
  });

  globalThis.__wsHandler = applyWSSHandler({
    wss: globalThis.__wss,
    router: appRouter,
    createContext: (opts) => createContext({
      request: new Request(`ws://localhost:${port}`)
    }),
  });

  setupWebSocketHandlers(globalThis.__wss);
  setupCleanup();

  return globalThis.__wss;
}

// Attach WebSocket server to existing HTTP server (production)
export function attachWebSocketToServer(httpServer: Server, path: string = '/api/ws') {
  if (globalThis.__wss) {
    return { wss: globalThis.__wss, handler: globalThis.__wsHandler };
  }

  console.log('🔌 Attaching WebSocket server to HTTP server at path:', path);

  globalThis.__wss = new WebSocketServer({
    noServer: true, // Don't create a standalone server
  });

  globalThis.__wsHandler = applyWSSHandler({
    wss: globalThis.__wss,
    router: appRouter,
    createContext: (opts) => createContext({
      request: new Request(`ws://localhost:3002${path}`)
    }),
  });

  // Handle WebSocket upgrades on the HTTP server
  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url!, `http://${request.headers.host}`);

    if (pathname === path) {
      console.log('🔄 Upgrading HTTP connection to WebSocket at', path);
      globalThis.__wss!.handleUpgrade(request, socket, head, (websocket) => {
        globalThis.__wss!.emit('connection', websocket, request);
      });
    } else {
      console.log('❌ WebSocket upgrade rejected for path:', pathname);
      socket.destroy();
    }
  });

  setupWebSocketHandlers(globalThis.__wss);
  setupCleanup();

  return { wss: globalThis.__wss, handler: globalThis.__wsHandler };
}

// Common WebSocket event handlers
function setupWebSocketHandlers(websocketServer: WebSocketServer) {
  websocketServer.on('connection', (ws) => {
    console.log('➕ WebSocket connection established');
    ws.once('close', () => {
      console.log('➖ WebSocket connection closed');
    });
  });
}

// Common cleanup handlers
function setupCleanup() {
  process.on('SIGTERM', () => {
    console.log('🛑 Closing WebSocket server...');
    if (globalThis.__wsHandler) {
      globalThis.__wsHandler.broadcastReconnectNotification();
    }
    globalThis.__wss?.close();
  });
} 