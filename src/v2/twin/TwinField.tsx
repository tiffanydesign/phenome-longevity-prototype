import { useEffect, useRef, useState } from "react";
import { ORGANS, type Organ } from "../data/organs";
import { buildTints, COLS, COUNT, easeOut, hexRgb, loadMap, pickMarks, ROWS, staggerFrom, toCell, type CellMap, type Rgb, type Tint } from "./field";

const MORPH_MS = 620;
const SPREAD_MS = 520;
const TINT_MS = 420;
/** a heart at 58 bpm and lungs at 14 breaths a minute: the figure runs on the member's own numbers */
const BEAT_MS = 60000 / 58;
const BREATH_MS = 60000 / 14;

interface Props {
  /** cell map to show: "body" or an organ's map */
  map: string;
  tints: Tint[];
  /** region the morph starts from */
  focus?: Organ | null;
  /** run the heart and breath waves (Vitals lens) */
  alive?: boolean;
  /** show the skin markings as larger dots */
  marks?: boolean;
  /** "dark" for the navy Home tile */
  ground?: "light" | "dark";
  label: string;
  onTapCell?: (x: number, y: number) => void;
  className?: string;
}

const RAMP = { light: [hexRgb("#7185bd"), hexRgb("#203a85")], dark: [hexRgb("#8ea3d8"), hexRgb("#ffffff")] };

/**
 * The twin. Same cells, same radii and same colour ramp as the viewer's
 * screen-space halftone, drawn on a canvas so each dot can answer to data:
 * regions swell and tint with status, the heart beats at the member's resting
 * rate, and tapping an organ regrows the dots into that organ in place.
 */
