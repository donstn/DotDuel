// In-app diagnostic log buffer. Anything pushed via diag() is mirrored to
// console.log (with [DD-DIAG] prefix) AND stored in a small ring buffer so
// the DiagOverlay component can render the lines on the phone's screen.
// Activated via ?diag=1 in the URL — the overlay is hidden otherwise.

const MAX_LINES = 250;
const BUFFER: string[] = [];
const listeners = new Set<(lines: string[]) => void>();

function serializeArg(a: unknown): string {
  if (a === undefined) return 'undefined';
  if (a === null) return 'null';
  if (a instanceof Error) return `${a.name}: ${a.message}`;
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a);
    } catch {
      return '<unserializable>';
    }
  }
  return String(a);
}

export function diag(msg: string, ...args: unknown[]): void {
  const stamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.sss
  const tail = args.length ? ' ' + args.map(serializeArg).join(' ') : '';
  const line = `${stamp} ${msg}${tail}`;
  // eslint-disable-next-line no-console
  console.log(`[DD-DIAG] ${line}`);
  BUFFER.push(line);
  if (BUFFER.length > MAX_LINES) BUFFER.shift();
  for (const l of listeners) {
    try {
      l(BUFFER);
    } catch {
      /* listener swallowed */
    }
  }
}

export function subscribeDiag(cb: (lines: string[]) => void): () => void {
  listeners.add(cb);
  cb([...BUFFER]);
  return () => {
    listeners.delete(cb);
  };
}

export function getDiagSnapshot(): string[] {
  return [...BUFFER];
}

export function isDiagMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('diag') === '1';
}
