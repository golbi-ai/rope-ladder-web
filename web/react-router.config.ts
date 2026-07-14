import type { Config } from "@react-router/dev/config";

// Static, prerendered marketing site. The Go binary is the serving runtime
// (decide-web-go-server-runtime): it embeds and serves the prerendered client
// output as static assets. No Node server ships to production.
export default {
  // SPA + prerender: no request-time SSR. Every static route is rendered to
  // HTML at build time so the Go server can serve plain files.
  ssr: false,
  // Prerender ALL static routes (/, /install, /changelog, /privacy, /terms,
  // /docs). There are no dynamic (param) routes to enumerate.
  prerender: true,
  // Land the client build at web/dist/client so `//go:embed web/dist/client`
  // has a stable, committed directory to embed against.
  buildDirectory: "dist",
} satisfies Config;
