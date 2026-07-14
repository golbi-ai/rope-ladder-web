import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToReadableStream } from "react-dom/server";

// Custom server entry so the build does NOT require @react-router/node + isbot
// in `dependencies` (the framework's default entry pulls those, and its auto-
// detection would mutate package.json mid-build). This site is prerender-only:
// the Go binary serves the static output; nothing renders at request time in
// production. Web-streams renderToReadableStream (React 19) keeps it dependency-
// free. We always await `allReady` so every route is fully materialised for
// static generation / SPA prerendering.
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  let didError = false;
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        didError = true;
        console.error(error);
      },
    },
  );

  await body.allReady;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: didError ? 500 : responseStatusCode,
  });
}
