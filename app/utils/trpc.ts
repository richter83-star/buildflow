import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/trpc/root";

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

/**
 * NOTE:
 * - For server-side usage in loaders/actions, use callTrpc() from '~/utils/trpc.server'
 *   (direct RPC calls, no HTTP).
 * - This file is for CLIENT usage (components, browser).
 *
 * We intentionally disable WebSocket subscriptions for MVP stability.
 * (Stops Vite WS proxy AggregateError spam.)
 */

function getTrpcHttpUrl() {
  // In the browser, a relative URL is best.
  if (typeof window !== "undefined") return "/api/trpc";

  // During SSR, relative URLs can fail depending on runtime.
  // Default to localhost with PORT if present.
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}/api/trpc`;
}

/**
 * SSR-safe client (HTTP only)
 * Used during SSR so the provider is always available.
 */
export function createSSRClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getTrpcHttpUrl(),
      }),
    ],
  });
}

/**
 * Browser client (HTTP only)
 */
export function createBrowserClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
      }),
    ],
  });
}

// Back-compat alias (in case other files import createTrpcClient)
export function createTrpcClient() {
  return typeof window === "undefined" ? createSSRClient() : createBrowserClient();
}

// Back-compat alias (case-sensitive import used in app/root.tsx)
export function createTRPCClient() {
  return createTrpcClient();
}
