// Printed by `npm run build:android-release`: the open items of
// ANDROID_NEXT_RELEASE.md, so they can't be forgotten at build time.
import { readFileSync } from 'node:fs';

const open = readFileSync('ANDROID_NEXT_RELEASE.md', 'utf8')
  .split('\n')
  .filter((l) => l.trimStart().startsWith('- [ ]'));
if (open.length) {
  console.log('\n\x1b[33m=== ANDROID_NEXT_RELEASE.md: open items ===\x1b[0m');
  for (const l of open) console.log('\x1b[33m' + l.trim() + '\x1b[0m');
  console.log('');
}
