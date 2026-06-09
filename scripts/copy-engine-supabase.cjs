// Copies the pure engine (types/geometry/game/ai) into the Edge Functions
// shared dir so Supabase Edge Functions run the EXACT same move logic as the
// client. Deno requires explicit extensions on relative imports, so we rewrite
// `from './x'` -> `from './x.ts'`. Run before deploying engine-dependent
// functions (submit-move, bot-move). The generated dir is gitignored.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const DEST = path.join(
  __dirname,
  '..',
  'supabase',
  'functions',
  '_shared',
  'engine',
);
const FILES = ['types.ts', 'geometry.ts', 'game.ts', 'ai.ts'];

fs.mkdirSync(DEST, { recursive: true });

// Add .ts to extensionless relative imports/exports (Deno requirement).
function addTsExtensions(code) {
  return code.replace(
    /(\bfrom\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, pre, spec, post) =>
      /\.[a-z]+$/i.test(spec) ? match : `${pre}${spec}.ts${post}`,
  );
}

for (const file of FILES) {
  const code = fs.readFileSync(path.join(SRC, file), 'utf8');
  fs.writeFileSync(path.join(DEST, file), addTsExtensions(code), 'utf8');
}

console.log(
  `copy-engine-supabase: ${FILES.length} files -> supabase/functions/_shared/engine/`,
);
