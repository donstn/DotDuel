import { useEffect, useState } from 'react';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_COUNT,
  CATEGORY_LABEL,
  type AchievementCategory,
} from './catalog';
import { AchievementBadge } from './AchievementBadge';
import { getFeatured, onAchievementsChange, setFeatured, unlockedIds } from './store';
import { pushFeatured } from './cloudSync';

const CATS = Object.keys(CATEGORY_LABEL) as AchievementCategory[];

export function AchievementsPopover({ onClose }: { onClose: () => void }) {
  const [, bump] = useState(0);
  useEffect(() => onAchievementsChange(() => bump((n) => n + 1)), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const earned = unlockedIds();
  const [sel, setSel] = useState<string | null>(null);
  const selDef = sel ? ACHIEVEMENTS.find((a) => a.id === sel) ?? null : null;
  const selEarned = !!sel && earned.has(sel);
  const featured = getFeatured();
  const pct = Math.round((earned.size / ACHIEVEMENT_COUNT) * 100);

  return (
    <div
      className="rules-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Achievements"
    >
      <div className="rules-card ach-card">
        <button className="rules-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <header className="rules-header ach-head">
          <h2>Achievements</h2>
          <p className="ach-progress-text">
            <strong>{earned.size}</strong> / {ACHIEVEMENT_COUNT} unlocked · {pct}%
          </p>
          <div className="ach-progress" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </div>
        </header>

        <div className={`ach-detail ${selDef ? '' : 'is-empty'} ${selEarned ? 'is-earned' : 'is-locked'}`}>
          {selDef ? (
            <>
              <AchievementBadge icon={selDef.icon} tier={selDef.tier} earned={selEarned} size={52} />
              <div className="ach-detail-body">
                <strong>{selDef.secret && !selEarned ? '???' : selDef.title}</strong>
                <span>
                  {selDef.secret && !selEarned
                    ? 'Hidden — keep playing to reveal this one.'
                    : selDef.desc}
                </span>
                <span className="ach-detail-status">{selEarned ? '✓ Unlocked' : 'Locked'}</span>
              </div>
              {selEarned && (
                <button
                  type="button"
                  className={`ach-pin ${featured === sel ? 'is-on' : ''}`}
                  onClick={() => {
                    const next = featured === sel ? null : sel;
                    setFeatured(next);
                    void pushFeatured(next);
                  }}
                  title="Show this badge next to your name in games"
                >
                  {featured === sel ? '★ Featured' : 'Pin'}
                </button>
              )}
            </>
          ) : (
            <span className="ach-detail-hint">Tap a badge to see what it’s for.</span>
          )}
        </div>

        <div className="ach-scroll">
          {CATS.map((cat) => {
            const items = ACHIEVEMENTS.filter((a) => a.category === cat);
            if (!items.length) return null;
            const got = items.filter((a) => earned.has(a.id)).length;
            return (
              <section key={cat} className="ach-section">
                <h3>
                  {CATEGORY_LABEL[cat]}
                  <span className="ach-section-count">
                    {got}/{items.length}
                  </span>
                </h3>
                <div className="ach-grid">
                  {items.map((a) => {
                    const e = earned.has(a.id);
                    const hidden = a.secret && !e;
                    return (
                      <button
                        key={a.id}
                        className={`ach-cell ${sel === a.id ? 'is-sel' : ''}`}
                        onClick={() => setSel(a.id)}
                        title={`${hidden ? '???' : a.title} — ${hidden ? 'Hidden' : a.desc}`}
                      >
                        <AchievementBadge icon={a.icon} tier={a.tier} earned={e} size={58} />
                        <span className="ach-cell-name">{hidden ? '???' : a.title}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
