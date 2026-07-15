import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Chrome.module.css";

// A rope ladder: two rope rails with sagging rungs and knotted ends. Solid
// fills from the brand palette's deeper shades — no gradient, which washed out
// at nav size on dark chrome. Honey rails and rope-eye loops; teal rungs and
// matched knots.
const honey = "#c9a24f";
const teal = "#7fb0a6";

function Mark() {
  return (
    <svg className={styles.mark} viewBox="0 0 28 34" width="24" height="30" fill="none" aria-hidden="true">
      {/* rope-eye loops + rails — honey */}
      <g stroke={honey} strokeLinecap="round" fill="none">
        <circle cx="8" cy="5" r="2.5" strokeWidth="1.9" />
        <circle cx="20" cy="5" r="2.5" strokeWidth="1.9" />
        <path d="M8 7.5 V30" strokeWidth="2.5" />
        <path d="M20 7.5 V30" strokeWidth="2.5" />
      </g>
      {/* sagging rungs — teal */}
      <g stroke={teal} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M8 13 Q14 15.7 20 13" />
        <path d="M8 19.5 Q14 22.2 20 19.5" />
        <path d="M8 26 Q14 28.7 20 26" />
      </g>
      {/* knots where each rung meets a rail — teal, matching the rungs */}
      <g fill={teal}>
        <circle cx="8" cy="13" r="1.9" /><circle cx="20" cy="13" r="1.9" />
        <circle cx="8" cy="19.5" r="1.9" /><circle cx="20" cy="19.5" r="1.9" />
        <circle cx="8" cy="26" r="1.9" /><circle cx="20" cy="26" r="1.9" />
      </g>
    </svg>
  );
}

export function Nav() {
  return <header className={styles.nav}><div className={`wrap ${styles.navInner}`}>
    <Link to="/" className={styles.brand} aria-label="rope-ladder home"><Mark /><span>rope-ladder</span></Link>
    <nav className={styles.links} aria-label="Primary"><Link to="/docs">Docs</Link><Link to="/catalog">Curricula</Link><a href="https://github.com/golbi-ai/rope-ladder">GitHub</a></nav>
    <div className={styles.right}><ThemeToggle id="rpldr-top" /><Link to="/install" className="btn btn-primary">Install</Link></div>
  </div></header>;
}

export function Footer() {
  return <footer className={styles.footer}><div className="wrap"><div className={styles.footerGrid}>
    <div><div className={styles.brand}><Mark /><span>rope-ladder</span></div><p>Turn unfamiliar code into a portable, evidence-backed curriculum.</p></div>
    <div><h2>Product</h2><Link to="/install">Install</Link><Link to="/docs">Documentation</Link></div>
    <div><h2>Catalog</h2><Link to="/catalog">Browse curricula</Link><a href="https://github.com/golbi-ai/rope-ladder-lesson-plans">Submit a plan</a></div>
  </div><div className={styles.bottom}><span>© 2026 Golbi · rpldr.golbi.ai</span><span>Public, local-first curriculum tooling</span><ThemeToggle id="rpldr-footer" /></div></div></footer>;
}
