import { useEffect } from 'react';
import { THEMES, type ThemeId } from '../theme';
import { useT } from '../i18n';

interface Props {
  current: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
}

export function ThemePopover({ current, onSelect, onClose }: Props) {
  const tr = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={tr.theme.aria}
    >
      <div className="rules-card theme-card">
        <button className="rules-close" onClick={onClose} aria-label={tr.theme.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{tr.theme.title}</h2>
          <p className="rules-tagline">{tr.theme.tagline}</p>
        </header>

        <div className="theme-grid">
          {THEMES.map((th) => {
            const selected = th.id === current;
            const tagline = tr.theme.taglines[th.id] ?? th.tagline;
            return (
              <button
                key={th.id}
                type="button"
                className={`theme-swatch${selected ? ' theme-swatch-selected' : ''}`}
                onClick={() => onSelect(th.id)}
                aria-pressed={selected}
                title={tagline}
              >
                <div
                  className="theme-swatch-preview"
                  style={{ background: th.swatch.bg }}
                  aria-hidden="true"
                >
                  <span
                    className="theme-swatch-dot"
                    style={{ background: th.swatch.p1 }}
                  />
                  <span
                    className="theme-swatch-dot"
                    style={{ background: th.swatch.p2 }}
                  />
                </div>
                <div className="theme-swatch-label">
                  <strong>{th.label}</strong>
                  <span>{tagline}</span>
                </div>
                {th.isLight && (
                  <span className="theme-swatch-tag">{tr.theme.sunFriendly}</span>
                )}
              </button>
            );
          })}
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            {tr.theme.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
