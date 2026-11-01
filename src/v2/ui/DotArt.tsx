import { useEffect, useRef } from "react";
import { loadMap, paintMap } from "../twin/field";

/** Signed distance helpers in a -1..1 box; negative is inside. */
const circle = (x: number, y: number, cx: number, cy: number, r: number) => Math.hypot(x - cx, y - cy) - r;

const SHAPES = {
  /** Capacity: a gauge three quarters closed */
  gauge: (x: number, y: number) => {
    const a = Math.atan2(y, x);
    const ring = Math.abs(Math.hypot(x, y) - 0.66) - 0.17;
    return a > 0.75 && a < 2.4 ? 1 : ring;
  },
  moon: (x: number, y: number) => Math.max(circle(x, y, 0, 0, 0.8), -circle(x, y, 0.34, -0.16, 0.62)),
  /** Activity: the three daily rings */
  rings: (x: number, y: number) => {
    const d = Math.hypot(x, y);
    return Math.min(Math.abs(d - 0.78) - 0.09, Math.abs(d - 0.5) - 0.09, Math.abs(d - 0.22) - 0.09);
  },
  /** Vitals: concentric sweep */
  radar: (x: number, y: number) => {
    const d = Math.hypot(x, y);
    const a = Math.atan2(y, x);
    return a > -0.2 && a < 0.9 ? d - 0.82 : Math.abs(((d * 4.2) % 1) - 0.5) - 0.2 + (d > 0.82 ? 1 : 0);
  },
  plate: (x: number, y: number) => Math.min(Math.abs(Math.hypot(x, y) - 0.72) - 0.1, circle(x, y, 0, 0, 0.42)),
  /** Habits: a tick in a ring */
  tick: (x: number, y: number) => {
    const seg = (ax: number, ay: number, bx: number, by: number) => {
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
      return Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) - 0.12;
    };
    return Math.min(Math.abs(Math.hypot(x, y) - 0.76) - 0.09, seg(-0.32, 0.02, -0.08, 0.28), seg(-0.08, 0.28, 0.36, -0.22));
  },
};

export type Shape = keyof typeof SHAPES;

interface Props {
  shape?: Shape;
  /** a baked organ map, instead of a drawn shape */
  organ?: string;
  size: number;
  color?: string;
  /** 1 = whole map; above 1 crops into the middle */
  crop?: number;
  className?: string;
}

/**
 * Card art in the twin's own grammar: the contour-heavy dots of the halftone
 * rather than a stock render, so every card reads as a piece of the same figure.
 */
export function DotArt({ shape, organ, size, color = "#ffffff", crop = 1, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dead = false;
    if (organ) {
      loadMap(organ).then((m) => {
        if (!dead) paintMap(el, m, color, crop);
      });
      return () => {
        dead = true;
      };
    }
    const g = el.getContext("2d");
    if (!g || !shape) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = el.height = Math.round(size * dpr);
    // the organ maps' own density, so drawn glyphs sit beside them as one family
    const pitch = 3.2 * dpr;
    const n = Math.floor(el.width / pitch);
    g.fillStyle = color;
    g.beginPath();
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const x = ((col + 0.5) / n) * 2 - 1;
        const y = ((row + 0.5) / n) * 2 - 1;
        const sd = SHAPES[shape](x, y);
        if (sd > 0) continue;
        // heavy at the contour, light through the middle, as the tone pass shades a form
        const edge = Math.max(0, 1 + sd / 0.22);
        const r = (0.14 + 0.34 * edge * edge) * pitch;
        g.moveTo(col * pitch + pitch / 2 + r, row * pitch + pitch / 2);
        g.arc(col * pitch + pitch / 2, row * pitch + pitch / 2, r, 0, Math.PI * 2);
      }
    }
    g.fill();
    return () => {
      dead = true;
    };
  }, [shape, organ, size, color, crop]);

  return <canvas ref={ref} className={className} style={{ width: size, height: size }} aria-hidden />;
}
