import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '../server/trpc/root';

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// NOTE: For server-side usage in loaders/actions, use callTrpc() from '~/utils/trpc.server'
// It uses direct RPC calls (no HTTP overhead) - see trpc.server.ts

// SSR-safe client (HTTP only, no WebSocket)
// Used during SSR so the provider is always available
export function createSSRClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.host}/api/trpc`
          : 'http://localhost:3000/api/trpc',
      }),
    ],
  });
}

// Client-side tRPC client factory with WebSocket support
export function createTRPCClient() {
  const host = typeof window !== 'undefined' 
    ? window.location.host 
    : 'localhost:3000';
  
  const isHttps = typeof window !== 'undefined' 
    ? window.location.protocol === 'https:'
    : false;
  
    
  const httpUrl = `${isHttps ? 'https' : 'http'}://${host}/api/trpc`;
  
  // WebSocket URL - use ingress proxy path for external, direct for local dev
  const wsUrl = typeof window !== 'undefined'
    ? `${isHttps ? 'wss' : 'ws'}://${host}/api/ws` // Use ingress proxy path
    : 'ws://localhost:3002'; // Direct to WS server for local dev
  
  // Debug logging for WebSocket URL
  if (typeof window !== 'undefined') {
    console.log('🔌 tRPC WebSocket URL:', wsUrl);
    console.log('📍 Current host:', host);
    console.log('🔒 Is HTTPS:', isHttps);
  }
  
  const wsClient = createWSClient({
    url: wsUrl,
    onOpen() {
      console.log('✅ tRPC WebSocket connected successfully');
    },
    onClose() {
      console.log('❌ tRPC WebSocket connection closed');
    },
  });
  
  return trpc.createClient({
    links: [
      splitLink({
        condition(op) {
          // Use WebSocket for subscriptions, HTTP for queries/mutations
          return op.type === 'subscription';
        },
        true: wsLink({
          client: wsClient,
        }),
        false: httpBatchLink({
          url: httpUrl,
        }),
      }),
    ],
  });
}