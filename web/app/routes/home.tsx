import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import styles from "./home.module.css";

export function meta() {
  return [
    { title: "rope-ladder: learn an unfamiliar codebase" },
    {
      name: "description",
      content:
        "rope-ladder reads a repository through the coding agent you already use and writes a portable curriculum: cited references, self-contained diagrams, and a prerequisite-ordered lesson plan.",
    },
  ];
}

const INSTALL = "go install github.com/golbi-ai/rope-ladder/cmd/rope-ladder@latest";

// Artifact-type colors. Stated once in the architecture diagram, echoed once
// in the file tree. Color means artifact identity, nothing else.
const REF = "#7fb0a6", DIAG = "#c9a24f", PLAN = "#7ca06b", COV = "#d49890";

type TreeRow = { glyph: string; name: string; desc: string; type?: string };
const TREE: TreeRow[] = [
  { glyph: "", name: "curriculum/", desc: "" },
  { glyph: "├──", name: "lesson-plan.md", desc: "The lessons, ordered by prerequisite.", type: PLAN },
  { glyph: "├──", name: "lesson-plan.json", desc: "The same plan as a manifest for the teaching assistant.", type: PLAN },
  { glyph: "├──", name: "guides/survival.md", desc: "Cross-cutting ideas worth knowing before the first file.", type: REF },
  { glyph: "├──", name: "references/", desc: "Three cited references: domain, implementation, entities.", type: REF },
  { glyph: "├──", name: "architecture.html", desc: "A self-contained component diagram, readable offline.", type: DIAG },
  { glyph: "├──", name: "entity-relationship.html", desc: "A self-contained entity-relationship diagram.", type: DIAG },
  { glyph: "└──", name: "coverage.md", desc: "What was indexed, what was excluded, how well it is evidenced.", type: COV },
];

function GenerateTerminal() {
  return (
    <div className={`${styles.console} ${styles.reveal}`} aria-hidden="true">
      <div className={styles.phead}><span className={styles.pl}>rope-ladder lesson-plan</span></div>
      <div className={styles.cbody}>
        <div className={styles.ln}><span className={styles.p}>❯ </span><span className={styles.cmd}>rope-ladder init -provider claude -source ~/src/acme-api ./curriculum</span></div>
        <div className={styles.ln}>Initialized curriculum at ./curriculum</div>
        <div className={styles.ln}><span className={styles.dim}>source</span> ~/src/acme-api · <span className={styles.dim}>provider</span> claude</div>
        <div className={styles.ln} style={{ marginTop: 11 }}><span className={styles.p}>❯ </span><span className={styles.cmd}>rope-ladder lesson-plan -allow-source-transfer ./curriculum</span></div>
        <div className={styles.ln}><span className={styles.dim}>•</span> indexing · walking the source tree</div>
        <div className={styles.ln}><span className={styles.dim}>•</span> indexed · 258 eligible files · 231 skeletons, 27 full bodies</div>
        <div className={styles.ln}><span className={styles.dim}>•</span> analyzing source · claude reading the repository</div>
        <div className={styles.ln}><span className={styles.dim}>•</span> verifying citations · 9 sources checked</div>
        <div className={styles.ln}><span className={styles.ok}>✓</span> rendered 9 artifacts in 5m 09s</div>
      </div>
    </div>
  );
}

function StudyTerminal() {
  return (
    <div className={`${styles.console} ${styles.reveal}`} aria-hidden="true">
      <div className={styles.phead}><span className={styles.pl}>rope-ladder ta</span></div>
      <div className={styles.cbody}>
        <div className={styles.ln}><span className={styles.p}>❯ </span><span className={styles.cmd}>rope-ladder ta ./curriculum</span></div>
        <div className={styles.ln}><span className={styles.dim}>Lesson 3 / 12 ·</span> Coverage links and drift detection</div>
        <div className={styles.ln} style={{ marginTop: 9 }}>A coverage link stores a SHA-256 hash of the code range</div>
        <div className={styles.ln}>it points at. Why hash the range, not the line number?</div>
        <div className={styles.ln} style={{ marginTop: 9 }}><span className={styles.p}>› </span><span className={styles.cmd}>lines shift on every edit, so the hash catches silent drift</span></div>
        <div className={styles.ln}><span className={styles.ok}>✓</span> Recorded to your private journal.</div>
        <div className={styles.ln}><span className={styles.rel}>next ›</span> prerequisite met. Impact analysis unlocked.</div>
      </div>
    </div>
  );
}