export function TwinField({ map, tints, focus, alive, marks, ground = "light", label, onTapCell, className }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    now: new Float32Array(COUNT),
    from: new Float32Array(COUNT),
    target: new Float32Array(COUNT),
    tone: new Float32Array(COUNT),
    delay: new Float32Array(COUNT),
    morphAt: -1e9,
    tintFrom: buildTints([]),
    tintTo: buildTints([]),
    tintAt: -1e9,
    marks: null as Uint8Array | null,
    ready: false,
  });
  const [loads, setLoads] = useState(0);
  const reduce = useRef(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    let dead = false;
    Promise.all([loadMap(map), loadMap("body")]).then(([next, body]: [CellMap, CellMap]) => {
      if (dead) return;
      const s = state.current;
      s.from = s.now.slice();
      s.target = next.r;
      s.tone = next.tone;
      s.marks = pickMarks(body, 16);
      const [cx, cy] = focus ? toCell(focus.at[0], focus.at[1]) : [COLS / 2, ROWS / 3];
      s.delay = staggerFrom(cx, cy, SPREAD_MS);
      s.morphAt = reduce.current || !s.ready ? -1e9 : performance.now();
      s.ready = true;
      setLoads((n) => n + 1);
    });
    return () => {
      dead = true;
    };
  }, [map, focus]);

  useEffect(() => {
    const s = state.current;
    s.tintFrom = s.tintTo;
    s.tintTo = buildTints(tints);
    s.tintAt = reduce.current ? -1e9 : performance.now();
  }, [tints]);

  useEffect(() => {
    const el = canvas.current;
    if (!el || loads === 0) return;
    const g = el.getContext("2d");
    if (!g) return;
    const s = state.current;
    const [rampA, rampB] = RAMP[ground];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
    };
    resize();

    const heart = toCell(ORGANS.heart.at[0], ORGANS.heart.at[1]);
    const lungs = toCell(ORGANS.lungs.at[0], ORGANS.lungs.at[1]);

    const draw = (t: number) => {
      const pitch = el.width / COLS;
      const ox = 0;
      const oy = (el.height - ROWS * pitch) / 2;
      const tintK = easeOut(Math.min(1, (t - s.tintAt) / TINT_MS));
      // one wave per beat, leaving the heart and fading out by the shoulders
      const beat = alive ? ((t % BEAT_MS) / BEAT_MS) * 26 : -99;
      const breath = alive ? 0.5 - 0.5 * Math.cos(((t % BREATH_MS) / BREATH_MS) * Math.PI * 2) : 0;
      const buckets = new Map<number, number[]>();
      let moving = false;

      for (let i = 0; i < COUNT; i++) {
        const p = Math.min(1, Math.max(0, (t - s.morphAt - s.delay[i]) / MORPH_MS));
        if (p < 1) moving = true;
        const r0 = s.from[i] + (s.target[i] - s.from[i]) * easeOut(p);
        s.now[i] = r0;
        const wFrom = s.tintFrom.w[i];
        const wTo = s.tintTo.w[i];
        const w = wFrom + (wTo - wFrom) * tintK;
        if (r0 <= 0.004 && w <= 0.01) continue;

        const col = i % COLS;
        const row = (i - col) / COLS;
        let r = Math.max(r0, w * 0.4);

        if (alive && r0 > 0) {
          const d = Math.hypot(col - heart[0], row - heart[1]);
          const edge = Math.abs(d - beat);
          if (edge < 3) r *= 1 + 0.5 * (1 - edge / 3) * Math.max(0, 1 - d / 26);
          const ld = Math.hypot((col - lungs[0]) / 12, (row - lungs[1]) / 12);
          if (ld < 1) r *= 1 + 0.2 * breath * (1 - ld);
        }

        let tone = s.tone[i];
        const mark = marks && s.marks?.[i];
        if (mark) {
          r = Math.max(r, 0.26);
          tone = 1;
        }

        const a = rampA;
        const b = rampB;
        let cr = a[0] + (b[0] - a[0]) * tone;
        let cg = a[1] + (b[1] - a[1]) * tone;
        let cb = a[2] + (b[2] - a[2]) * tone;
        if (w > 0.01) {
          const src = wTo > 0 ? s.tintTo : s.tintFrom;
          const mix: Rgb = [src.rgb[i * 3], src.rgb[i * 3 + 1], src.rgb[i * 3 + 2]];
          const k = Math.min(1, w * 1.5);
          cr += (mix[0] - cr) * k;
          cg += (mix[1] - cg) * k;
          cb += (mix[2] - cb) * k;
        }
        // 4 bits a channel keeps the fill changes to a few dozen a frame
        const key = ((cr >> 4) << 8) | ((cg >> 4) << 4) | (cb >> 4);
        const px = ox + (col + 0.5) * pitch;
        const py = oy + (row + 0.5) * pitch;
        let list = buckets.get(key);
        if (!list) buckets.set(key, (list = []));
        list.push(px, py, Math.max(0.55 * dpr, r * pitch));
      }

      g.clearRect(0, 0, el.width, el.height);
      for (const [key, list] of buckets) {
        g.fillStyle = `rgb(${((key >> 8) & 15) * 17},${((key >> 4) & 15) * 17},${(key & 15) * 17})`;
        g.beginPath();
        for (let k = 0; k < list.length; k += 3) {
          g.moveTo(list[k] + list[k + 2], list[k + 1]);
          g.arc(list[k], list[k + 1], list[k + 2], 0, Math.PI * 2);
        }
        g.fill();
      }
      return moving || t - s.tintAt < TINT_MS;
    };

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      const busy = t - s.morphAt < MORPH_MS + SPREAD_MS + 40 || t - s.tintAt < TINT_MS + 40;
      const run = alive && !reduce.current;
      if (busy || (run && t - last > 32)) {
        draw(t);
        last = t;
      }
      if (busy || run) raf = requestAnimationFrame(loop);
    };
    draw(performance.now());
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [loads, alive, ground, tints, map, focus, marks]);

  return (
    <canvas
      ref={canvas}
      className={className}
      role="img"
      aria-label={label}
      onClick={(e) => {
        if (!onTapCell) return;
        const b = e.currentTarget.getBoundingClientRect();
        onTapCell((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height);
      }}
    />
  );
}
