import type { MouseEvent } from "react";
import styles from "./site.module.css";

// Scroll the target section into view ourselves. Plain `#` anchors are
// unreliable here because React Router's <ScrollRestoration> manages window
// scroll on location changes and undoes the browser's native hash jump, so
// links to lower sections appeared to do nothing. preventDefault stops the
// router navigation; scrollIntoView respects the section's scroll-margin-top.
function scrollToSection(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function meta() {
  return [
    { title: "rope-ladder — documentation" },
    {
      name: "description",
      content:
        "Reference for the rope-ladder CLI: the commands, how analysis works, the artifacts it writes, its privacy boundaries, and how to contribute to the public catalog.",
    },
  ];
}

const SECTIONS: [string, string][] = [
  ["overview", "Overview"],
  ["quickstart", "Quickstart"],
  ["commands", "Commands"],
  ["analysis", "How analysis works"],
  ["artifacts", "Curriculum artifacts"],
  ["privacy", "Privacy & data"],
  ["catalog", "The public catalog"],
];

type Cmd = { name: string; usage: string; desc: string; flags?: [string, string][] };

const COMMANDS: Cmd[] = [
  {
    name: "init",
    usage: "rope-ladder init -provider <id> -source <codebase> <curriculum>",
    desc: "Create a curriculum workspace — its own local git repo, kept separate from the codebase you are studying.",
    flags: [
      ["-provider", "AgentRouter provider used to read the code, e.g. claude, codex, or an HTTP model."],
      ["-model", "Provider model override."],
      ["-source", "Path to the codebase to study."],
    ],
  },
  {
    name: "lesson-plan",
    usage: "rope-ladder lesson-plan -allow-source-transfer <curriculum>",
    desc: "Generate — or safely update — the curriculum artifacts. Source transfer is opt-in per run.",
    flags: [
      ["-allow-source-transfer", "Confirm the source may be sent to the provider. Required to contact a model."],
      ["-dry-run", "Inventory the source and print the analysis plan without contacting a provider."],
      ["-input-budget", "Approximate token budget per request. A larger budget fits more source into a single pass."],
      ["-offline", "Skip external citation checks and mark those citations unverified."],
      ["-refresh", "Bypass the local analysis cache and re-run from scratch."],
      ["-include-governance-records", "Include the codebase's own decisions/ and .decide/ records in the analysis."],
      ["-provider / -model", "Override the provider or model for this run."],
      ["-quiet", "Suppress the structured progress written to stderr."],
    ],
  },
  {
    name: "ta",
    usage: "rope-ladder ta <curriculum>",
    desc: "Quiz yourself on the next lesson. Answers go to a private local journal kept outside the workspace.",
    flags: [
      ["-answer", "Record an answer without the interactive prompt."],
      ["-dry-run", "Show the next question without recording progress."],
      ["-journal", "Override the private journal path."],
    ],
  },
  {
    name: "status",
    usage: "rope-ladder status <curriculum>",
    desc: "Show how fresh the curriculum is against the source, and surface any conflicts.",
  },
  {
    name: "remote",
    usage: "rope-ladder remote set <curriculum> <url>",
    desc: "Configure or remove the curriculum repo's origin remote — how you push it to a fork to share it.",
    flags: [
      ["set <url>", "Point the curriculum's origin at a remote."],
      ["remove", "Remove the configured origin remote."],
    ],
  },
  {
    name: "hooks",
    usage: "rope-ladder hooks install <curriculum>",
    desc: "Install or remove stale-curriculum notices in the studied codebase (install | uninstall).",
  },
  {
    name: "mcp",
    usage: "rope-ladder mcp",
    desc: "Start the focused stdio MCP server so an agent can drive the same commands as tools.",
  },
  {
    name: "version",
    usage: "rope-ladder version",
    desc: "Print the build version.",
  },
];

const ARTIFACTS: [string, string][] = [
  ["lesson-plan.md", "The lessons, ordered so each topic builds on its prerequisites. Human-readable."],
  ["lesson-plan.json", "The same plan as a manifest the teaching assistant reads to track your progress."],
  ["guides/survival.md", "Orientation: the cross-cutting ideas worth knowing before you open a single file."],
  ["references/domain-concepts.md", "The problem-domain concepts the codebase implements, each anchored to source."],
  ["references/language-concepts.md", "Implementation and language concepts, with citations to official docs where they apply."],
  ["references/entities.md", "The meaningful data entities — the nouns the system persists and exchanges."],
  ["architecture.html", "A self-contained, offline component diagram."],
  ["entity-relationship.html", "A self-contained, offline ER diagram."],
  ["coverage.md", "What was indexed, what was excluded, and how well each concept is backed by evidence."],
];

export default function Docs() {
  return (
    <main className={`wrap ${styles.docsWrap}`}>
      <aside className={styles.docsNav} aria-label="On this page">
        <p className={styles.eyebrow}>Documentation</p>
        <nav>
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => scrollToSection(e, id)}>{label}</a>
          ))}
        </nav>
        <a className={styles.docsExt} href="https://github.com/golbi-ai/rope-ladder">GitHub ↗</a>
      </aside>

      <div className={styles.docsMain}>
        <header className={styles.docsHead}>
          <h1>Reference</h1>
          <p className={styles.lead}>
            rope-ladder turns an unfamiliar repository into a portable
            curriculum, using a coding agent you configure — without modifying
            the repository. Everything runs locally, and the curriculum is its
            own git repo you can read offline, commit, or share.
          </p>
        </header>

        <section id="overview">
          <h2>Overview</h2>
          <p>
            You point rope-ladder at a codebase and a provider. It reads the
            source, grounds every claim in a real file, checks external
            references, and writes a lesson plan ordered by prerequisites, plus
            references, diagrams, and a coverage report. A built-in teaching
            assistant then quizzes you against what it wrote.
          </p>
          <p>
            Nothing is sent to a provider until you say so, and nothing is
            published unless you push it.
          </p>
        </section>

        <section id="quickstart">
          <h2>Quickstart</h2>
          <p>Three commands take you from a fresh clone to a lesson plan you can follow.</p>
          <pre className={styles.usage}>{`# 1 · create the curriculum workspace
rope-ladder init -provider claude -source ~/src/acme-api ./curriculum

# 2 · read the source and write the curriculum (source transfer is opt-in)
rope-ladder lesson-plan -allow-source-transfer ./curriculum

# 3 · study, one question at a time
rope-ladder ta ./curriculum`}</pre>
          <p>
            Run <code>lesson-plan -dry-run</code> first to see exactly what
            would be sent, without contacting a provider.
          </p>
        </section>

        <section id="commands">
          <h2>Commands</h2>
          {COMMANDS.map((c) => (
            <div key={c.name} className={styles.cmdref}>
              <h3 id={`cmd-${c.name}`}>{c.name}</h3>
              <p>{c.desc}</p>
              <pre className={styles.usage}>{c.usage}</pre>
              {c.flags && (
                <dl className={styles.flags}>
                  {c.flags.map(([flag, meaning]) => (
                    <div key={flag} className={styles.flagRow}>
                      <dt>{flag}</dt>
                      <dd>{meaning}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </section>

        <section id="analysis">
          <h2>How analysis works</h2>
          <p>
            A run is a <strong>single pass</strong> by default: one request to
            your provider. When a codebase is larger than the input budget, it
            is split into a few bounded batches and merged deterministically —
            never silently truncated. The source tree is only ever read.
          </p>
          <p>
            Indexing walks the whole tree. Large files are represented by
            structural skeletons so the entire repository fits the budget, and
            <code>coverage.md</code> records what made it into the prompt and
            what did not. Every concept is anchored to a file; external
            references are fetched and verified, and any that don't resolve are
            marked unverified rather than dropped. Runs use the lowest sampling
            setting and cache their result, so re-running on unchanged source is
            reproducible.
          </p>
        </section>

        <section id="artifacts">
          <h2>Curriculum artifacts</h2>
          <p>Every completed <code>lesson-plan</code> writes:</p>
          <dl className={styles.flags}>
            {ARTIFACTS.map(([file, meaning]) => (
              <div key={file} className={styles.flagRow}>
                <dt>{file}</dt>
                <dd>{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="privacy">
          <h2>Privacy &amp; data</h2>
          <ul>
            <li>Source transfer is an explicit per-run flag (<code>-allow-source-transfer</code>). Nothing is sent to a provider otherwise.</li>
            <li>No accounts and no telemetry. The site itself has none either.</li>
            <li>Your teaching-assistant journal is private and local, kept outside the shared workspace.</li>
            <li><code>-offline</code> skips every network call, including citation checks.</li>
            <li>Provider credentials, caches, and workspace state never leave your machine.</li>
          </ul>
        </section>

        <section id="catalog">
          <h2>The public catalog</h2>
          <p>
            The <a className="ilink" href="/catalog">catalog</a> lists reviewed
            lesson plans that have been merged into the public
            <a className="ilink" href="https://github.com/golbi-ai/rope-ladder-lesson-plans"> rope-ladder-lesson-plans</a> repository.
          </p>
          <p>
            Because a curriculum is its own git repo, you contribute the way you
            contribute any code: point it at your fork, push, and open a pull
            request. Review happens in the open.
          </p>
          <pre className={styles.usage}>{`rope-ladder remote set ./curriculum git@github.com:you/rope-ladder-lesson-plans.git
git -C ./curriculum push -u origin HEAD
# then open a pull request against golbi-ai/rope-ladder-lesson-plans`}</pre>
          <p>
            Only the rendered artifacts travel with the repo. Your journal,
            caches, workspace state, and credentials stay behind.
          </p>
        </section>
      </div>
    </main>
  );
}
