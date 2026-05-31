import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../firebase';

interface Props {
  onDismiss: () => void;
}

interface Step {
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to DotDuel',
    body: (
      <>
        <p>
          A two-player game played on dots. Take turns colouring them in. Whoever
          scores the most points wins.
        </p>
        <p>
          On each turn, tap an empty dot to colour it your shade of green.
        </p>
      </>
    ),
  },
  {
    title: 'Scoring lines',
    body: (
      <>
        <p>
          When every dot on a horizontal, vertical, or diagonal line is coloured
          (regardless of who coloured them), the line scores its length in points.
        </p>
        <p>
          A 3-dot line is 3 points. An 8-dot line is 8 points. Even a single
          corner dot counts as a 1-point line.
        </p>
      </>
    ),
  },
  {
    title: 'The catch — and how to claim',
    body: (
      <>
        <p>
          If your move closes <em>several</em> lines at once, you only score the
          <strong> longest</strong>. The others become <strong>unclaimed</strong>
          — anyone can grab them later.
        </p>
        <p>
          To claim one: on your turn, tap any coloured dot that's part of a
          finished-but-uncrossed line. We'll highlight likely targets while
          you're learning.
        </p>
      </>
    ),
  },
];

export function TutorialPopover({ onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const outcomeFiredRef = useRef(false);

  useEffect(() => {
    trackEvent('tutorial_step_viewed', { step_index: step + 1 });
  }, [step]);

  const fireOutcome = (result: 'completed' | 'skipped' | 'abandoned') => {
    if (outcomeFiredRef.current) return;
    outcomeFiredRef.current = true;
    trackEvent('tutorial_outcome', { result, last_step_index: step + 1 });
  };

  useEffect(() => {
    return () => {
      // Unmount without an explicit completion path = abandoned (e.g. parent
      // forced a screen change). Skip/complete handlers fire first and set
      // outcomeFiredRef, so this only catches the leftover case.
      fireOutcome('abandoned');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fireOutcome('skipped');
        onDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDismiss, step]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      fireOutcome('skipped');
      onDismiss();
    }
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="DotDuel tutorial"
    >
      <div className="rules-card tutorial-card">
        <button
          className="rules-close"
          onClick={() => {
            fireOutcome('skipped');
            onDismiss();
          }}
          aria-label="Skip tutorial"
        >
          ✕
        </button>

        <header className="rules-header">
          <h2>{current.title}</h2>
          <p className="rules-tagline">
            Step {step + 1} of {STEPS.length}
          </p>
        </header>

        <div className="tutorial-body">{current.body}</div>

        <div className="tutorial-progress" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`tutorial-dot ${i === step ? 'active' : ''}`}
            />
          ))}
        </div>

        <footer className="rules-footer-bar tutorial-footer">
          <button
            className="link-btn"
            onClick={() => {
              fireOutcome('skipped');
              onDismiss();
            }}
          >
            Skip
          </button>
          <div className="tutorial-footer-actions">
            {step > 0 && (
              <button
                className="rules-got-it tutorial-back"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
            )}
            <button
              className="rules-got-it"
              onClick={() => {
                if (isLast) {
                  fireOutcome('completed');
                  onDismiss();
                } else {
                  setStep((s) => s + 1);
                }
              }}
            >
              {isLast ? "Let's play" : 'Next'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
