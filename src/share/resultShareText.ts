import type { Difficulty, GameMode, Player, ShapeId } from '../types';
import type { Messages } from '../i18n';

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

export function buildResultShare(d: ShareResultData, t: Messages): ResultShare {
  const url = d.refCode
    ? `${APP_URL}?ref=${encodeURIComponent(d.refCode)}`
    : APP_URL;
  const r = t.share.result;
  const shapeLabel = t.shapes[d.shape];
  const cta: Record<ShareOutcome, string> = {
    win: r.ctaWin,
    loss: r.ctaLoss,
    draw: r.ctaDraw,
  };

  if (d.mode === 'daily') {
    const score = d.dailyScore ?? d.scores[1];
    return {
      tag: r.tagDaily,
      headline: r.dailyHeadline,
      a: { name: d.p1Name, score, player: 1 },
      b: null,
      cta: r.dailyCta,
      shareText: r.dailyShareText(score, url),
      url,
      outcome: 'win',
    };
  }

  if (d.mode === 'ai') {
    const level = d.difficulty ? t.difficulty[d.difficulty] : r.genericBot;
    const outcome = outcomeFor(1, d.winner);
    const s1 = d.scores[1];
    const s2 = d.scores[2];
    const headline =
      outcome === 'win'
        ? r.aiHeadlineWin(level)
        : outcome === 'loss'
          ? r.aiHeadlineLoss(level)
          : r.aiHeadlineDraw(level);
    const shareText =
      outcome === 'win'
        ? r.aiShareTextWin(level, s1, s2, shapeLabel, url)
        : outcome === 'loss'
          ? r.aiShareTextLoss(level, s2, s1, url)
          : r.aiShareTextDraw(level, s1, s2, url);
    return {
      tag: r.tagVsBot(shapeLabel),
      headline,
      a: { name: d.p1Name, score: s1, player: 1 },
      b: { name: d.p2Name, score: s2, player: 2 },
      cta: cta[outcome],
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
        ? r.rankedHeadlineWin(elo)
        : outcome === 'loss'
          ? r.rankedHeadlineLoss
          : r.rankedHeadlineDraw;
    const shareText =
      outcome === 'win'
        ? r.rankedShareTextWin(myScore, oppScore, elo, url)
        : outcome === 'loss'
          ? r.rankedShareTextLoss(myScore, oppScore, url)
          : r.rankedShareTextDraw(myScore, oppScore, url);
    return {
      tag: r.tagRanked(shapeLabel),
      headline,
      a: { name: myName, score: myScore, player: me },
      b: { name: oppName, score: oppScore, player: opp },
      cta: cta[outcome],
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
      tag: r.tagHotseat(shapeLabel),
      headline: r.hotseatHeadlineWin(winnerName),
      a: { name: winnerName, score: d.scores[w], player: w },
      b: { name: loserName, score: d.scores[l], player: l },
      cta: cta.win,
      shareText: r.hotseatShareTextWin(winnerName, loserName, d.scores[w], d.scores[l], url),
      url,
      outcome: 'win',
    };
  }
  return {
    tag: r.tagHotseat(shapeLabel),
    headline: r.hotseatHeadlineDraw,
    a: { name: d.p1Name, score: s1, player: 1 },
    b: { name: d.p2Name, score: s2, player: 2 },
    cta: cta.draw,
    shareText: r.hotseatShareTextDraw(d.p1Name, d.p2Name, s1, s2, url),
    url,
    outcome: 'draw',
  };
}