// One run, drawn once. The four output-node colors are the page's legend for
// artifact identity; the file tree reuses them.
function ArchitecturePlate() {
  const ink = "var(--ink)", mute = "var(--mute)";
  const box = (x: number, y: number, w: number, h: number, label: string, accent?: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="7" fill="var(--paper-lifted)" stroke={accent ?? mute} strokeWidth={accent ? 1.7 : 1.1} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11.5" fill={ink}>{label}</text>
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={mute} strokeWidth="1.3" markerEnd="url(#pv-arw)" />
  );
  return (
    <svg viewBox="0 0 720 176" className={styles.svg} role="img" aria-label="A run reads the source once, then writes a curriculum and its artifacts beside it">
      <defs>
        <marker id="pv-arw" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={mute} />
        </marker>
      </defs>
      {box(14, 66, 118, 44, "source repo")}
      {arrow(132, 88, 176, 88)}
      {box(176, 60, 150, 56, "read-only analysis", REF)}
      <text x={251} y={132} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" fill={mute}>your agent · one pass</text>
      {arrow(326, 88, 370, 88)}
      {box(370, 60, 132, 56, "curriculum", DIAG)}
      {arrow(502, 74, 560, 40)}
      {arrow(502, 84, 560, 76)}
      {arrow(502, 94, 560, 112)}
      {arrow(502, 104, 560, 148)}
      {box(560, 22, 146, 34, "references", REF)}
      {box(560, 58, 146, 34, "diagrams", DIAG)}
      {box(560, 94, 146, 34, "lesson plan", PLAN)}
      {box(560, 130, 146, 34, "coverage report", COV)}
    </svg>
  );
}

// The lesson plan as a small prerequisite graph. Completed nodes teal, the
// unlocked next node sage, locked nodes neutral.
function PrereqGraph() {
  const ink = "var(--ink)", mute = "var(--mute)";
  const teal = "#7fb0a6", sage = "#7ca06b";
  const node = (x: number, y: number, label: string, state: "done" | "next" | "locked") => (
    <g>
      <rect x={x} y={y} width="86" height="30" rx="7" fill="var(--paper-lifted)"
        stroke={state === "done" ? teal : state === "next" ? sage : mute}
        strokeWidth={state === "locked" ? 1.1 : 1.7} />
      <text x={x + 43} y={y + 19} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5"
        fill={state === "locked" ? mute : ink}>{label}</text>
    </g>
  );
  const edge = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={mute} strokeWidth="1.3" markerEnd="url(#pv-parw)" />
  );
  return (
    <svg viewBox="0 0 320 196" className={styles.svg} role="img" aria-label="Lessons unlock in prerequisite order: two are done, one is next, three are locked behind it">
      <defs>
        <marker id="pv-parw" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill={mute} />
        </marker>
      </defs>
      {node(16, 12, "decisions", "done")}
      {node(16, 84, "the store", "done")}
      {edge(102, 27, 128, 27)}
      {edge(102, 99, 128, 84)}
      {node(128, 48, "coverage", "next")}
      {edge(214, 63, 226, 63)}
      {node(226, 48, "impact", "locked")}
      {edge(170, 78, 170, 148)}
      {node(128, 148, "review", "locked")}
      {edge(214, 163, 226, 130)}
      {node(226, 108, "propagate", "locked")}
    </svg>
  );
}

