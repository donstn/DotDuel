/**
 * Keyboard focus for every modal window (WCAG 2.4.3), in one place instead of
 * ~25 components: any element with role="dialog" + aria-modal="true" that
 * appears gets focus moved into it, Tab / Shift+Tab stay inside the topmost
 * one, it is named by its first heading when it has no label, and when it
 * closes focus goes back to whatever opened it.
 */
const MODAL = '[role="dialog"][aria-modal="true"]';
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const openers = new Map<Element, HTMLElement | null>();

function openModals(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(MODAL)].filter(
    (el) => el.getClientRects().length > 0,
  );
}

function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0,
  );
}

let labelSeq = 0;
function ensureLabel(dialog: HTMLElement): void {
  if (dialog.hasAttribute('aria-label') || dialog.hasAttribute('aria-labelledby')) return;
  const heading = dialog.querySelector<HTMLElement>('h1, h2, h3');
  if (!heading) return;
  if (!heading.id) heading.id = `dialog-title-${++labelSeq}`;
  dialog.setAttribute('aria-labelledby', heading.id);
}

function sync(): void {
  const open = openModals();
  for (const dialog of open) {
    if (openers.has(dialog)) continue;
    const active = document.activeElement as HTMLElement | null;
    openers.set(dialog, active && active !== document.body ? active : null);
    ensureLabel(dialog);
    // A dialog that focused its own field (name pickers) keeps it.
    if (!active || !dialog.contains(active)) {
      if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
      dialog.focus({ preventScroll: true });
    }
  }
  for (const [dialog, opener] of openers) {
    if (open.includes(dialog as HTMLElement)) continue;
    openers.delete(dialog);
    // Only hand focus back if nothing else took it (it fell to <body>).
    const active = document.activeElement;
    if (opener?.isConnected && (!active || active === document.body)) {
      opener.focus({ preventScroll: true });
    }
  }
}

function trapTab(e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const open = openModals();
  const top = open[open.length - 1];
  if (!top) return;
  const items = focusables(top);
  if (items.length === 0) {
    e.preventDefault();
    top.focus({ preventScroll: true });
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const inside = !!active && top.contains(active);
  if (e.shiftKey && (!inside || active === first || active === top)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (!inside || active === last)) {
    e.preventDefault();
    first.focus();
  }
}

let queued = false;
function schedule(): void {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    sync();
  });
}

export function startDialogFocus(): void {
  new MutationObserver((records) => {
    if (records.some((r) => !(r.target instanceof SVGElement))) schedule();
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('keydown', trapTab);
  schedule();
}
