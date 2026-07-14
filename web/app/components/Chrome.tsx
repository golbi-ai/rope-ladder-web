import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Chrome.module.css";

// A rope ladder: two rope rails with sagging rungs and knotted ends. The warm
// brand gradient is the one place the visual system permits a gradient. `id`
// namespaces the gradient so the nav and footer marks don't collide.
function Mark({ id }: { id: string }) {
  const g = `rl-mark-${id}`;
  return (
    <svg className={styles.mark} viewBox="0 0 24 27" width="19" height="27" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8b7b0" />
          <stop offset="52%" stopColor="#e6c786" />
          <stop offset="100%" stopColor="#a7cbc4" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${g})`} strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M6.6 3.2 V23.8" />
        <path d="M17.4 3.2 V23.8" />
        <path d="M6.6 8 Q12 10.6 17.4 8" />
        <path d="M6.6 13.5 Q12 16.1 17.4 13.5" />
        <path d="M6.6 19 Q12 21.6 17.4 19" />
      </g>
      <circle cx="6.6" cy="3.3" r="1.75" fill={`url(#${g})`} />
      <circle cx="17.4" cy="3.3" r="1.75" fill={`url(#${g})`} />
    </svg>
  );
}

export function Nav() {
  return <header className={styles.nav}><div className={`wrap ${styles.navInner}`}>
    <Link to="/" className={styles.brand} aria-label="rope-ladder home"><Mark id="nav" /><span>rope-ladder</span></Link>
    <nav className={styles.links} aria-label="Primary"><Link to="/docs">Docs</Link><Link to="/catalog">Curricula</Link><a href="https://github.com/golbi-ai/rope-ladder">GitHub</a></nav>
    <div className={styles.right}><ThemeToggle id="rpldr-top" /><Link to="/install" className="btn btn-primary">Install</Link></div>
  </div></header>;
}

export function Footer() {
  return <footer className={styles.footer}><div className="wrap"><div className={styles.footerGrid}>
    <div><div className={styles.brand}><Mark id="foot" /><span>rope-ladder</span></div><p>Turn unfamiliar code into a portable, evidence-backed curriculum.</p></div>
    <div><h2>Product</h2><Link to="/install">Install</Link><Link to="/docs">Documentation</Link></div>
    <div><h2>Catalog</h2><Link to="/catalog">Browse curricula</Link><a href="https://github.com/golbi-ai/rope-ladder-lesson-plans">Submit a plan</a></div>
  </div><div className={styles.bottom}><span>© 2026 Golbi · rpldr.golbi.ai</span><span>Public, local-first curriculum tooling</span><ThemeToggle id="rpldr-footer" /></div></div></footer>;
}
