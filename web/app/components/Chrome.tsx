import { Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Chrome.module.css";

function Mark() {
  return <span className={styles.mark} aria-hidden="true"><i></i><i></i><i></i></span>;
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
