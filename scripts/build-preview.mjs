// Sestaví náhled pro sdílení: jedna stránka s vloženým CSS a JS (+ zasady.html), formulář nic neukládá.
// Použití: npm run build:preview  → výstup v preview/
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

execSync('npx vite build --outDir dist-preview --emptyOutDir', {
  stdio: 'inherit',
  env: { ...process.env, VITE_PREVIEW: '1', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', VITE_PLAUSIBLE_DOMAIN: '' },
});

const inline = (html) =>
  html
    .replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (_, f) =>
      `<style>${readFileSync(`dist-preview/${f}`, 'utf8')}</style>`)
    .replace(/<script type="module" crossorigin src="\/(assets\/[^"]+\.js)"><\/script>/g, (_, f) =>
      `<script type="module">${readFileSync(`dist-preview/${f}`, 'utf8').replace(/<\/script/g, '<\\/script')}</script>`)
    .replace(/<link rel="icon"[^>]*>\s*/g, '')
    .replace(/<link rel="modulepreload"[^>]*>\s*/g, '');

mkdirSync('preview', { recursive: true });
const index = inline(readFileSync('dist-preview/index.html', 'utf8'));
// Hlavní stránku hosting obalí vlastní kostrou, takže bez doctype/html/head/body.
const head = index.match(/<head>([\s\S]*)<\/head>/)[1];
const body = index.match(/<body>([\s\S]*)<\/body>/)[1];
writeFileSync('preview/index.html', head.replace(/<title>[^<]*<\/title>/, "<title>BabiAI</title>").replace(/<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*/g, '') + body);
writeFileSync('preview/zasady.html', inline(readFileSync('dist-preview/zasady.html', 'utf8')));
console.log('preview/ hotovo');
