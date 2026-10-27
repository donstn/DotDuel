import { useEffect, useState } from 'react';
import { LANGS, useLang, useT } from '../i18n';
import { guideLinkProps } from '../guideLinks';

// The skip appears after a short read; the lesson button works at once.
const SKIP_DELAY_MS = 3000;

interface Props {
  onPlay: () => void;
  onSkip: () => void;
}

/** First-visit title card: what the game is, the three rules, then the
 *  lesson or a skip (which fades in after SKIP_DELAY_MS). Shown once,
 *  before the first game. */
export function WelcomeCard({ onPlay, onSkip }: Props) {
  const t = useT();
  const { lang, setLang } = useLang();
  const [skipReady, setSkipReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSkipReady(true), SKIP_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div
      className="confirm-overlay welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="confirm-card welcome-card">
        {/* The footer's language picker sits under this overlay, so a
            first-time visitor needs one here. */}
        <div className="welcome-langs" role="group" aria-label={t.lang.label}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              title={l.label}
              aria-label={l.label}
              aria-pressed={l.code === lang}
              className={`welcome-lang${l.code === lang ? ' is-on' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.code.toUpperCase()}
            </button>
          ))}
        </div>
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
        <button
          type="button"
          className={`link-btn welcome-skip${skipReady ? ' is-ready' : ''}`}
          onClick={onSkip}
          disabled={!skipReady}
          aria-hidden={!skipReady}
        >
          {t.coach.welcomeSkip}
        </button>
        <a className="welcome-guide" {...guideLinkProps(lang, 'guide')}>
          {t.rules.moreGuide}
        </a>
      </div>
    </div>
  );
}
