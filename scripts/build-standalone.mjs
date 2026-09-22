import { build } from 'vite';
import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds the app with vite.standalone.config.ts (a single JS file + single CSS file, no
// code-splitting) then inlines both directly into one HTML document so it can be opened
// with a plain double-click, no dev server or install step required (Windows file://).
const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.join(root, 'dist-standalone');
const target = path.join(root, '삼각형_예술을_그리다.html');

await build({ configFile: path.join(root, 'vite.standalone.config.ts') });

let html = await readFile(path.join(outDir, 'index.html'), 'utf8');

// Plain indexOf/slice splicing only: String.prototype.replace(needle, replacement) treats
// "$&", "$1", "$$"... in `replacement` as special patterns even when `needle` is a plain
// string, and minified React/Rollup output routinely contains such sequences (e.g. the
// literal string "$$typeof"), which would silently corrupt the inlined bundle.
function replaceOnce(haystack, needle, replacement) {
  const i = haystack.indexOf(needle);
  if (i === -1) throw new Error(`standalone build: could not find expected fragment: ${needle.slice(0, 80)}`);
  return haystack.slice(0, i) + replacement + haystack.slice(i + needle.length);
}
async function readAsset(href) {
  return readFile(path.join(outDir, decodeURIComponent(href).replace(/^\.\//, '')), 'utf8');
}
// A literal "</script" inside the bundled JS (e.g. in a string) would otherwise close the
// HTML <script> tag early, since the HTML tokenizer looks for it before any JS parsing happens.
const escapeForInlineScript = (code) => code.split('</script').join('<\\/script');

html = html.replace(/\s*<link rel="modulepreload"[^>]*>/g, '');

for (const match of [...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
  html = replaceOnce(html, match[0], `<style>${await readAsset(match[1])}</style>`);
}
for (const match of [...html.matchAll(/<script([^>]*)\ssrc="([^"]+)"([^>]*)><\/script>/g)]) {
  const attrs = (match[1] + match[3]).replace(/\s*crossorigin\b/g, '');
  const code = escapeForInlineScript(await readAsset(match[2]));
  html = replaceOnce(html, match[0], `<script${attrs}>${code}</script>`);
}
if (/<script[^>]*\ssrc="\.\/assets\/|<link rel="stylesheet"[^>]*href="\.\/assets\//.test(html)) throw new Error('standalone build: an asset reference was left un-inlined');

await writeFile(target, html, 'utf8');
await rm(outDir, { recursive: true, force: true });
console.log(`Standalone build written to ${target} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
