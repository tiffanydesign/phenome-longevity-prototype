import { useEffect, useRef } from "react";
import { usePrefs } from "@/lib/prefs";
import { loadMap, paintMap, sexMap } from "../twin/field";

interface Props {
  /** a baked organ map */
  organ: string;
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
export function DotArt({ organ: name, size, color = "#ffffff", crop = 1, className }: Props) {
  const organ = sexMap(name, usePrefs().sex);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dead = false;
    loadMap(organ).then((m) => {
      if (!dead) paintMap(el, m, color, crop);
    });
    return () => {
      dead = true;
    };
  }, [organ, size, color, crop]);

  return <canvas ref={ref} className={className} style={{ width: size, height: size }} aria-hidden />;
}
