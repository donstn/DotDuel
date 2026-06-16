import { useEffect, useState } from 'react';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
  ACHIEVEMENT_COUNT,
  ACHIEVEMENT_TRACKS,
} from './catalog';
import { AchievementBadge } from './AchievementBadge';
import { getFeatured, onAchievementsChange, setFeatured, unlockedIds } from './store';
import { pushFeatured } from './cloudSync';
import { useT } from '../i18n';
import { achTitle, achDesc, trackLabel } from './localize';

export function AchievementsPopover({ onClose }: { onClose: () => void }) {
  const t = useT();
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
      aria-label={t.achievements.aria}
    >
      <div className="rules-card ach-card">
        <button className="rules-close" onClick={onClose} aria-label={t.achievements.close}>
          ✕
        </button>
        <header className="rules-header ach-head">
          <h2>{t.achievements.title}</h2>
          <p className="ach-progress-text">
            <strong>{earned.size}</strong> / {ACHIEVEMENT_COUNT} {t.achievements.unlocked} · {pct}%
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
                <strong>{selDef.secret && !selEarned ? t.achievements.secret : achTitle(selDef.id, t)}</strong>
                <span>
                  {selDef.secret && !selEarned
                    ? t.achievements.hiddenReveal
                    : achDesc(selDef.id, t)}
                </span>
                <span className="ach-detail-status">
                  {selEarned ? t.achievements.statusUnlocked : t.achievements.statusLocked}
                </span>
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
                  title={t.achievements.pinTitle}
                >
                  {featured === sel ? t.achievements.featured : t.achievements.pin}
                </button>
              )}
            </>
          ) : (
            <span className="ach-detail-hint">{t.achievements.detailHint}</span>
          )}
        </div>

        <div className="ach-scroll ach-tracks">
          {ACHIEVEMENT_TRACKS.map((track) => {
            const items = track.ids.map((id) => ACHIEVEMENT_BY_ID[id]).filter(Boolean);
            if (!items.length) return null;
            const got = items.filter((a) => earned.has(a.id)).length;
            const last = items.length - 1;
            return (
              <section key={track.label} className="ach-track">
                <div className="ach-track-head">
                  <span className="ach-track-label">{trackLabel(track.label, t)}</span>
                  <span className="ach-track-count">
                    {got}/{items.length}
                  </span>
                </div>
                <div className="ach-track-line">
                  {items.map((a, i) => {
                    const e = earned.has(a.id);
                    const hidden = a.secret && !e;
                    const capstone = i === last;
                    return (
                      <button
                        key={a.id}
                        className={`ach-node ${e ? 'is-earned' : ''} ${capstone ? 'is-capstone' : ''} ${sel === a.id ? 'is-sel' : ''}`}
                        onClick={() => setSel(a.id)}
                        aria-label={hidden ? t.achievements.hiddenAria : achTitle(a.id, t)}
                        title={t.achievements.nodeTitle(
                          hidden ? t.achievements.secret : achTitle(a.id, t),
                          hidden ? t.achievements.hidden : achDesc(a.id, t),
                        )}
                      >
                        <AchievementBadge icon={a.icon} tier={a.tier} earned={e} size={50} />
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
