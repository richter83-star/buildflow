import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { LinksFunction } from "react-router";

import "./tailwind.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./utils/trpc";
import * as trpcModule from "./utils/trpc";
import { useMemo } from "react";

import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./utils/auth";
import { Watermark } from "./watermark";

import type { LinksFunction } from "react-router";
import stylesheet from "./tailwind.css?url";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

const queryClient = new QueryClient();

function makeTrpcClient() {
  const m: any = trpcModule;

  // Prefer browser client in browser
  if (typeof window !== "undefined") {
    return (
      m.createTrpcClient?.() ??
      m.createTRPCClient?.() ??
      m.createBrowserClient?.() ??
      m.createClient?.() ??
      m.createSSRClient?.()
    );
  }

  // SSR / server render
  const port = process.env.PORT ?? "3000";
  process.env.PORT = port;

  return (
    m.createSSRClient?.() ??
    m.createSsrClient?.() ??
    m.createClient?.() ??
    m.createTRPCClient?.() ??
    m.createTrpcClient?.()
  );
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export default function App() {
  const trpcClient = useMemo(() => makeTrpcClient(), []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <html lang="en" suppressHydrationWarning>
            <head>
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <Meta />
              <Links />
            </head>
            <body>
              <TooltipProvider>
                <Outlet />
              </TooltipProvider>
              <ScrollRestoration />
              <Scripts />
              <Watermark />
            </body>
          </html>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
