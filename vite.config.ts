import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Production serves from www.dotduel.com at the root, so base = '/'.
// public/CNAME pins the custom domain at the Pages level. The old
// donstn.github.io/DotDuel/ URL auto-redirects to the custom domain
// once GitHub Pages recognises the CNAME.
export default defineConfig(() => ({
  base: '/',
  // Explicit JS floor. Vite's implicit default ('modules' ≈ Chrome 87) is left
  // as-is here but made reviewable: this is the oldest WebView the bundle is
  // guaranteed to parse. Capacitor minSdk is 24 (Android 7), but devices with an
  // updated System WebView run current Chromium regardless of OS version, so
  // chrome87 covers the active fleet. To reach stock/un-updated old WebViews
  // (< Chrome 87) you'd add @vitejs/plugin-legacy (deferred — needs polyfills,
  // not just a lower syntax target).
  build: { target: 'chrome87' },
  plugins: [
    react(),
    // Auto-updating service worker so home-screen / installed instances pick up
    // new deploys on their own (at most one launch behind) instead of getting
    // stuck on a cached index.html — the GitHub-Pages caching problem.
    VitePWA({
      registerType: 'autoUpdate',
      // Don't auto-inject the register script — we register manually in main.tsx
      // so we can register on web only and SKIP it in the native Capacitor app
      // (where a SW just serves stale cached assets over the APK's bundled ones).
      injectRegister: null,
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
