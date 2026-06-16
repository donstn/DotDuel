import { useEffect, useRef } from 'react';
import { ACHIEVEMENT_BY_ID } from './catalog';
import { AchievementBadge } from './AchievementBadge';
import { useT } from '../i18n';
import { achTitle } from './localize';

/**
 * One-at-a-time "Achievement unlocked" toast. Shows queue[0] for ~3.8s, then
 * calls onDismiss to advance. Tap to dismiss early. Mounted once in App.
 */
export function AchievementToast({
  queue,
  onDismiss,
}: {
  queue: string[];
  onDismiss: () => void;
}) {
  const t = useT();
  const id = queue[0];
  // Keep the latest onDismiss in a ref so the auto-dismiss timer resets only
  // when the visible toast (id) changes — not on every parent re-render (which
  // happens constantly during a game and would keep pushing the timer back).
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    if (!id) return;
    const t = window.setTimeout(() => dismissRef.current(), 3800);
    return () => window.clearTimeout(t);
  }, [id]);

  const def = id ? ACHIEVEMENT_BY_ID[id] : null;
  if (!def) return null;
  return (
    <div className="ach-toast" role="status" aria-live="polite" onClick={onDismiss}>
      <AchievementBadge icon={def.icon} tier={def.tier} earned size={46} />
      <div className="ach-toast-body">
        <span className="ach-toast-kicker">{t.achievements.toastKicker}</span>
        <strong>{achTitle(def.id, t)}</strong>
      </div>
    </div>
  );
}
