// Copies the pure-logic engine files from src/ into functions/src/engine/
// so Cloud Functions can validate moves with the exact same code the
// client runs. Runs as a prebuild step; the engine/ directory is
// regenerated on every functions build and is gitignored.

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'src');
const DEST = path.join(__dirname, '..', 'src', 'engine');
const FILES = ['types.ts', 'geometry.ts', 'game.ts', 'ai.ts'];

fs.mkdirSync(DEST, { recursive: true });

for (const file of FILES) {
  const from = path.join(SRC, file);
  const to = path.join(DEST, file);
  fs.copyFileSync(from, to);
}

console.log(`copy-engine: ${FILES.length} files copied to functions/src/engine/`);
