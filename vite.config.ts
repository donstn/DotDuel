import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// While we're still on the github.io subpath the base must be
// '/DotDuel/' or asset URLs 404. Flip to '/' (and re-add
// public/CNAME) the moment Namecheap DNS + Firebase auth domains
// + GitHub Pages custom-domain settings are all live for
// www.dotduel.com — see docs/multiplayer-roadmap.md §17.7.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/DotDuel/' : '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
