import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Production serves from www.dotduel.com at the root, so base = '/'.
// public/CNAME pins the custom domain at the Pages level. The old
// donstn.github.io/DotDuel/ URL auto-redirects to the custom domain
// once GitHub Pages recognises the CNAME.
export default defineConfig(() => ({
  base: '/',
  plugins: [
    react(),
    // Auto-updating service worker so home-screen / installed instances pick up
    // new deploys on their own (at most one launch behind) instead of getting
    // stuck on a cached index.html — the GitHub-Pages caching problem.
    VitePWA({
      registerType: 'autoUpdate',
      // External register script (not inline) so CSP `script-src 'self'` allows it.
      injectRegister: 'script',
      // Keep the hand-authored public/site.webmanifest; the plugin only manages
      // the service worker here.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,json,txt}'],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      // No SW in `npm run dev` — only in the production build.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
}));
