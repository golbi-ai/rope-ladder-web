import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Footer, Nav } from "./components/Chrome";
import "./styles/tokens.css";

const themePrepaint = `(function () {
  var root = document.documentElement; var key = "rpldr-theme"; var saved = null;
  root.classList.add("js");
  try { saved = localStorage.getItem(key); } catch (e) {}
  if (saved) root.setAttribute("data-theme", saved);
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) root.setAttribute("data-theme", "dark");
})();`;

export function Layout({ children }: { children: ReactNode }) {
  return <html lang="en" data-theme="light" suppressHydrationWarning><head>
    <meta charSet="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Public+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script dangerouslySetInnerHTML={{ __html: themePrepaint }} />
    <Meta /><Links />
  </head><body>{children}<ScrollRestoration /><Scripts /></body></html>;
}

export default function App() {
  return <><Nav /><Outlet /><Footer /></>;
}
