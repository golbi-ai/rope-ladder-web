/// <reference types="vitest/config" />
import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The reactRouter() plugin and Vitest cannot coexist in the same pipeline: the
// framework plugin owns route module transforms / SSR entry generation that the
// test runner has no way to satisfy. Under Vitest we swap it for the plain
// @vitejs/plugin-react transform so components still get the React JSX runtime.
// The MDX plugin runs in BOTH pipelines and MUST precede reactRouter() so `.mdx`
// route modules are already compiled to JS before the router inspects them.
const testing = !!process.env.VITEST;

export default defineConfig({
  plugins: [mdx(), testing ? react() : reactRouter()],
  server: {
    // Dev-only: forward the dynamic endpoints the Go server owns so the Vite
    // dev server can exercise the real backend at :8080.
    proxy: {
      "/api": "http://localhost:8080",
      "/health": "http://localhost:8080",
    },
  },
  // Frontend test stack: Vitest + React Testing Library + jsdom. Config lives
  // here (not a separate vitest.config.ts) so the test transform reuses this
  // file's Vite pipeline verbatim.
  test: {
    environment: "jsdom",
    globals: true,
    css: {
      // Components import `styles` from `*.module.css` and reference
      // `styles.camelCaseName`; the non-scoped strategy makes those class names
      // resolve to their literal source names in tests instead of hashes.
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
  },
});
