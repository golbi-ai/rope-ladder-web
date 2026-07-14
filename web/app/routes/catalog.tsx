import { useEffect, useState } from "react";
import styles from "./site.module.css";

type Entry = {
  slug: string;
  name: string;
  codebase?: string;
  description: string;
  tags: string[];
};

export function meta() {
  return [{ title: "Public rope-ladder curricula" }];
}

export default function Catalog() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/catalog")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("catalog unavailable")))
      .then(setEntries)
      .catch(() => setError("The catalog is temporarily unavailable. You can browse its GitHub repository directly."));
  }, []);

  return <main className={`wrap ${styles.page}`}>
    <div className={styles.catalogHead}><div>
      <p className={styles.eyebrow}>Public curriculum catalog</p>
      <h1>Reviewed lesson plans for public codebases.</h1>
      <p>Merged entries come from the latest main branch of the public catalog. Each links to its complete, versioned artifacts on GitHub.</p>
    </div></div>
    {error && <p className={styles.status}>{error} <a className="ilink" href="https://github.com/golbi-ai/rope-ladder-lesson-plans">Open the catalog</a>.</p>}
    {entries === null && !error && <p className={styles.status}>Loading merged curricula…</p>}
    {entries?.length === 0 && <p className={styles.status}>No curricula have merged yet. Generate one from source you may share, then submit a reviewed candidate.</p>}
    <div className={styles.entries}>{entries?.map((entry) => <article className={styles.entry} key={entry.slug}>
      <p className={styles.eyebrow}>{entry.slug}</p>
      <h2><a href={`https://github.com/golbi-ai/rope-ladder-lesson-plans/tree/main/plans/${entry.slug}`}>{entry.name}</a></h2>
      <p>{entry.description}</p>
      {entry.codebase && <p className={styles.source}><a href={entry.codebase}>Public source ↗</a></p>}
      <div className={styles.tags}>{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </article>)}</div>
  </main>;
}
