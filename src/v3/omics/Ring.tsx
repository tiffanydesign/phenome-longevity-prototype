import type { ReactNode } from "react";
import type { RingSpec } from "./topics";

/* each further share steps down in strength of the same hue, so one ring reads as one study */
const STEPS = [1, 0.68, 0.46, 0.3, 0.2, 0.14];

/**
 * A study's ring in its field hue (--mid): one arc filled to a share, or its
 * parts laid end to end around the circle with a small gap between them.
 */
export function Ring({ spec, size, stroke, children }: { spec: RingSpec; size: number; stroke: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const segs = spec.segs ?? [];
  const sum = segs.reduce((a, b) => a + b, 0);
  const gap = segs.length > 1 ? Math.min(stroke * 0.9, c * 0.03) : 0;
  let at = 0;
  return (
    <span className="om-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
          <circle className="om-ring-track" cx={size / 2} cy={size / 2} r={r} />
          {sum > 0
            ? segs.map((v, i) => {
                const len = (v / sum) * c;
                if (v <= 0) return null;
                const dash = Math.max(0.5, len - gap);
                const el = (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="var(--mid)"
                    data-field={spec.fields?.[i]}
                    strokeOpacity={spec.fields ? 1 : STEPS[Math.min(i, STEPS.length - 1)]}
                    strokeDasharray={`${dash} ${c - dash}`}
                    strokeDashoffset={-at}
                    strokeLinecap="butt"
                  />
                );
                at += len;
                return el;
              })
            : spec.fill !== undefined && (
                <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--mid)" strokeDasharray={`${Math.max(0.001, spec.fill) * c} ${c}`} strokeLinecap="round" />
              )}
        </g>
      </svg>
      {children && <span className="om-ring-c">{children}</span>}
    </span>
  );
}
