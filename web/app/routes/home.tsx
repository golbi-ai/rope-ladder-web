import { useEffect, useRef } from "react";
import { Link } from "react-router";
import styles from "./site.module.css";

export function meta() {
  return [
    { title: "rope-ladder — learn an unfamiliar codebase" },
    {
      name: "description",
      content:
        "rope-ladder reads a repository through the coding agent you already use, then writes a curriculum you can keep: cited references, architecture and entity diagrams, and a lesson plan ordered so each topic builds on the last.",
    },
  ];
}

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);

  // Scroll-reveal + typed terminal sessions. The motion CSS is gated on
  // html.js (added pre-paint in root.tsx), so the prerendered / no-JS page
  // shows the finished state and this effect only runs on the client. All
  // motion is skipped under prefers-reduced-motion.
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ran = new WeakSet<Element>();

    function typeText(span: Element, text: string, done: () => void) {
      span.textContent = "";
      span.classList.add(styles.typing);
      let i = 0;
      const step = () => {
        span.textContent = text.slice(0, i);
        if (i < text.length) {
          i++;
          setTimeout(step, 26);
        } else {
          span.classList.remove(styles.typing);
          done();
        }
      };
      step();
    }

    function runConsole(con: Element) {
      if (ran.has(con)) return;
      ran.add(con);
      con.classList.add(styles.run);
      const lines = Array.from(con.querySelectorAll<HTMLElement>("." + styles.ln));
      if (reduce) {
        lines.forEach((l) => l.classList.add(styles.on));
        return;
      }
      let i = 0;
      const next = () => {
        if (i >= lines.length) return;
        const ln = lines[i++];
        ln.classList.add(styles.on);
        const cmd = ln.querySelector<HTMLElement>("." + styles.cmd);
        if (cmd) typeText(cmd, cmd.textContent ?? "", () => setTimeout(next, 300));
        else setTimeout(next, 340);
      };
      next();
    }

    function activate(el: Element) {
      el.classList.add(styles.in);
      if (el.classList.contains(styles.console)) runConsole(el);
    }

    const targets = root.querySelectorAll<HTMLElement>(
      "." + styles.reveal + ", ." + styles.stagger + ", ." + styles.console,
    );
    if (!("IntersectionObserver" in window)) {
      targets.forEach(activate);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          activate(e.target);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main ref={mainRef}>
      {/* ============================== HERO ============================== */}
      <section className={`wrap ${styles.hero}`}>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>Learn an unfamiliar codebase</p>
            <h1>Climb into a codebase with a map, not a scavenger hunt.</h1>
            <p className={styles.lead}>
              rope-ladder reads a repository through the coding agent you
              already use, then writes a curriculum you can keep: cited
              references, architecture and entity diagrams, and a lesson plan
              ordered so each topic builds on the one before it.
            </p>
            <div className={styles.actions}>
              <Link className="btn btn-primary" to="/install">Install rope-ladder</Link>
              <Link className={`btn ${styles.secondary}`} to="/catalog">Browse the catalog</Link>
            </div>
            <p className={styles.reassure}>
              Runs locally against your own provider. No accounts, no telemetry,
              nothing uploaded unless you choose to publish.
            </p>
          </div>

          <div className={`${styles.console} ${styles.reveal}`} aria-hidden="true">
            <div className={styles.phead}><span className={styles.pl}>your terminal · generate</span></div>
            <div className={styles.cbody}>
              <div className={styles.ln}><span className={styles.p}>❯ </span><span className={styles.cmd}>rope-ladder init -provider claude -source ~/src/acme-api ./curriculum</span></div>
              <div className={styles.ln}>Initialized curriculum at ./curriculum</div>
              <div className={styles.ln}><span className={styles.dim}>source</span> ~/src/acme-api · <span className={styles.dim}>provider</span> claude</div>
              <div className={styles.ln} style={{ marginTop: 12 }}><span className={styles.p}>❯ </span><span className={styles.cmd}>rope-ladder lesson-plan -allow-source-transfer ./curriculum</span></div>
              <div className={styles.ln}><span className={styles.dim}>•</span> indexing — walking the source tree</div>
              <div className={styles.ln}><span className={styles.dim}>•</span> indexed — 258 eligible files · 231 skeletons, 27 full bodies</div>
              <div className={styles.ln}><span className={styles.dim}>•</span> analyzing source — claude reading the repository</div>
              <div className={styles.ln}><span className={styles.dim}>•</span> verifying citations — 9 cited sources · <span className={styles.ok}>6 verified</span></div>
              <div className={styles.ln}><span className={styles.ok}>✓</span> rendered 9 artifacts in 5m 09s</div>
              <div className={styles.ln}><span className={styles.rel}>lesson-plan.md</span> · guides/survival.md · references/ · architecture.html</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= THE LOOP ========================= */}
      <section className={styles.section}>
        <div className="wrap">
          <div className="fig"><span className="n">Fig. 01</span><span className="t">How it works</span></div>
          <h2>Generate the curriculum, then study it in order.</h2>
          <p>
            Three commands take you from a fresh clone to a lesson plan you can
            follow. Nothing is inferred about where to start — the order comes
            from the code itself.
          </p>
          <div className={`${styles.steps} ${styles.stagger}`}>
            <article className={styles.step}>
              <b>01 · Generate</b>
              <h3>Point it at the repo</h3>
              <p>Give rope-ladder a source directory and your agent. It runs a bounded, read-only analysis and writes the curriculum to its own local workspace — your source tree is never modified.</p>
            </article>
            <article className={styles.step}>
              <b>02 · Study</b>
              <h3>Follow the ladder</h3>
              <p>Read the references and the architecture and entity diagrams, then work through lessons in prerequisite order. No more guessing which file to open first.</p>
            </article>
            <article className={styles.step}>
              <b>03 · Practice</b>
              <h3>Answer as you go</h3>
              <p>The built-in teaching assistant asks one question at a time and records your answers in a private local journal. Nothing leaves your machine.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ===================== WHAT IT WRITES + TA ===================== */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={styles.split}>
            <div>
              <div className="fig"><span className="n">Fig. 02</span><span className="t">What it writes</span></div>
              <h2>A curriculum, not a chat transcript.</h2>
              <p>
                Every claim is anchored to a file, and external references are
                fetched and checked before they ship — the ones that don't hold
                up are marked, not quietly dropped.
              </p>
              <p>
                You get Markdown and self-contained HTML you can read offline,
                commit next to the code, or hand to the next person who joins.
                The teaching assistant then quizzes you against it and keeps
                score only for you.
              </p>
            </div>

            <div className={`${styles.console} ${styles.reveal}`} aria-hidden="true">
              <div className={styles.phead}><span className={styles.pl}>your terminal · teaching assistant</span></div>
              <div className={styles.cbody}>
                <div className={styles.ln}><span className={styles.p}>❯ </span><span className={styles.cmd}>rope-ladder ta ./curriculum</span></div>
                <div className={styles.ln}><span className={styles.dim}>Lesson 3 / 12 ·</span> Coverage links and drift detection</div>
                <div className={styles.ln} style={{ marginTop: 10 }}>A coverage link stores a SHA-256 hash of the code range</div>
                <div className={styles.ln}>it points at. Why hash the range instead of pinning a</div>
                <div className={styles.ln}>line number?</div>
                <div className={styles.ln} style={{ marginTop: 10 }}><span className={styles.p}>› </span><span className={styles.cmd}>lines shift on every edit — the hash catches silent drift</span></div>
                <div className={styles.ln}><span className={styles.ok}>✓</span> Recorded to your private journal.</div>
                <div className={styles.ln}><span className={styles.rel}>next ›</span> prerequisite met — impact analysis unlocked.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= PUBLISH / CATALOG ========================= */}
      <section className={styles.section}>
        <div className="wrap">
          <div className="fig"><span className="n">Fig. 03</span><span className="t">Share what's yours to share</span></div>
          <h2>Public curricula are reviewed pull requests.</h2>
          <p>
            When a curriculum comes from code you're free to disclose, rope-ladder
            prepares a candidate for the public catalog. It never publishes on
            its own, and it never uploads your journal, workspace, caches, or
            provider credentials.
          </p>
          <pre className={styles.code}>rope-ladder publish --metadata ./metadata.yaml --slug your-codebase --confirm-public ./curriculum</pre>
          <div className={styles.catalogTease}>
            <strong>Curriculum catalog</strong>
            <span>Reviewed, merged lesson plans from public repositories — read one before you install.</span>
            <div className={styles.actions}>
              <Link className="btn btn-primary" to="/catalog">Open the catalog</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
