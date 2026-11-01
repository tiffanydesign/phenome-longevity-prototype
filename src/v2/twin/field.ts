import { asset } from "@/lib/asset";
import type { Organ } from "../data/organs";

/** Same cell grid as scripts/bake-twin.mjs: one dot per cell, 80 across. */
export const COLS = 80;
export const ROWS = 92;
export const COUNT = COLS * ROWS;
/** the viewer's uFill */
const FILL = 0.95;

export interface CellMap {
  /** dot radius as a fraction of the pitch */
  r: Float32Array;
  /** tone position on the colour ramp */
  tone: Float32Array;
}

const cache = new Map<string, Promise<CellMap>>();

export function loadMap(name: string): Promise<CellMap> {
  let hit = cache.get(name);
  if (hit) return hit;
  hit = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = COLS;
      c.height = ROWS;
      const g = c.getContext("2d", { willReadFrequently: true })!;
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, COLS, ROWS).data;
      const r = new Float32Array(COUNT);
      const tone = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        const cov = d[i * 4] / 255;
        r[i] = cov > 0.003 ? 0.5 * FILL * Math.sqrt(cov) : 0;
        tone[i] = d[i * 4 + 1] / 255;
      }
      resolve({ r, tone });
    };
    img.onerror = () => reject(new Error(`twin map missing: ${name}`));
    img.src = asset(`twin/${name}.png`);
  });
  cache.set(name, hit);
  return hit;
}

/* viewBox the body was baked through: -56 -8 312 358.8 */
export const toCell = (x: number, y: number): [number, number] => [((x + 56) / 312) * COLS, ((y + 8) / 358.8) * ROWS];

export type Rgb = [number, number, number];

export function hexRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export interface Tint {
  organ: Organ;
  color: string;
  strength: number;
}

export interface TintField {
  w: Float32Array;
  rgb: Uint8ClampedArray;
}

/** Paint regions into per-cell weight + colour; the strongest region wins each cell. */
export function buildTints(tints: Tint[]): TintField {
  const w = new Float32Array(COUNT);
  const rgb = new Uint8ClampedArray(COUNT * 3);
  for (const t of tints) {
    const [cx, cy] = toCell(t.organ.at[0], t.organ.at[1]);
    const rx = (t.organ.radius[0] / 312) * COLS;
    const ry = (t.organ.radius[1] / 358.8) * ROWS;
    const c = hexRgb(t.color);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const d = Math.hypot((col + 0.5 - cx) / rx, (row + 0.5 - cy) / ry);
        if (d >= 1) continue;
        const k = 1 - d * d;
        const v = t.strength * k * (2 - k);
        const i = row * COLS + col;
        if (v <= w[i]) continue;
        w[i] = v;
        rgb[i * 3] = c[0];
        rgb[i * 3 + 1] = c[1];
        rgb[i * 3 + 2] = c[2];
      }
    }
  }
  return { w, rgb };
}

/** Radial stagger: cells nearest the tapped region answer first. */
export function staggerFrom(cx: number, cy: number, spreadMs: number): Float32Array {
  const out = new Float32Array(COUNT);
  const far = Math.hypot(COLS, ROWS);
  for (let i = 0; i < COUNT; i++) {
    const col = i % COLS;
    const row = (i - col) / COLS;
    out[i] = (Math.hypot(col - cx, row - cy) / far) * spreadMs;
  }
  return out;
}

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/** Stable pseudo-random subset of covered cells, used for the skin map. */
export function pickMarks(body: CellMap, every: number): Uint8Array {
  const out = new Uint8Array(COUNT);
  let seed = 727;
  for (let i = 0; i < COUNT; i++) {
    if (body.r[i] <= 0) continue;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    if (seed % every === 0) out[i] = 1;
  }
  return out;
}

/** Draw a cell map once at a fixed size. Thumbnails and card art share this. */
export function paintMap(canvas: HTMLCanvasElement, map: CellMap, color: string, crop = 1) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = canvas.clientWidth || canvas.width;
  const h = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext("2d");
  if (!g) return;
  const pitch = Math.min(size / COLS, h / ROWS) * crop * dpr;
  const ox = (canvas.width - COLS * pitch) / 2;
  const oy = (canvas.height - ROWS * pitch) / 2;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = color;
  g.beginPath();
  for (let i = 0; i < COUNT; i++) {
    const r = map.r[i];
    if (r <= 0) continue;
    const col = i % COLS;
    const row = (i - col) / COLS;
    const px = ox + (col + 0.5) * pitch;
    const py = oy + (row + 0.5) * pitch;
    const rad = Math.max(0.5, r * pitch);
    g.moveTo(px + rad, py);
    g.arc(px, py, rad, 0, Math.PI * 2);
  }
  g.fill();
}
