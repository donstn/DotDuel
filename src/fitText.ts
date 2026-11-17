/**
 * Button labels shrink to fit instead of ellipsizing. Painted pill buttons
 * lose a lot of width to their end caps, and Lithuanian labels run long, so
 * on a narrow phone "Pasiduoti" became "Pasidu…". Any button, .fit-text or
 * popover title banner (centred between the ✕ gutters, so narrower)
 * whose label overflows gets a smaller inline font-size, down to MIN_SCALE;
 * past that the CSS ellipsis still applies. Opt out with data-no-fit.
 */
// Painted menu buttons clip their title on its own line (the button itself
// never overflows), so the title is fitted directly.
const SELECTOR =
  'button, [role="button"], .fit-text, .rules-header h2, .menu-shelf-body strong';
const MIN_SCALE = 0.65;

function reset(el: HTMLElement): void {
  if (el.dataset.fit) {
    el.style.fontSize = '';
    delete el.dataset.fit;
  }
}

function fit(el: HTMLElement): void {
  if (el.closest('[data-no-fit], svg')) return;
  // Enlarged text (accessibility) wraps instead of shrinking back down.
  if (document.documentElement.hasAttribute('data-text-large')) return;
  if (el.scrollWidth <= el.clientWidth + 1) return;
  const cs = getComputedStyle(el);
  const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const avail = el.clientWidth - pad;
  const need = el.scrollWidth - pad;
  if (avail <= 0 || need <= 0) return;
  const base = parseFloat(cs.fontSize);
  const scale = Math.max(MIN_SCALE, (avail / need) * 0.97);
  el.style.fontSize = `${(base * scale).toFixed(2)}px`;
  el.dataset.fit = '1';
}

let queued = false;
function fitAll(): void {
  queued = false;
  // Reset every shrunk label BEFORE measuring any: buttons sharing a
  // flex row take each other's space, so fitting one by one from a
  // half-shrunk row gave different sizes on every rescan (the share
  // dialog's pills jumped on each tap).
  const els = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  els.forEach(reset);
  els.forEach(fit);
}
function schedule(): void {
  if (queued) return;
  queued = true;
  requestAnimationFrame(fitAll);
}

export function startFitText(): void {
  // Board moves only touch the SVG; skip those so a move doesn't rescan.
  new MutationObserver((records) => {
    if (records.some((r) => !(r.target instanceof SVGElement))) schedule();
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  // Theme art and language switches change cap widths and label lengths.
  new MutationObserver(schedule).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-art', 'data-theme', 'lang', 'data-text-large'],
  });
  window.addEventListener('resize', schedule);
  void document.fonts?.ready.then(schedule);
  schedule();
}
