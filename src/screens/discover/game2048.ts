/** Pure 2048 rules on a 4×4 grid (0 = empty). */
export type Board = number[][];
export type Dir = "up" | "down" | "left" | "right";

export const N = 4;

/** Opening board as captured (game_2048/playing): 2 at row 2 col 1, 2 at row 3 col 2. */
export function initialBoard(): Board {
  const b = empty();
  b[2][1] = 2;
  b[3][2] = 2;
  return b;
}

export const empty = (): Board => Array.from({ length: N }, () => Array(N).fill(0));

/** Slide one row toward index 0, merging equal neighbours once. */
function slideRow(row: number[]): { row: number[]; gained: number } {
  const vals = row.filter((v) => v);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      i++;
    } else out.push(vals[i]);
  }
  while (out.length < N) out.push(0);
  return { row: out, gained };
}

const transpose = (b: Board): Board => b[0].map((_, c) => b.map((r) => r[c]));
const flip = (b: Board): Board => b.map((r) => [...r].reverse());

export function move(b: Board, dir: Dir): { board: Board; gained: number; moved: boolean } {
  // normalise to "left", slide, then undo the transform
  let g = b;
  if (dir === "up" || dir === "down") g = transpose(g);
  if (dir === "right" || dir === "down") g = flip(g);
  let gained = 0;
  g = g.map((r) => {
    const s = slideRow(r);
    gained += s.gained;
    return s.row;
  });
  if (dir === "right" || dir === "down") g = flip(g);
  if (dir === "up" || dir === "down") g = transpose(g);
  const moved = g.some((r, i) => r.some((v, j) => v !== b[i][j]));
  return { board: g, gained, moved };
}

/**
 * Spawn a 2 (10 %: 4). The first two spawns are scripted so "up, right" reproduces
 * game_2048/playing_moves exactly; afterwards random empty cells.
 */
const SCRIPTED: [number, number][] = [
  [0, 0],
  [3, 2],
];
export function spawn(b: Board, nth: number): Board {
  const next = b.map((r) => [...r]);
  const s = SCRIPTED[nth];
  if (s && next[s[0]][s[1]] === 0) {
    next[s[0]][s[1]] = 2;
    return next;
  }
  const cells: [number, number][] = [];
  next.forEach((r, i) => r.forEach((v, j) => v === 0 && cells.push([i, j])));
  if (!cells.length) return next;
  const [i, j] = cells[Math.floor(Math.random() * cells.length)];
  next[i][j] = Math.random() < 0.9 ? 2 : 4;
  return next;
}

export function canMove(b: Board): boolean {
  return (["up", "down", "left", "right"] as Dir[]).some((d) => move(b, d).moved);
}
