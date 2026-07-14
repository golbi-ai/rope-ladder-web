import styles from "./ThemeToggle.module.css";

const KEY = "rpldr-theme";

// React port of the static pages' theme toggle. Every instance flips the same
// data-theme attribute on <html> and persists it to localStorage; the sun/moon
// swap is pure CSS keyed off that attribute, so all mounted toggles stay in sync
// without shared React state. The initial theme is set pre-paint in root.tsx.
export function ThemeToggle({ id }: { id: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode / storage disabled — theme still applies for this page */
    }
  }

  return (
    <button className={styles.toggle} id={id} type="button" aria-label="Toggle dark mode" onClick={toggle}>
      <svg className={styles.sun} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
      </svg>
      <svg className={styles.moon} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 14.4A8.2 8.2 0 1 1 9.6 4 6.4 6.4 0 0 0 20 14.4z" />
      </svg>
    </button>
  );
}
