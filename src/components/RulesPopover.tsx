import { useEffect } from 'react';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
}

export function RulesPopover({ onClose }: Props) {
  const t = useT();
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
    <div className="rules-overlay" onClick={onBackdrop} role="dialog" aria-modal="true" aria-label={t.rules.aria}>
      <div className="rules-card">
        <button className="rules-close" onClick={onClose} aria-label={t.rules.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.rules.title}</h2>
          <p className="rules-tagline">{t.rules.tagline}</p>
        </header>

        <div className="rules-body">
          <section>
            <h3>{t.rules.goalH}</h3>
            <p>{t.rules.goalP}</p>
          </section>

          <section>
            <h3>{t.rules.turnH}</h3>
            <p>{t.rules.turnP}</p>
            <ol className="rules-steps">
              <li>{t.rules.turnTapEmpty}</li>
              <li>{t.rules.turnTapClaim}</li>
            </ol>
          </section>

          <section>
            <h3>{t.rules.scoringH}</h3>
            <p>{t.rules.scoringP}</p>
            <ul className="rules-bullets">
              <li>{t.rules.score3}</li>
              <li>{t.rules.score5}</li>
              <li>{t.rules.score8}</li>
              <li>{t.rules.scoreCorner}</li>
            </ul>
          </section>

          <section className="rules-highlight">
            <h3>{t.rules.catchH}</h3>
            <p>{t.rules.catchP}</p>
          </section>

          <section>
            <h3>{t.rules.watchH}</h3>
            <p>{t.rules.watchP}</p>
          </section>

          <section>
            <h3>{t.rules.endH}</h3>
            <p>{t.rules.endP}</p>
          </section>

          <section>
            <h3>{t.rules.tipsH}</h3>
            <ul className="rules-bullets">
              <li>{t.rules.tip1}</li>
              <li>{t.rules.tip2}</li>
              <li>{t.rules.tip3}</li>
              <li>{t.rules.tip4}</li>
            </ul>
          </section>

          <section>
            <h3>{t.rules.modesH}</h3>
            <ul className="rules-bullets">
              <li><strong>{t.rules.modeBotsLead}</strong> {t.rules.modeBots}</li>
              <li><strong>{t.rules.modeHotseatLead}</strong> {t.rules.modeHotseat}</li>
              <li><strong>{t.rules.modeMpLead}</strong> {t.rules.modeMp}</li>
            </ul>
          </section>
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>{t.rules.gotIt}</button>
        </footer>
      </div>
    </div>
  );
}
