/// <reference types="vite/client" />

// `.mdx` route/content modules compile to a default-exported React component
// (see @mdx-js/rollup wired into vite.config.ts). Typing it here lets both
// route imports and `import` statements typecheck. `*.module.css` is already
// declared by vite/client.
declare module "*.mdx" {
  import type { ReactElement } from "react";
  // A plain function signature (not ComponentType, which admits class
  // components) — react-router's generated route types require the default
  // export to be callable.
  export default function MDXContent(props: Record<string, unknown>): ReactElement;
}

// PostHog attaches its client to window via the snippet inlined in root.tsx.
// Only the surface the app calls is typed; the rest of the SDK is untyped by
// design (it is a runtime-loaded global).
interface Window {
  posthog?: {
    capture: (event: string, properties?: Record<string, unknown>) => void;
    init?: (token: string, config?: Record<string, unknown>) => void;
  };
}
