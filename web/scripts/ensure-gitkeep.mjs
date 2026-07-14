// Restores web/dist/client/.gitkeep after a build.
//
// `react-router build` (Vite) empties dist/client before writing output, which
// deletes the tracked placeholder. This runs as npm `postbuild` to put it back
// so (a) the working tree stays clean after a local build and (b) the embed
// directory is never lost. The content written here MUST stay byte-identical to
// the committed web/dist/client/.gitkeep, or a build will dirty the tree.
import { mkdirSync, writeFileSync } from "node:fs";

const CONTENT =
  "# Keeps web/dist/client/ tracked so a fresh clone can go:embed it. Build output here is gitignored.\n";

mkdirSync("dist/client", { recursive: true });
writeFileSync("dist/client/.gitkeep", CONTENT);
