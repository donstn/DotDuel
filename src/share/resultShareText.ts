import { DIFFICULTY_LABELS, SHAPE_LABEL } from '../types';
import type { Difficulty, GameMode, Player, ShapeId } from '../types';

const APP_URL = 'https://www.dotduel.com/';

export interface ShareResultData {
  mode: GameMode;
  shape: ShapeId;
  difficulty?: Difficulty;
  scores: Record<Player, number>;
  winner: Player | 'draw' | null;
  /** Multiplayer perspective — which seat is the sharer. */
  myPlayer?: Player;
  p1Name: string;
  p2Name: string;
  /** Ranked Elo delta, when finalized. */
  ratingDelta?: number;
  /** Daily-puzzle attempt score. */
  dailyScore?: number;
  /** Signed-in player's referral code → the shared link carries ?ref=<CODE>
   *  (same flow as TellAFriendButton invites). The code is a random 6-char
   *  string, never the account id. Anonymous shares get a clean URL. */
  refCode?: string | null;
}

export type ShareOutcome = 'win' | 'loss' | 'draw';

/** Everything the card renderer + share sheet need, sharer-perspective. */
export interface ResultShare {
  /** Short uppercase context chip for the card, e.g. "VS AI · TRIANGLE". */
  tag: string;
  headline: string;
  /** Sharer-side score first. `b` is null for solo results (daily). */
  a: { name: string; score: number; player: Player };
  b: { name: string; score: number; player: Player } | null;
  cta: string;
  shareText: string;
  url: string;
  outcome: ShareOutcome;
}

function outcomeFor(me: Player, winner: Player | 'draw' | null): ShareOutcome {
  if (winner === 'draw' || winner == null) return 'draw';
  return winner === me ? 'win' : 'loss';
}

const CTA: Record<ShareOutcome, string> = {
  win: 'Can you beat me?',
  loss: 'Think you can do better?',
  draw: 'Break the tie?',
};

export function buildResultShare(d: ShareResultData): ResultShare {
  const url = d.refCode
    ? `${APP_URL}?ref=${encodeURIComponent(d.refCode)}`
    : APP_URL;
  const shapeLabel = SHAPE_LABEL[d.shape];

  if (d.mode === 'daily') {
    const score = d.dailyScore ?? d.scores[1];
    return {
      tag: 'DAILY PUZZLE',
      headline: 'Today’s puzzle',
      a: { name: d.p1Name, score, player: 1 },
      b: null,
      cta: 'Can you beat it?',
      shareText: `I scored ${score} on today’s DotDuel puzzle — can you beat it?\n${url}`,
      url,
      outcome: 'win',
    };
  }

  if (d.mode === 'ai') {
    const level = d.difficulty ? DIFFICULTY_LABELS[d.difficulty] : 'AI';
    const outcome = outcomeFor(1, d.winner);
    const s1 = d.scores[1];
    const s2 = d.scores[2];
    const headline =
      outcome === 'win'
        ? `${level} AI — defeated`
        : outcome === 'loss'
          ? `${level} AI wins this one`
          : `Draw vs ${level} AI`;
    const shareText =
      outcome === 'win'
        ? `I beat the ${level} AI ${s1}–${s2} on the ${shapeLabel} board in DotDuel — can you?\n${url}`
        : outcome === 'loss'
          ? `The ${level} AI got me ${s2}–${s1} in DotDuel. Think you can do better?\n${url}`
          : `I drew the ${level} AI ${s1}–${s2} in DotDuel. Can you finish the job?\n${url}`;
    return {
      tag: `VS AI · ${shapeLabel.toUpperCase()}`,
      headline,
      a: { name: d.p1Name, score: s1, player: 1 },
      b: { name: d.p2Name, score: s2, player: 2 },
      cta: CTA[outcome],
      shareText,
      url,
      outcome,
    };
  }

  if (d.mode === 'multiplayer') {
    const me = d.myPlayer ?? 1;
    const opp: Player = me === 1 ? 2 : 1;
    const outcome = outcomeFor(me, d.winner);
    const myScore = d.scores[me];
    const oppScore = d.scores[opp];
    const myName = me === 1 ? d.p1Name : d.p2Name;
    const oppName = me === 1 ? d.p2Name : d.p1Name;
    const elo =
      outcome === 'win' && d.ratingDelta && d.ratingDelta > 0
        ? ` (+${d.ratingDelta} Elo)`
        : '';
    const headline =
      outcome === 'win'
        ? `Ranked win${elo}`
        : outcome === 'loss'
          ? 'Tough ranked match'
          : 'Ranked draw';
    const shareText =
      outcome === 'win'
        ? `I just won a ranked DotDuel match ${myScore}–${oppScore}${elo} — can you beat me?\n${url}`
        : outcome === 'loss'
          ? `Just played a ranked DotDuel match (${myScore}–${oppScore}). Up for a game?\n${url}`
          : `Dead-even ranked DotDuel match (${myScore}–${oppScore}). Settle it for us?\n${url}`;
    return {
      tag: `RANKED · ${shapeLabel.toUpperCase()}`,
      headline,
      a: { name: myName, score: myScore, player: me },
      b: { name: oppName, score: oppScore, player: opp },
      cta: CTA[outcome],
      shareText,
      url,
      outcome,
    };
  }

  // Hot-seat — shared from the device, so speak from the winner's corner.
  const s1 = d.scores[1];
  const s2 = d.scores[2];
  if (d.winner === 1 || d.winner === 2) {
    const w = d.winner;
    const l: Player = w === 1 ? 2 : 1;
    const winnerName = w === 1 ? d.p1Name : d.p2Name;
    const loserName = w === 1 ? d.p2Name : d.p1Name;
    return {
      tag: `HOT-SEAT · ${shapeLabel.toUpperCase()}`,
      headline: `${winnerName} wins`,
      a: { name: winnerName, score: d.scores[w], player: w },
      b: { name: loserName, score: d.scores[l], player: l },
      cta: CTA.win,
      shareText: `${winnerName} beat ${loserName} ${d.scores[w]}–${d.scores[l]} in DotDuel. Think you can do better?\n${url}`,
      url,
      outcome: 'win',
    };
  }
  return {
    tag: `HOT-SEAT · ${shapeLabel.toUpperCase()}`,
    headline: 'Dead even',
    a: { name: d.p1Name, score: s1, player: 1 },
    b: { name: d.p2Name, score: s2, player: 2 },
    cta: CTA.draw,
    shareText: `${d.p1Name} and ${d.p2Name} drew ${s1}–${s2} in DotDuel. Settle it for us?\n${url}`,
    url,
    outcome: 'draw',
  };
}
