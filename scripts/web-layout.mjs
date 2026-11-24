// Web layout (runs after `vite build` + build-pages in `npm run build`, web
// only; the Android build keeps the React app at its root):
//   /            the Godot game (exported to public/GodotV1/ by Godot)
//   /classic/    the React app, kept as a backup (not indexed, no link to it)
//   /GodotV1/    forwards to / (old links keep working, ?ref= kept)
// The guide pages, privacy.html, sitemap and art stay where they were.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const GODOT = join(DIST, 'GodotV1');

if (!existsSync(join(GODOT, 'index.html'))) {
  throw new Error('web-layout: dist/GodotV1/index.html missing (Godot export not in public/GodotV1?)');
}

// 1. React app -> /classic/ (asset paths are absolute /assets/..., unchanged).
mkdirSync(join(DIST, 'classic'), { recursive: true });
let react = readFileSync(join(DIST, 'index.html'), 'utf8');
react = react.replace(
  /<meta name="robots" content="[^"]*"\s*\/?>/,
  '<meta name="robots" content="noindex, follow" />',
);
writeFileSync(join(DIST, 'classic', 'index.html'), react);

// 2. Godot -> / (the engine files load relative to the page).
for (const f of readdirSync(GODOT)) {
  if (f === 'index.html') continue;
  renameSync(join(GODOT, f), join(DIST, f));
}
// The game fills the first screen; the text from site/home.ts goes below it.
const section = join(DIST, 'home-section.html');
let home = readFileSync(join(GODOT, 'index.html'), 'utf8');
if (existsSync(section)) {
  home = home.replace('</body>', readFileSync(section, 'utf8') + '</body>');
  rmSync(section);
}
writeFileSync(join(DIST, 'index.html'), home);

// 3. /GodotV1/ -> / (keeps ?ref= and #hash).
rmSync(GODOT, { recursive: true, force: true });
mkdirSync(GODOT);
writeFileSync(
  join(GODOT, 'index.html'),
  `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="robots" content="noindex">
<link rel="canonical" href="https://www.dotduel.com/">
<script>location.replace('/' + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=/">
<title>DotDuel</title></head><body><a href="/">DotDuel</a></body></html>
`,
);

console.log('web-layout: Godot at /, React at /classic/, /GodotV1/ forwards to /');
