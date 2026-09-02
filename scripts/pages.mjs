/**
 * Copies the single-file build into ./docs so GitHub Pages can serve it from
 * `main` / `docs`. Adds 404.html (SPA fallback) and .nojekyll.
 */
import { cpSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = "dist-standalone";
const OUT = "docs";

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(SRC, OUT, { recursive: true });
copyFileSync(join(OUT, "index.html"), join(OUT, "404.html"));
writeFileSync(join(OUT, ".nojekyll"), "");

console.log(`[pages] copied ${SRC}/ -> ${OUT}/ (+ 404.html, .nojekyll)`);
