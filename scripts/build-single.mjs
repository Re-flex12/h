// Build a single self-contained HTML file: dist/physeng.html
// Inlines the bundled app JS, the site CSS, and KaTeX (JS + CSS + woff2 fonts as data URIs),
// so the file works offline and can be opened directly from disk or hosted anywhere.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const r = p => fs.readFileSync(path.join(root, p), 'utf8');
const scriptSafe = s => s.replace(/<\/script/gi, '<\\/script');
const styleSafe = s => s.replace(/<\/style/gi, '<\\/style');

const js = (await build({
  entryPoints: [path.join(root, 'assets/js/app.js')],
  bundle: true, format: 'iife', minify: true, write: false, target: ['es2020'], legalComments: 'none',
})).outputFiles[0].text;

// KaTeX CSS with woff2 fonts embedded; other font formats dropped from src lists.
const kdir = path.join(root, 'node_modules/katex/dist');
let kcss = fs.readFileSync(path.join(kdir, 'katex.min.css'), 'utf8');
kcss = kcss.replace(/src:([^;}]+)/g, (_, list) => {
  const m = list.match(/url\((fonts\/[^)]+\.woff2)\)/);
  if (!m) return `src:${list}`;
  const b64 = fs.readFileSync(path.join(kdir, m[1])).toString('base64');
  return `src:url(data:font/woff2;base64,${b64}) format("woff2")`;
});
const kjs = fs.readFileSync(path.join(kdir, 'katex.min.js'), 'utf8');

let html = r('index.html');
const swap = (re, rep, what) => { if (!re.test(html)) throw new Error(`build-single: could not find ${what} in index.html`); html = html.replace(re, () => rep); };
swap(/<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/katex[^>]*>/, `<style>${styleSafe(kcss)}</style>`, 'KaTeX CSS link');
swap(/<script defer src="https:\/\/cdn\.jsdelivr\.net\/npm\/katex[^>]*><\/script>/, `<script>${scriptSafe(kjs)}</script>`, 'KaTeX script');
swap(/<script defer src="assets\/vendor\/supabase\.js"><\/script>/, `<script>${scriptSafe(r('assets/vendor/supabase.js'))}</script>`, 'Supabase script');
swap(/<link rel="stylesheet" href="assets\/css\/main\.css">/, `<style>${styleSafe(r('assets/css/main.css'))}</style>`, 'site CSS link');
swap(/<script type="module" src="assets\/js\/app\.js"><\/script>/, `<script>${scriptSafe(js)}</script>`, 'app script');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist/physeng.html');
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(root, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
