/**
 * By default, React Router will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx react-router reveal` ✨
 * For more information, see https://reactrouter.com/start/framework/entry.server
 */

import { PassThrough } from "node:stream";

import type { AppLoadContext } from "react-router";
type EntryContext = any; // React Router 7.9+ changed this type
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import isbot from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as fs from "node:fs";
import * as path from "node:path";

// Read environment variables from .env file (for hot reload support)
function readEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env');
  const envVars: Record<string, string> = {};
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          envVars[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    console.log('Failed to read .env file:', error);
  }
  
  return envVars;
}

// Initialize WebSocket server (singleton pattern)
// Use global to prevent multiple instances during hot reloads
declare global {
  var __wsServerInitialized: boolean | undefined;
}

if (!global.__wsServerInitialized) {
  global.__wsServerInitialized = true;
  import('~/server/websocket.server').then(({ createWebSocketServer }) => {
    createWebSocketServer(3002);
    console.log('🚀 WebSocket server started on port 3002');
  }).catch((error) => {
    console.error('Failed to start WebSocket server:', error);
  });
}

const ABORT_DELAY = 5_000;

// Domain whitelist middleware
function checkDomainWhitelist(request: Request): Response | null {
  // Read fresh env vars from .env file for hot reload support
  const envVars = readEnvFile();
  const whitelistEnabled = envVars.DOMAIN_WHITELIST_ENABLED === 'true';
  
  if (!whitelistEnabled) {
    return null; // Allow all traffic when whitelist is disabled
  }
  
  const allowedDomains = envVars.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
  const referer = request.headers.get('referer');
  
  // Check if request is coming from an allowed domain (iframe embedding)
  if (!referer) {
    console.log('Access denied: No referer header (direct access blocked)');
    return new Response(
      'Access denied. This application can only be accessed through authorized embedding domains.',
      { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain'
        }
      }
    );
  }
  
  let refererDomain: string;
  try {
    const refererUrl = new URL(referer);
    refererDomain = refererUrl.hostname;
  } catch (error) {
    console.log('Access denied: Invalid referer URL');
    return new Response(
      'Access denied. Invalid referer.',
      { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain'
        }
      }
    );
  }
  
  // Check if referer domain is in whitelist
  const isAllowed = allowedDomains.some(allowedDomain => {
    // Support exact match or subdomain match for referer
    return refererDomain === allowedDomain || refererDomain.endsWith('.' + allowedDomain);
  });
  
  if (!isAllowed) {
    console.log(`Access denied for referer domain: ${refererDomain}. Allowed domains: ${allowedDomains.join(', ')}`);
    return new Response(
      `Access denied. This application can only be embedded from authorized domains.`,
      { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain'
        }
      }
    );
  }
  
  return null; // Referer domain is allowed, continue processing
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext,
) {
  // Check domain whitelist first
  const domainCheckResult = checkDomainWhitelist(request);
  if (domainCheckResult) {
    return Promise.resolve(domainCheckResult);
  }

  return isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={remixContext}
        url={request.url}
      />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={remixContext}
        url={request.url}
      />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
