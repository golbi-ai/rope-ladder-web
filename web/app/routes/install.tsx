import styles from "./site.module.css";

export function meta(){return [{title:"Install rope-ladder"}]}

export default function Install(){return <main className={`wrap ${styles.page}`}>
  <p className={styles.eyebrow}>Install</p>
  <h1>Bring a guide into the next unfamiliar repository.</h1>
  <p>Native, signed desktop releases support macOS, Linux, and Windows on amd64 and arm64. The installer selects the right archive, verifies its SHA-256, and installs one binary that contains both the CLI and MCP server.</p>
  <h2>macOS, Linux, and WSL</h2>
  <pre className={styles.code}>curl -fsSL https://rpldr.golbi.ai/install.sh | sh</pre>
  <h2>Windows PowerShell</h2>
  <pre className={styles.code}>irm https://rpldr.golbi.ai/install.ps1 | iex</pre>
  <h2>Connect your agent</h2>
  <pre className={styles.code}>rope-ladder mcp install</pre>
  <p>This explicitly registers the bundled stdio server with detected Claude Code, Codex, and Kiro clients. It writes only user-level client configuration and prints a portable JSON snippet for any other MCP host.</p>
  <h2>Debian and Ubuntu</h2>
  <pre className={styles.code}>{`curl -fsSL https://rpldr.golbi.ai/apt/KEY.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/rope-ladder.gpg
echo "deb [signed-by=/etc/apt/keyrings/rope-ladder.gpg] https://rpldr.golbi.ai/apt ./" | sudo tee /etc/apt/sources.list.d/rope-ladder.list
sudo apt update && sudo apt install rope-ladder`}</pre>
  <p>The APT repository is signed. Update an APT-managed installation through your normal <code>apt upgrade</code> flow; direct installs can run <code>rope-ladder upgrade</code>.</p>
  <h2>Build from source</h2>
  <pre className={styles.code}>go install github.com/golbi-ai/rope-ladder/cmd/rope-ladder@latest</pre>
  <h2>Create a separate curriculum</h2>
  <pre className={styles.code}>rope-ladder init --source /path/to/codebase /path/to/curriculum{`\n`}rope-ladder lesson-plan --allow-source-transfer /path/to/curriculum</pre>
  <p>The curriculum directory is a separate local Git repository. Generated files are shareable; teaching-assistant reflections remain in private local state.</p>
  <h2>Share a reviewed candidate</h2>
  <pre className={styles.code}>rope-ladder publish --metadata ./metadata.yaml --slug your-codebase --confirm-public /path/to/curriculum</pre>
  <p>Publishing uses your existing GitHub CLI login to open a pull request from your fork. It requires a public-source attestation and never uploads private progress or local workspace state.</p>
</main>}
