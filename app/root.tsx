import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
  } from "react-router";
  import type { LinksFunction } from "react-router";

  import "./tailwind.css";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { trpc, createTRPCClient, createSSRClient } from "./utils/trpc";
  import { Watermark } from "./watermark";
  import { TooltipProvider } from "./components/ui/tooltip";
  import { AuthProvider } from "./utils/auth";
  import { useState, useEffect } from "react";
  
  export const links: LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
  ];
  
  // Create query client outside component
  const queryClient = new QueryClient();

  // SSR client for initial render
  const ssrClient = createSSRClient();

  export default function App() {
    // Start with SSR client, upgrade to full client (with WebSocket) on mount
    const [trpcClient, setTrpcClient] = useState(() => ssrClient);

    useEffect(() => {
      // Upgrade to full client with WebSocket support after hydration
      setTrpcClient(createTRPCClient());
    }, []);

    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <html lang="en" suppressHydrationWarning>
              <head>
                <meta charSet="utf-8" />
                <meta
                  name="viewport"
                  content="width=device-width,initial-scale=1"
                />
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
  