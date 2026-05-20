import type { BoardShape, Dot, Line, ShapeId } from './types';

export const MIN_LINE_LENGTH = 1;

const COL = 1;
const ROW_SQ = 1;
const ROW_TRI = Math.sqrt(3) / 2;

function buildBoard(
  id: ShapeId,
  label: string,
  rowSpec: { r: number; c: number; x: number; y: number }[],
  lineKeys: { kind: Line['kind']; key: (r: number, c: number) => string }[]
): BoardShape {
  const dots: Dot[] = rowSpec.map((s, i) => ({
    id: i,
    row: s.r,
    col: s.c,
    x: s.x,
    y: s.y,
  }));
  const byKey = new Map<string, number>();
  dots.forEach((d) => byKey.set(`${d.row},${d.col}`, d.id));

  const lines: Line[] = [];
  for (const lk of lineKeys) {
    const buckets = new Map<string, number[]>();
    for (const d of dots) {
      const k = lk.key(d.row, d.col);
      let arr = buckets.get(k);
      if (!arr) {
        arr = [];
        buckets.set(k, arr);
      }
      arr.push(d.id);
    }
    for (const [k, ids] of buckets) {
      if (ids.length < MIN_LINE_LENGTH) continue;
      ids.sort((a, b) => {
        const da = dots[a];
        const db = dots[b];
        if (da.y !== db.y) return da.y - db.y;
        return da.x - db.x;
      });
      lines.push({
        id: `${lk.kind}:${k}`,
        dotIds: ids,
        length: ids.length,
        kind: lk.kind,
      });
    }
  }

  const xs = dots.map((d) => d.x);
  const ys = dots.map((d) => d.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 0.6;
  const viewBox = {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };

  return { id, label, dots, lines, viewBox };
}

function triangleBoard(): BoardShape {
  const rows = [8, 7, 6, 5, 4, 3, 2, 1];
  const spec: { r: number; c: number; x: number; y: number }[] = [];
  rows.forEach((len, r) => {
    for (let c = 0; c < len; c++) {
      spec.push({
        r,
        c,
        x: (r / 2 + c) * COL,
        y: r * ROW_TRI,
      });
    }
  });
  return buildBoard('triangle', 'Triangle', spec, [
    { kind: 'h', key: (r) => `r${r}` },
    { kind: 'd1', key: (_r, c) => `c${c}` },
    { kind: 'd2', key: (r, c) => `s${r + c}` },
  ]);
}

function squareBoard(): BoardShape {
  const spec: { r: number; c: number; x: number; y: number }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      spec.push({ r, c, x: c * COL, y: r * ROW_SQ });
    }
  }
  return buildBoard('square', 'Square', spec, [
    { kind: 'h', key: (r) => `r${r}` },
    { kind: 'v', key: (_r, c) => `c${c}` },
    { kind: 'd1', key: (r, c) => `d${r - c}` },
    { kind: 'd2', key: (r, c) => `s${r + c}` },
  ]);
}

function rectangleBoard(): BoardShape {
  const spec: { r: number; c: number; x: number; y: number }[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 7; c++) {
      spec.push({ r, c, x: c * COL, y: r * ROW_SQ });
    }
  }
  return buildBoard('rectangle', 'Rectangle', spec, [
    { kind: 'h', key: (r) => `r${r}` },
    { kind: 'v', key: (_r, c) => `c${c}` },
    { kind: 'd1', key: (r, c) => `d${r - c}` },
    { kind: 'd2', key: (r, c) => `s${r + c}` },
  ]);
}

function rhombusBoard(): BoardShape {
  const rows = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
  const MAX = 6;
  const MID = 5;
  const spec: { r: number; c: number; x: number; y: number }[] = [];
  rows.forEach((len, r) => {
    const offset = (MAX - len) / 2;
    for (let c = 0; c < len; c++) {
      spec.push({
        r,
        c,
        x: (offset + c) * COL,
        y: r * ROW_TRI,
      });
    }
  });

  return buildBoard('rhombus', 'Rhombus', spec, [
    { kind: 'h', key: (r) => `r${r}` },
    {
      kind: 'd1',
      key: (r, c) => {
        const norm = r <= MID ? c - r + MID : c;
        return `nw${norm}`;
      },
    },
    {
      kind: 'd2',
      key: (r, c) => {
        const norm = r <= MID ? c : c + r - MID;
        return `ne${norm}`;
      },
    },
  ]);
}

let _boards: Record<ShapeId, BoardShape> | null = null;
export function getBoards(): Record<ShapeId, BoardShape> {
  if (!_boards) {
    _boards = {
      triangle: triangleBoard(),
      square: squareBoard(),
      rectangle: rectangleBoard(),
      rhombus: rhombusBoard(),
    };
  }
  return _boards;
}

export function getBoard(id: ShapeId): BoardShape {
  return getBoards()[id];
}
