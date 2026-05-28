import { useEffect, useRef, useState } from 'react';
import { getDiagSnapshot, subscribeDiag } from '../diag';

// On-screen diagnostic log viewer for mobile debugging without USB.
// Activated by visiting the site with ?diag=1 in the URL. Shows a
// fixed-position floating panel with all [DD-DIAG] lines, a copy
// button, and a close button. User can screenshot the panel from
// their phone and share it.
export function DiagOverlay() {
  const [lines, setLines] = useState<string[]>(() => getDiagSnapshot());
  const [collapsed, setCollapsed] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'err'>('idle');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return subscribeDiag((next) => setLines([...next]));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const onCopy = async () => {
    const blob = lines.join('\n');
    try {
      await navigator.clipboard.writeText(blob);
      setCopyState('ok');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('err');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        className="diag-restore"
        onClick={() => setCollapsed(false)}
      >
        DIAG ({lines.length})
      </button>
    );
  }

  return (
    <div className="diag-overlay" role="region" aria-label="Diagnostic log">
      <div className="diag-header">
        <strong>DD-DIAG · {lines.length} lines</strong>
        <span className="diag-actions">
          <button type="button" onClick={onCopy} className="diag-btn">
            {copyState === 'ok' ? 'Copied ✓' : copyState === 'err' ? 'Copy failed' : 'Copy'}
          </button>
          <button type="button" onClick={() => setCollapsed(true)} className="diag-btn">
            Hide
          </button>
        </span>
      </div>
      <div ref={scrollRef} className="diag-body">
        {lines.length === 0 ? (
          <div className="diag-empty">No log lines yet — try an action.</div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="diag-line">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
