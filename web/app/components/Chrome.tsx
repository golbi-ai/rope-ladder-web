import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Chrome.module.css";

// A rope ladder: two rope rails with sagging rungs and knotted ends. The warm
// brand gradient is the one place the visual system permits a gradient. `id`
// namespaces the gradient so the nav and footer marks don't collide.
function Mark({ id }: { id: string }) {
  const g = `rl-mark-${id}`;
  return (
    <svg className={styles.mark} viewBox="0 0 28 34" width="24" height="30" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9b0a7" />
          <stop offset="50%" stopColor="#e8c579" />
          <stop offset="100%" stopColor="#9ccabf" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${g})`} strokeLinecap="round" fill="none">
        {/* rope-eye loops the ladder hangs from */}
        <circle cx="8" cy="5" r="2.5" strokeWidth="1.9" />
        <circle cx="20" cy="5" r="2.5" strokeWidth="1.9" />
        {/* rope rails */}
        <path d="M8 7.5 V30" strokeWidth="2.5" />
        <path d="M20 7.5 V30" strokeWidth="2.5" />
        {/* sagging rungs */}
        <path d="M8 13 Q14 15.7 20 13" strokeWidth="2.5" />
        <path d="M8 19.5 Q14 22.2 20 19.5" strokeWidth="2.5" />
        <path d="M8 26 Q14 28.7 20 26" strokeWidth="2.5" />
      </g>
      {/* knots where each rung meets a rail */}
      <g fill={`url(#${g})`}>
        <circle cx="8" cy="13" r="1.9" /><circle cx="20" cy="13" r="1.9" />
        <circle cx="8" cy="19.5" r="1.9" /><circle cx="20" cy="19.5" r="1.9" />
        <circle cx="8" cy="26" r="1.9" /><circle cx="20" cy="26" r="1.9" />
      </g>
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
