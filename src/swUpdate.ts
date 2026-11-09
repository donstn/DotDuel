import { registerSW } from 'virtual:pwa-register';

// 'prompt' mode: a new deploy downloads in the background and WAITS instead of
// reloading the page on its own. The 'autoUpdate' mode it replaces reloaded a
// few seconds after the first visit following each deploy — mid ranked game
// too (bugs.md, 2026-11-09). The app applies the update at a safe moment
// (applyUpdateIfReady); otherwise it takes over once all tabs are closed.
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;
let updateReady = false;

export function startServiceWorker(): void {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateReady = true;
    },
  });
}

export function applyUpdateIfReady(): void {
  if (!updateReady || !updateSW) return;
  updateReady = false;
  void updateSW(true);
}
