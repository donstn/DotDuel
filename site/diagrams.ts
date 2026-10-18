// Small hand-placed Triangle diagrams for the guide pages: a 4-row triangle
// (4 → 1 dots, same geometry as the real board), dots coloured per player,
// strike lines for scored lines and a dashed ring for pending ones.

type Owner = 1 | 2;

interface DiagramSpec {
  colored: Record<number, Owner>;
  /** Dot just placed — gets the last-move ring. */
  last?: number;
  /** Scored lines: dot ids end to end, and who scored. */
  strikes?: { dots: number[]; player: Owner }[];
  /** Pending (unclaimed) lines: dot ids end to end. */
  pending?: number[][];
  /** "+N" label near a dot. */
  label?: { dot: number; text: string };
  caption: string;
}

const ROWS = 4;
const H = Math.sqrt(3) / 2;
const dots: { id: number; x: number; y: number }[] = [];
for (let r = 0, id = 0; r < ROWS; r++) {
  for (let c = 0; c < ROWS - r; c++, id++) dots.push({ id, x: c + r * 0.5, y: r * H });
}

const COLOR = {
  1: { fill: '#0d4a23', rim: '#7bdb95', strike: '#7bdb95' },
  2: { fill: '#d3ecaa', rim: '#f4ffe4', strike: '#f4ffe4' },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function diagram(spec: DiagramSpec): string {
  const r = 0.2;
  const pad = 0.55;
  const vb = `${-pad} ${-pad} ${ROWS - 1 + pad * 2} ${(ROWS - 1) * H + pad * 2}`;
  const at = (id: number) => dots[id];
  const seg = (ids: number[]) => {
    const a = at(ids[0]);
    const b = at(ids[ids.length - 1]);
    // Corner (1-dot) lines get a short horizontal stroke, like the game.
    if (ids.length === 1) return { x1: a.x - 0.32, y1: a.y, x2: a.x + 0.32, y2: a.y };
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const o = 0.28 / len;
    return { x1: a.x - dx * o, y1: a.y - dy * o, x2: b.x + dx * o, y2: b.y + dy * o };
  };
  const parts: string[] = [];
  for (const p of spec.pending ?? []) {
    const s = seg(p);
    parts.push(
      `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="#f2d06b" stroke-width="0.07" stroke-dasharray="0.14 0.1" stroke-linecap="round"/>`,
    );
  }
  for (const st of spec.strikes ?? []) {
    const s = seg(st.dots);
    parts.push(
      `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${COLOR[st.player].strike}" stroke-width="0.11" stroke-linecap="round" opacity="0.95"/>`,
    );
  }
  for (const d of dots) {
    const o = spec.colored[d.id];
    if (o) {
      parts.push(
        `<circle cx="${d.x}" cy="${d.y}" r="${r}" fill="${COLOR[o].fill}" stroke="${COLOR[o].rim}" stroke-width="0.04"/>`,
      );
    } else {
      parts.push(
        `<circle cx="${d.x}" cy="${d.y}" r="${r * 0.8}" fill="#16271d" stroke="#3d5a47" stroke-width="0.04"/>`,
      );
    }
    if (spec.last === d.id) {
      parts.push(
        `<circle cx="${d.x}" cy="${d.y}" r="${r * 1.35}" fill="none" stroke="#9fd8ff" stroke-width="0.035"/>`,
      );
    }
  }
  if (spec.label) {
    const d = at(spec.label.dot);
    parts.push(
      `<text x="${d.x + 0.3}" y="${d.y - 0.28}" font-size="0.32" font-weight="700" fill="#f2d06b">${esc(spec.label.text)}</text>`,
    );
  }
  return `<figure class="diagram"><svg viewBox="${vb}" role="img" aria-label="${esc(spec.caption)}">${parts.join('')}</svg><figcaption>${esc(spec.caption)}</figcaption></figure>`;
}

// Dot ids on the 4-row triangle:
//   row 0:  0  1  2  3
//   row 1:   4  5  6
//   row 2:    7  8
//   row 3:     9
// Lines: rows 0-1-2-3, 4-5-6, 7-8, 9; "/" diagonals 0, 1-4, 2-5-7, 3-6-8-9;
// "\" diagonals 0-4-7-9, 1-5-8, 2-6, 3. Corners 0, 3 and 9 are 1-dot lines, so
// filler dots avoid them (a coloured corner would need its own strike).
export const diagrams = {
  lineComplete: (caption: string) =>
    diagram({
      colored: { 4: 2, 5: 1, 6: 1, 8: 2 },
      last: 6,
      strikes: [{ dots: [4, 5, 6], player: 1 }],
      label: { dot: 6, text: '+3' },
      caption,
    }),
  corner: (caption: string) =>
    diagram({
      colored: { 9: 1, 5: 2, 1: 1 },
      last: 9,
      strikes: [{ dots: [9], player: 1 }],
      label: { dot: 9, text: '+1' },
      caption,
    }),
  twoAtOnce: (caption: string) =>
    diagram({
      colored: { 4: 1, 5: 2, 2: 2, 6: 1, 8: 1 },
      last: 6,
      strikes: [{ dots: [4, 5, 6], player: 1 }],
      pending: [[2, 6]],
      label: { dot: 6, text: '+3' },
      caption,
    }),
  claim: (caption: string) =>
    diagram({
      colored: { 4: 1, 5: 2, 2: 2, 6: 1, 8: 1 },
      strikes: [
        { dots: [4, 5, 6], player: 1 },
        { dots: [2, 6], player: 2 },
      ],
      label: { dot: 2, text: '+2' },
      caption,
    }),
};
