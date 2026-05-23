import type { PairingDoc } from '../cloud/matchmaking';

interface Props {
  pairing: PairingDoc;
  myDisplayName: string;
  myRating: number;
  onContinue: () => void;
}

export function MatchFoundScreen({
  pairing,
  myDisplayName,
  myRating,
  onContinue,
}: Props) {
  return (
    <div className="menu">
      <h2>Opponent found!</h2>
      <div className="match-found-card">
        <div className="match-found-row">
          <div className="match-found-player">
            <strong>{myDisplayName}</strong>
            <span className="match-found-rating">{myRating}</span>
            <span className="match-found-tag">You · Player {pairing.player}</span>
          </div>
          <span className="match-found-vs">vs</span>
          <div className="match-found-player">
            <strong>{pairing.opponentDisplayName}</strong>
            <span className="match-found-rating">{pairing.opponentRating}</span>
            <span className="match-found-tag">Player {pairing.player === 1 ? 2 : 1}</span>
          </div>
        </div>
        <p className="settings-hint">
          Pairing confirmed. The actual board sync lands in Phase D — for now this
          confirms the matchmaker found you a partner. Match ID: <code>{pairing.matchId}</code>
        </p>
      </div>
      <button type="button" className="hotseat-start" onClick={onContinue}>
        Back to menu
      </button>
    </div>
  );
}
