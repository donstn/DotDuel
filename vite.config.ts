import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production serves from the custom domain www.dotduel.com at root, so
// base must be '/'. Dev also serves at '/'. The legacy
// donstn.github.io/DotDuel/ subpath redirects to the custom domain
// automatically once GitHub Pages picks up public/CNAME.
export default defineConfig(() => ({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
