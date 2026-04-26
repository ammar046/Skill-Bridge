/**
 * TanStack Start (SPA prerender on Vercel) writes the app shell as
 * dist/client/_shell.html. Vercel's standard SPA rewrite targets /index.html,
 * so we mirror the shell when present. No-op for Cloudflare-only builds.
 */
import fs from "node:fs";
import path from "node:path";

const clientDir = path.join(process.cwd(), "dist", "client");
const shell = path.join(clientDir, "_shell.html");
const index = path.join(clientDir, "index.html");

if (fs.existsSync(shell)) {
  fs.copyFileSync(shell, index);
}
