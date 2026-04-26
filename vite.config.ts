// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * On Vercel (VERCEL=1 during build), emit static HTML + SPA shell. The default
 * TanStack Start + Cloudflare build only outputs JS/CSS under dist/client, so
 * a rewrite to /index.html serves nothing (NOT_FOUND). Locally / non-Vercel
 * builds keep the Cloudflare plugin for Wrangler.
 */
const vercelStatic = process.env.VERCEL === "1";

export default defineConfig({
  ...(vercelStatic ? { cloudflare: false } : {}),
  tanstackStart: vercelStatic
    ? {
        spa: {
          enabled: true,
          prerender: {
            enabled: true,
            crawlLinks: true,
          },
        },
      }
    : {},
});
