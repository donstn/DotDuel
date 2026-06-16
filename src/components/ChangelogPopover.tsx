import { useEffect } from 'react';
import { CHANGELOG, type ChangeKind } from '../changelog';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
}

const KIND_ORDER: ChangeKind[] = ['added', 'changed', 'fixed'];

export function ChangelogPopover({ onClose }: Props) {
  const t = useT();
  const KIND_LABEL: Record<ChangeKind, string> = {
    added: t.changelog.added,
    changed: t.changelog.changed,
    fixed: t.changelog.fixed,
  };
  const formatDate = (iso: string): string => {
    // YYYY-MM-DD -> e.g. "24 May 2026", localised month abbreviations.
    const [y, m, d] = iso.split('-');
    const monthIdx = parseInt(m, 10) - 1;
    const month = t.changelog.months[monthIdx];
    if (Number.isNaN(monthIdx) || !month) return iso;
    return `${parseInt(d, 10)} ${month} ${y}`;
  };
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
      aria-label={t.changelog.aria}
    >
      <div className="rules-card changelog-card">
        <button className="rules-close" onClick={onClose} aria-label={t.changelog.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.changelog.title}</h2>
          <p className="rules-tagline">{t.changelog.tagline}</p>
        </header>

        <div className="rules-body changelog-body">
          {CHANGELOG.length === 0 && (
            <p className="rankings-empty">{t.changelog.empty}</p>
          )}

          {CHANGELOG.map((entry) => {
            const grouped = KIND_ORDER.map((kind) => ({
              kind,
              items: entry.changes.filter((c) => c.kind === kind),
            })).filter((g) => g.items.length > 0);

            return (
              <section key={entry.version} className="changelog-entry">
                <header className="changelog-entry-header">
                  <h3>{entry.version}</h3>
                  <span className="changelog-date">{formatDate(entry.date)}</span>
                </header>
                {entry.highlight && (
                  <p className="changelog-highlight">{entry.highlight}</p>
                )}
                {grouped.length === 0 && (
                  <p className="changelog-empty">{t.changelog.entryEmpty}</p>
                )}
                {grouped.map(({ kind, items }) => (
                  <div key={kind} className={`changelog-group changelog-group-${kind}`}>
                    <h4>{KIND_LABEL[kind]}</h4>
                    <ul>
                      {items.map((c, i) => (
                        <li key={i}>{c.text}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            );
          })}
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            {t.changelog.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
