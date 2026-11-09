import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Sex } from "@/lib/prefs";
import { hexRgb, loadHero, type HeroMap, type Tint } from "./field";

/** digitaltwin.html's Contour Fade: dot fill, and the ramp from open middle to inked contour */
const FILL = 0.95;
const BASE_RAMP = [hexRgb("#c8d9ef"), hexRgb("#33518f")];

export function useHero(sex: Sex): HeroMap | null {
  const [hero, setHero] = useState<HeroMap | null>(null);
  useEffect(() => {
    let dead = false;
    loadHero(sex).then((h) => !dead && setHero(h));
    return () => {
      dead = true;
    };
  }, [sex]);
  return hero;
}

/** An organ seat in the hero's cells, as fractions of its width and height. */
export function heroAt(hero: HeroMap, at: [number, number]): [number, number] {
  const [a, b, c, d] = hero.svg;
  return [(at[0] * a + b) / hero.cols, (at[1] * c + d) / hero.rows];
}

interface Props {
  hero: HeroMap;
  tints: Tint[];
  label: string;
  className?: string;
  style?: CSSProperties;
  /** the dot ramp, open middle to inked contour; a checkpoint passes a slate one */
  ramp?: [string, string];
}

/**
 * Home's figure: the digital twin's home page body, half length and fading out
 * at the waist, drawn as one dot per cell so the Monitor regions can take gold.
 */
export function HeroField({ hero, tints, label, className, style, ramp }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { cols, rows, cov, tone, svg } = hero;
    const RAMP = ramp ? [hexRgb(ramp[0]), hexRgb(ramp[1])] : BASE_RAMP;
    const [a, b, c, d] = svg;
    // per-cell gold weight, strongest region wins, the same falloff as the twin's buildTints
    const w = new Float32Array(cols * rows);
    const rgb: [number, number, number][] = new Array(cols * rows);
    for (const t of tints) {
      const cx = t.organ.at[0] * a + b;
      const cy = t.organ.at[1] * c + d;
      const rx = t.organ.radius[0] * a;
      const ry = t.organ.radius[1] * c;
      const col = hexRgb(t.color);
      for (let row = Math.max(0, Math.floor(cy - ry)); row < Math.min(rows, cy + ry); row++)
        for (let x = Math.max(0, Math.floor(cx - rx)); x < Math.min(cols, cx + rx); x++) {
          const dd = Math.hypot((x + 0.5 - cx) / rx, (row + 0.5 - cy) / ry);
          if (dd >= 1) continue;
          const k = 1 - dd * dd;
          const v = t.strength * k * (2 - k);
          const i = row * cols + x;
          if (v <= w[i]) continue;
          w[i] = v;
          rgb[i] = col;
        }
    }

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = Math.round(el.clientWidth * dpr);
      el.height = Math.round(el.clientHeight * dpr);
      const g = el.getContext("2d");
      if (!g) return;
      const pitch = el.width / cols;
      const buckets = new Map<number, number[]>();
      for (let i = 0; i < cols * rows; i++) {
        const k = w[i];
        if (cov[i] <= 0.0008 && k <= 0.01) continue;
        const x = i % cols;
        const row = (i - x) / cols;
        const t = tone[i];
        let cr = RAMP[0][0] + (RAMP[1][0] - RAMP[0][0]) * t;
        let cg = RAMP[0][1] + (RAMP[1][1] - RAMP[0][1]) * t;
        let cb = RAMP[0][2] + (RAMP[1][2] - RAMP[0][2]) * t;
        let r = 0.5 * FILL * Math.sqrt(cov[i]);
        if (k > 0.01) {
          const m = Math.min(1, k * 1.5);
          cr += (rgb[i][0] - cr) * m;
          cg += (rgb[i][1] - cg) * m;
          cb += (rgb[i][2] - cb) * m;
          r = Math.max(r, k * 0.4);
        }
        const key = ((cr >> 4) << 8) | ((cg >> 4) << 4) | (cb >> 4);
        let list = buckets.get(key);
        if (!list) buckets.set(key, (list = []));
        list.push((x + 0.5) * pitch, (row + 0.5) * pitch, Math.max(0.5 * dpr, r * pitch));
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
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hero, tints, ramp?.[0], ramp?.[1]]);

  return <canvas ref={ref} className={className} style={style} role="img" aria-label={label} />;
}
