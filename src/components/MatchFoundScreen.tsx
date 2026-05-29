import { useEffect, useRef, useState } from 'react';
import type { PairingDoc } from '../cloud/matchmaking';

interface Props {
  pairing: PairingDoc;
  myDisplayName: string;
  myRating: number;
  myReady: boolean;
  oppReady: boolean;
  onMarkReady: () => void;
  onStartPlaying: () => void;
  onLeave: () => void;
}

const COUNTDOWN_SECONDS = 5;

export function MatchFoundScreen({
  pairing,
  myDisplayName,
  myRating,
  myReady,
  oppReady,
  onMarkReady,
  onStartPlaying,
  onLeave,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [pressedReady, setPressedReady] = useState(false);
  const startedRef = useRef(false);

  // Optimistic local "I clicked Ready". Used for instant visual feedback
  // (button text/disabled state) and to shortcut the local countdown
  // before the server-confirmed myReady arrives ~1-2s later through the
  // callable → Firestore → onSnapshot round-trip. The real server write
  // still happens via onMarkReady() — this is purely UI ack.
  const effectiveMyReady = myReady || pressedReady;

  const handlePressReady = () => {
    if (effectiveMyReady) return;
    setPressedReady(true);
    onMarkReady();
  };

  // Local countdown — each client runs their own from mount.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  // Start when both players are ready, or when the countdown expires.
  // effectiveMyReady includes the optimistic click so vs-bot (bot pre-ready)
  // starts instantly on your tap instead of after a network round-trip.
  useEffect(() => {
    if (startedRef.current) return;
    console.log('matchFound auto-start check:', { effectiveMyReady, oppReady, secondsLeft });
    if ((effectiveMyReady && oppReady) || secondsLeft <= 0) {
      console.log('matchFound: starting game', {
        reason: effectiveMyReady && oppReady ? 'both-ready' : 'countdown-expired',
      });
      startedRef.current = true;
      onStartPlaying();
    }
  }, [effectiveMyReady, oppReady, secondsLeft, onStartPlaying]);

  return (
    <div className="menu">
      <h2>Opponent found!</h2>
      <div className="match-found-card">
        <div className="match-found-row">
          <div className="match-found-player">
            <strong>{myDisplayName}</strong>
            <span className="match-found-rating">{myRating}</span>
            <span className="match-found-tag">You · Player {pairing.player}</span>
            <span
              className={`match-found-ready${effectiveMyReady ? ' is-ready' : ''}`}
              aria-live="polite"
            >
              {effectiveMyReady ? '✓ Ready' : '— Not ready'}
            </span>
          </div>
          <span className="match-found-vs">vs</span>
          <div className="match-found-player">
            <strong>
              {pairing.opponentDisplayName}
              {pairing.opponentIsBot && (
                <span className="bot-tag" aria-label="AI opponent">BOT</span>
              )}
            </strong>
            <span className="match-found-rating">{pairing.opponentRating}</span>
            <span className="match-found-tag">
              Player {pairing.player === 1 ? 2 : 1}
            </span>
            <span
              className={`match-found-ready${oppReady ? ' is-ready' : ''}`}
              aria-live="polite"
            >
              {oppReady ? '✓ Ready' : '— Not ready'}
            </span>
          </div>
        </div>
        <div className="match-found-countdown" aria-live="polite">
          {effectiveMyReady && oppReady ? (
            <>Both ready — starting…</>
          ) : (
            <>
              Starts in <strong>{Math.max(secondsLeft, 0)}</strong>
            </>
          )}
        </div>
        <p className="settings-hint">
          Shape: <strong>{pairing.shape ?? 'random'}</strong>. Player 1 moves first.
        </p>
      </div>
      <div className="match-found-actions">
        <button
          type="button"
          className="hotseat-start"
          onClick={handlePressReady}
          disabled={effectiveMyReady}
        >
          {effectiveMyReady ? '✓ Ready — waiting on opponent' : "Ready!"}
        </button>
        <button type="button" className="menu-auth-btn" onClick={onLeave}>
          Back to menu
        </button>
      </div>
    </div>
  );
}
