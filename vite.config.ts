import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// This project lives on a cloud-synced virtual drive (Google Drive). Native OS file-watch
// handles are unreliable there: chokidar can crash the whole dev server on an EINVAL from
// lstat if a build script creates/removes dist/dist-standalone while it is watching, and
// Node's native fs.watch() has been observed to throw an unrelated "UNKNOWN: unknown error,
// watch" on its own (likely from the drive's background sync touching a watched file).
// usePolling avoids native watch handles entirely; ignored keeps build output out of the way.
export default defineConfig({ plugins: [react()], base: './', server: { watch: { usePolling: true, interval: 400, ignored: ['**/dist/**', '**/dist-standalone/**', '**/삼각형_예술을_그리다.html'] } }, build: { rollupOptions: { output: { manualChunks: { canvas: ['konva','react-konva'] } } } } });
