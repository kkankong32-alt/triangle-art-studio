import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Same app as vite.config.ts, but without manual chunking so Rollup emits exactly one JS
// file and one CSS file (no cross-file imports), which scripts/build-standalone.mjs then
// inlines into a single double-clickable HTML file for offline/file:// use.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
  },
});
