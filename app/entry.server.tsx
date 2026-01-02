import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";

// Reject pending streamed promises after 10s (optional, but sane default)
export const streamTimeout = 10_000;

// Abort React render slightly after streamTimeout so errors can flush
const ABORT_DELAY = streamTimeout + 1_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false;

    const userAgent = request.headers.get("user-agent");
    const isBotRequest = Boolean(userAgent && isbot(userAgent));

    // Bots (and SPA mode) should wait for all content before responding
    const callbackName: "onAllReady" | "onShellReady" =
      isBotRequest || (routerContext as any).isSpaMode ? "onAllReady" : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [callbackName]() {
          shellRendered = true;

          responseHeaders.set("Content-Type", "text/html; charset=utf-8");

          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          resolve(
            new Response(stream, {
              status: responseStatusCode,
              headers: responseHeaders,
            }),
          );

          pipe(body);
        },

        onShellError(error: unknown) {
          reject(error);
        },

        onError(error: unknown) {
          // If shell already rendered, errors are likely from streamed chunks
          // Logging helps during dev without crashing the response
          if (shellRendered) console.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
