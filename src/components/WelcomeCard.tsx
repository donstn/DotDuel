import { useLang, useT } from '../i18n';
import { guideLinkProps } from '../guideLinks';

interface Props {
  onPlay: () => void;
  onSkip: () => void;
}

/** First-visit title card: what the game is, the three rules, then the
 *  lesson or a skip. Shown once, before the first game. */
export function WelcomeCard({ onPlay, onSkip }: Props) {
  const t = useT();
  const { lang } = useLang();
  return (
    <div
      className="confirm-overlay welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="confirm-card welcome-card">
        <h3 id="welcome-title">{t.coach.welcomeTitle}</h3>
        <p className="welcome-intro">{t.coach.welcomeIntro}</p>
        <ol className="welcome-steps">
          {t.coach.welcomeSteps.map((s, i) => (
            <li key={s.title} className="welcome-step">
              <span className="welcome-step-dot" aria-hidden="true">{i + 1}</span>
              <span>
                <strong>{s.title}</strong> {s.body}
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className="hotseat-start" onClick={onPlay}>
          {t.coach.welcomePlay}
        </button>
        <span className="welcome-time">{t.coach.welcomeTime}</span>
        <button type="button" className="link-btn welcome-skip" onClick={onSkip}>
          {t.coach.welcomeSkip}
        </button>
        <a className="welcome-guide" {...guideLinkProps(lang, 'guide')}>
          {t.rules.moreGuide}
        </a>
      </div>
    </div>
  );
}
