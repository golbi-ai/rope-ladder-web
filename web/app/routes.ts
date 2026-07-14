import { type RouteConfig, index, route } from "@react-router/dev/routes";

// The site is prerendered and its catalog list refreshes from the public
// catalog's latest main branch through the Go API. No account or learner state
// exists on the public surface.
export default [
  index("routes/home.tsx"),
  route("install", "routes/install.tsx"),
  route("docs", "routes/docs.tsx"),
  route("catalog", "routes/catalog.tsx"),
] satisfies RouteConfig;
