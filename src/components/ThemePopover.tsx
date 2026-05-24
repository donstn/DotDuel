import { useEffect } from 'react';
import { THEMES, type ThemeId } from '../theme';

interface Props {
  current: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
}

export function ThemePopover({ current, onSelect, onClose }: Props) {
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
      aria-label="Choose a theme"
    >
      <div className="rules-card theme-card">
        <button className="rules-close" onClick={onClose} aria-label="Close themes">
          ✕
        </button>

        <header className="rules-header">
          <h2>Theme</h2>
          <p className="rules-tagline">Pick a palette. Saved to this device.</p>
        </header>

        <div className="theme-grid">
          {THEMES.map((t) => {
            const selected = t.id === current;
            return (
              <button
                key={t.id}
                type="button"
                className={`theme-swatch${selected ? ' theme-swatch-selected' : ''}`}
                onClick={() => onSelect(t.id)}
                aria-pressed={selected}
                title={t.tagline}
              >
                <div
                  className="theme-swatch-preview"
                  style={{ background: t.swatch.bg }}
                  aria-hidden="true"
                >
                  <span
                    className="theme-swatch-dot"
                    style={{ background: t.swatch.p1 }}
                  />
                  <span
                    className="theme-swatch-dot"
                    style={{ background: t.swatch.p2 }}
                  />
                </div>
                <div className="theme-swatch-label">
                  <strong>{t.label}</strong>
                  <span>{t.tagline}</span>
                </div>
                {t.isLight && (
                  <span className="theme-swatch-tag">Sun-friendly</span>
                )}
              </button>
            );
          })}
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
