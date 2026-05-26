import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export function RulesPopover({ onClose }: Props) {
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
    <div className="rules-overlay" onClick={onBackdrop} role="dialog" aria-modal="true" aria-label="How to play DotDuel">
      <div className="rules-card">
        <button className="rules-close" onClick={onClose} aria-label="Close rules">
          ✕
        </button>

        <header className="rules-header">
          <h2>How to play DotDuel</h2>
          <p className="rules-tagline">Take turns. Complete lines. Get the most points.</p>
        </header>

        <div className="rules-body">
          <section>
            <h3>Goal</h3>
            <p>Score more points than your opponent.</p>
          </section>

          <section>
            <h3>Each turn</h3>
            <p>Do one of these, then the turn passes:</p>
            <ol className="rules-steps">
              <li><strong>Tap an empty dot</strong> to color it.</li>
              <li><strong>Tap a dot on a finished, unclaimed line</strong> to claim its points (no new dot placed).</li>
            </ol>
          </section>

          <section>
            <h3>Scoring</h3>
            <p>
              A <strong>line</strong> is any straight run of dots — horizontal, vertical, or diagonal. When every dot on
              a line is colored, it pays its length in points.
            </p>
            <ul className="rules-bullets">
              <li>3-dot line → 3 pts</li>
              <li>5-dot line → 5 pts</li>
              <li>8-dot line → 8 pts</li>
              <li>A single corner dot counts as a 1-pt "line"</li>
            </ul>
          </section>

          <section className="rules-highlight">
            <h3>The catch — one move, one score</h3>
            <p>
              If your dot finishes <em>several</em> lines at once, you score only the <strong>longest</strong>. The
              other finished lines become <strong>unclaimed</strong> — anyone can grab them on a later turn.
            </p>
          </section>

          <section>
            <h3>Watch the board</h3>
            <p>
              The game <em>won't</em> mark unclaimed lines. Spot a fully colored line that hasn't been crossed off, then
              tap any of its dots to claim it. Free points for paying attention.
            </p>
          </section>

          <section>
            <h3>Game end</h3>
            <p>
              When every dot is colored <strong>and</strong> every finished line has been claimed. Highest score wins;
              equal scores draw.
            </p>
          </section>

          <section>
            <h3>Tips</h3>
            <ul className="rules-bullets">
              <li>Avoid moves that finish two lines — you give the rest away.</li>
              <li>Always take a free corner or big completion.</li>
              <li>A 0-point block can be smarter than a small score.</li>
              <li>Late game: scan for unclaimed lines before placing.</li>
            </ul>
          </section>

          <section>
            <h3>Modes</h3>
            <ul className="rules-bullets">
              <li><strong>Vs AI</strong> — five difficulty levels. Beat Easy on one shape to unlock the next.</li>
              <li><strong>Hot-seat</strong> — two players, one device.</li>
              <li><strong>Multiplayer</strong> — live with global Elo ranking, chess-style time controls, and rematches.</li>
            </ul>
          </section>
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>Got it</button>
        </footer>
      </div>
    </div>
  );
}
