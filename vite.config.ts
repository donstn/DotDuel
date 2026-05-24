import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production serves from www.dotduel.com at the root, so base = '/'.
// public/CNAME pins the custom domain at the Pages level. The old
// donstn.github.io/DotDuel/ URL auto-redirects to the custom domain
// once GitHub Pages recognises the CNAME.
export default defineConfig(() => ({
  base: '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
}));