export default function Home() {
  const rootRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ran = new WeakSet<Element>();
    function typeText(span: Element, text: string, done: () => void) {
      span.textContent = "";
      span.classList.add(styles.typing);
      let i = 0;
      const step = () => {
        span.textContent = text.slice(0, i);
        if (i < text.length) { i++; setTimeout(step, 24); }
        else { span.classList.remove(styles.typing); done(); }
      };
      step();
    }
    function runConsole(con: Element) {
      if (ran.has(con)) return;
      ran.add(con);
      con.classList.add(styles.run);
      const lines = Array.from(con.querySelectorAll<HTMLElement>("." + styles.ln));
      if (reduce) { lines.forEach((l) => l.classList.add(styles.on)); return; }
      let i = 0;
      const next = () => {
        if (i >= lines.length) return;
        const ln = lines[i++];
        ln.classList.add(styles.on);
        const cmd = ln.querySelector<HTMLElement>("." + styles.cmd);
        if (cmd) typeText(cmd, cmd.textContent ?? "", () => setTimeout(next, 300));
        else setTimeout(next, 320);
      };
      next();
    }
    function activate(el: Element) {
      el.classList.add(styles.in);
      if (el.classList.contains(styles.console)) runConsole(el);
    }
    const targets = root.querySelectorAll<HTMLElement>("." + styles.reveal + ", ." + styles.console);
    if (!("IntersectionObserver" in window)) { targets.forEach(activate); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function copyInstall(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    navigator.clipboard?.writeText(INSTALL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <main ref={rootRef} className={styles.guide}>
      {/* ==================== HERO: the generate run ==================== */}
      <section className={styles.hero}>
        <div>
          <h1>Climb into a codebase with a map, not a scavenger hunt.</h1>
          <p className={styles.lead}>
            rope-ladder reads a repository through the coding agent you already
            use. It writes a curriculum you can keep: cited references, offline
            diagrams, and a lesson plan ordered by prerequisite.
          </p>
          <div className={styles.install}>
            <code>{INSTALL}</code>
            <button type="button" className={styles.copyBtn} onClick={copyInstall} aria-label="Copy install command">{copied ? "copied" : "copy"}</button>
          </div>
          <p className={styles.sidenote}>Runs locally. No accounts. No telemetry. Your source is never modified.</p>
          <div className={styles.cta}>
            <Link className="btn btn-primary" to="/install">Install rope-ladder</Link>
          </div>
        </div>
        <div>
          <GenerateTerminal />
          <dl className={styles.stats}>
            <div><dt>258</dt><dd>files read</dd></div>
            <div><dt>9</dt><dd>artifacts written</dd></div>
            <div><dt>5m 09s</dt><dd>one pass</dd></div>
          </dl>
        </div>
      </section>

      {/* ==================== recessed plane: the diagram ==================== */}
      <section className={styles.planeDeep}>
        <h2 className={styles.planeHead}>The source is read once. The curriculum is written beside it, never over it.</h2>
        <ArchitecturePlate />
      </section>

      {/* ==================== study: rail on the left ==================== */}
      <section className={styles.spreadLeft}>
        <div className={styles.railBare}>
          <PrereqGraph />
          <p className={styles.sidenote}>Finished lessons unlock the next. The order comes from the code.</p>
        </div>
        <div className={styles.body}>
          <h2>Study it in order</h2>
          <p>
            Start with the map, not the first file you happen to open.
            rope-ladder writes cited references for the domain and the
            implementation. It renders diagrams you can open offline. The lesson
            plan is ordered by prerequisite, so you never guess where to begin.
          </p>
        </div>
      </section>

      {/* ==================== lifted plane: practice ==================== */}
      <section className={styles.plane}>
        <div className={styles.planeGrid}>
          <h2>Practice against it</h2>
          <p>
            Reading is not remembering. The teaching assistant asks one question
            at a time about what it wrote. The next lesson opens only when its
            prerequisite is met. Your answers stay in a private journal on your
            machine.
          </p>
        </div>
        <div className={styles.taWrap}>
          <StudyTerminal />
          <p className={`${styles.sidenote} ${styles.taNote}`}>The journal is local. No scores leave your machine.</p>
        </div>
      </section>

      {/* ==================== what a run writes: file tree ==================== */}
      <section className={styles.spreadRight}>
        <div className={styles.body}>
          <h2>What a run writes</h2>
          <p>Nine files in one directory, yours to keep.</p>
        </div>
        <div className={styles.tree}>
          {TREE.map((row) => (
            <div key={row.name} className={styles.treeRow}>
              <span className={styles.treeName}>
                {row.glyph && <span className={styles.treeGlyph}>{row.glyph} </span>}
                {row.type && <span className={styles.treeKey} style={{ background: row.type }} />}
                {row.name}
              </span>
              {row.desc && <span className={styles.treeDesc}>{row.desc}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ==================== catalog ==================== */}
      <section className={styles.spreadLeftBody}>
        <div className={styles.body}>
          <h2>Public curricula are reviewed pull requests</h2>
          <p>
            A finished curriculum is its own git repository. Sharing one is an
            ordinary pull request to the open catalog, reviewed in public.
            Nothing is uploaded on your behalf. Only the rendered artifacts
            travel. Your journal, caches, and credentials stay behind.
          </p>
          <div className={styles.cta}>
            <Link className="btn btn-primary" to="/catalog">Open the catalog</Link>
          </div>
        </div>
        <div className={styles.railBare}>
          <pre className={styles.usage}>{`rope-ladder remote set ./curriculum \\
  git@github.com:you/rope-ladder-lesson-plans.git
git -C ./curriculum push -u origin HEAD
# then open a pull request`}</pre>
        </div>
      </section>
    </main>
  );
}
