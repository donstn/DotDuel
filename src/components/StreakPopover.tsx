import { useEffect } from 'react';
import { useT } from '../i18n';

interface Props {
  days: number;
  /** Shown in the app once reminders apply (3+ days, reminders on). */
  reminderTime: string | null;
  onClose: () => void;
}

// After the day's first finished online game or daily puzzle, from day 2.
export function StreakPopover({ days, reminderTime, onClose }: Props) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="rules-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t.streak.popupTitle(days)}
    >
      <div className="rules-card streak-card">
        <div className="streak-flame" aria-hidden="true">🔥</div>
        <h2 className="streak-title">{t.streak.popupTitle(days)}</h2>
        <p className="streak-body">{t.streak.popupBody(days)}</p>
        {reminderTime && <p className="settings-hint streak-body">{t.streak.popupReminder(reminderTime)}</p>}
        <div className="game-over-buttons streak-ok">
          <button type="button" className="primary" onClick={onClose}>
            {t.streak.popupOk}
          </button>
        </div>
      </div>
    </div>
  );
}
