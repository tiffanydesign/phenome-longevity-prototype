import type { ReactNode } from "react";
import { Num } from "../ui/Num";

/**
 * The room display's chart family, redrawn for one thumb and one column. The
 * meaning of each mark is the portal's: a band for a reference range, a marker
 * for the reading, green only for in range, gold for outside it, red for a
 * finding that needs attention. Colour is never the only signal; every state
 * also carries its words.
 */
export type Tone = "ok" | "mon" | "alert" | "";

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className="rv-pill" data-tone={tone}>{children}</span>;
}

export function Mark({ tone }: { tone: Tone }) {
  if (tone === "ok")
    return (
      <svg className="rv-mark" viewBox="0 0 20 20" aria-hidden>
        <circle cx="10" cy="10" r="10" fill="#509b2126" />
        <path d="M5.7 10.3 8.7 13.3 14.4 7" fill="none" stroke="#417e1b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (tone === "mon")
    return (
      <svg className="rv-mark" viewBox="0 0 20 20" aria-hidden>
        <path d="M10 2.2 18.4 16.9H1.6z" fill="#e8bb50" stroke="#e8bb50" strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M10 7.4v4.6" stroke="#10214b" strokeWidth="2.1" strokeLinecap="round" />
        <circle cx="10" cy="14.6" r="1.2" fill="#10214b" />
      </svg>
    );
  if (tone === "alert")
    return (
      <svg className="rv-mark" viewBox="0 0 20 20" aria-hidden>
        <circle cx="10" cy="10" r="10" fill="#d93a1e" />
        <path d="M10 5.2v6" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
        <circle cx="10" cy="14.6" r="1.3" fill="#fff" />
      </svg>
    );
  return (
    <svg className="rv-mark" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="3.6" fill="#a9b5d9" />
    </svg>
  );
}

/** The display numeral and its caption. */
export function Hero({ value, unit, flagged }: { value: string; unit?: string; flagged?: number[] }) {
  // each half of a paired reading takes its own colour, so one being out does not colour the other
  const halves = value.split("/");
  return (
    <p className="rv-hero">
      <b>
        {halves.map((part, i) => (
          <span key={i} data-out={flagged?.includes(i) ? "" : undefined}>
            {i > 0 && "/"}
            <Num v={part} />
          </span>
        ))}
      </b>{" "}
      {unit && <span>{unit}</span>}
    </p>
  );
}

export function Card({ title, aside, children }: { title?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rv-card">
      {(title || aside) && (
        <header className="rv-head">
          {title && <h3>{title}</h3>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function Cells({ items, cols = 2 }: { items: ({ label: string; value?: string | number | null; unit?: string; tone?: Tone; under?: ReactNode } | null)[]; cols?: number }) {
  const shown = items.filter((i) => i && i.value !== undefined && i.value !== null && i.value !== "");
  return (
    <div className="rv-cells" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {shown.map((c) => (
        <div key={c!.label} className="rv-cell" data-tone={c!.tone}>
          <span>{c!.label}</span>
          <b>
            {c!.value}
            {c!.unit && <em>{c!.unit}</em>}
          </b>
          {c!.under}
        </div>
      ))}
    </div>
  );
}

/** Reference range: the band stands in the same place on every bar unless a reading runs past it. */
export function Range({ value, low, high, tone, ticks }: { value: number; low: number | null; high: number | null; tone?: Tone; ticks?: boolean }) {
  let bandFrom: number;
  let bandTo: number;
  let marker: number;
  if (low !== null && high !== null) {
    const span = high - low;
    const from = Math.min(low - span * 0.6, value);
    const to = Math.max(high + span * 0.6, value);
    const at = (p: number) => ((p - from) / (to - from)) * 100;
    bandFrom = at(low);
    bandTo = at(high);
    marker = at(value);
  } else if (low !== null) {
    // only a floor: the band runs on to the end of the bar
    const reach = Math.abs(low) || 1;
    bandFrom = 27.3;
    bandTo = 100;
    marker = value >= low ? bandFrom + Math.min(1, (value - low) / reach) * 45 : bandFrom - Math.min(1, (low - value) / reach) * bandFrom;
  } else {
    const ceiling = high as number;
    const room = Math.abs(ceiling) || 1;
    bandFrom = 0;
    bandTo = 72.7;
    marker = value <= ceiling ? bandTo - Math.min(1, (ceiling - value) / room) * 45 : bandTo + Math.min(1, (value - ceiling) / room) * (100 - bandTo);
  }
  const outside = (low !== null && value < low) || (high !== null && value > high);
  const fmt = (n: number) => String(Number(n.toFixed(2)));
  return (
    <div className="rv-range-wrap">
      <div className="rv-range" data-tone={tone ?? (outside ? "mon" : "")}>
        <i style={{ left: `${bandFrom}%`, width: `${bandTo - bandFrom}%` }} />
        <b style={{ left: `${Math.max(1, Math.min(99, marker))}%` }} />
      </div>
      {ticks && (
        <div className="rv-ticks">
          {low !== null && <span style={{ left: `${bandFrom}%` }}>{fmt(low)}</span>}
          {high !== null && <span style={{ left: `${bandTo}%` }}>{fmt(high)}</span>}
        </div>
      )}
    </div>
  );
}

/** The change across visits. The room display steps through them; on a phone the shape says more. */
export function VisitTrend({ values, at }: { values: number[]; at: number }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const W = 96;
  const H = 30;
  const x = (i: number) => 5 + (i / Math.max(1, values.length - 1)) * (W - 10);
  const y = (v: number) => (hi === lo ? H / 2 : H - 6 - ((v - lo) / (hi - lo)) * (H - 12));
  return (
    <svg className="rv-trend" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline points={values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="#7185bd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === at ? 4 : 2} fill={i === at ? "#203a85" : "#a9b5d9"} />
      ))}
    </svg>
  );
}

const RAMP = ["#0a1e57", "#203a85", "#7185bd", "#a9b5d9", "#435ba1"];

/** Parts of one whole: one hue in depths ordered by share, then what each part is. */
export function Parts({ items, unit = "%" }: { items: { name: string; value: number }[]; unit?: string }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="rv-parts">
      <div className="rv-parts-bar" role="img" aria-label={items.map((i) => `${i.name} ${i.value.toFixed(1)}${unit}`).join(", ")}>
        {items.map((i, n) => (
          <i key={i.name} style={{ flex: `${i.value / total} 1 0`, background: RAMP[n % RAMP.length] }} />
        ))}
      </div>
      <ul>
        {items.map((i, n) => (
          <li key={i.name}>
            <i style={{ background: RAMP[n % RAMP.length] }} />
            <span>{i.name}</span>
            <b>
              {i.value.toFixed(1)}
              {unit}
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Finding({ tone, title, detail, value, children }: { tone: Tone; title: string; detail?: string; value?: string | number; children?: ReactNode }) {
  return (
    <div className="rv-find">
      <Mark tone={tone} />
      <span className="rv-find-t">
        {title}
        {detail && <small>{detail}</small>}
      </span>
      {children}
      {value !== undefined && <b data-tone={tone}>{value}</b>}
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="rv-bullets">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export const Note = ({ children }: { children: ReactNode }) => <p className="rv-note">{children}</p>;

/** Completion ring for a share of a whole. */
export function Ring({ share, label }: { share: number; label: string }) {
  const c = 2 * Math.PI * 42;
  return (
    <svg className="rv-ring" viewBox="0 0 110 110" aria-hidden>
      <g transform="translate(55 55)">
        <circle r="42" fill="none" stroke="#e6e9f2" strokeWidth="9" />
        <circle r="42" fill="none" stroke="#203a85" strokeWidth="9" strokeLinecap="round" strokeDasharray={c.toFixed(1)} strokeDashoffset={(c * (1 - share)).toFixed(1)} transform="rotate(-90)" />
        <text y="9" textAnchor="middle" fontSize="24" fill="#10214b">
          {label}
        </text>
      </g>
    </svg>
  );
}

/** Arc dial for a derived age: the chronological age is the fixed top of the arc. */
export function AgeDial({ chronological, predicted }: { chronological: number; predicted: number }) {
  const diff = predicted - chronological;
  const share = Math.max(0.04, Math.min(0.96, 0.5 + (diff / 15) * 0.5));
  const a = Math.PI * (1 - share);
  const x = (100 + 78 * Math.cos(a)).toFixed(1);
  const y = (100 - 78 * Math.sin(a)).toFixed(1);
  const good = diff < 0;
  const accent = good ? "#509b21" : "#b27f00";
  return (
    <svg className="rv-dial" viewBox="0 0 200 124" aria-hidden>
      <path d="M100 22 A78 78 0 0 0 22 100" fill="none" stroke="#509b2138" strokeWidth="7" strokeLinecap="round" />
      <path d="M100 22 A78 78 0 0 1 178 100" fill="none" stroke="#b27f0038" strokeWidth="7" strokeLinecap="round" />
      <path d={`M100 22 A78 78 0 0 ${share < 0.5 ? 0 : 1} ${x} ${y}`} fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
      <circle cx={x} cy={y} r="7.5" fill={accent} stroke="#fff" strokeWidth="3" />
      <text x="100" y="92" textAnchor="middle" fontSize="36" fill={good ? "#417e1b" : "#8f6600"}>
        {predicted.toFixed(1)}
      </text>
      <text x="100" y="112" textAnchor="middle" fontSize="13" fill="#4a5578">
        years
      </text>
    </svg>
  );
}

const BEAT = "M0 84H16Q26.5 66 37 84H46L48.5 90L52 34L59 95L66 84Q81 54 96 84H135";

/** One heartbeat for each measured interval, with the interval washed on it. */
export function Heartbeat({ intervals }: { intervals: { name: string; ms: number; from: number; to: number }[] }) {
  return (
    <div className="rv-ecg">
      {intervals.map((n) => (
        <div key={n.name}>
          <svg viewBox="0 20 135 90" aria-hidden>
            <rect x={n.from} y="24" width={n.to - n.from} height="78" fill="#30b0cd" fillOpacity="0.16" />
            <path d={BEAT} fill="none" stroke="#4a5578" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${n.from} 100v7H${n.to}v-7`} fill="none" stroke="#203a8573" strokeWidth="1.6" />
          </svg>
          <span>{n.name}</span>
          <b>
            {n.ms}
            <em>ms</em>
          </b>
        </div>
      ))}
    </div>
  );
}

const ICONS: Record<string, ReactNode> = {
  circulatory: <path d="M12 19.6 5.3 12.9a4.4 4.4 0 0 1 0-6.2 4.4 4.4 0 0 1 6.2 0l.5.5.5-.5a4.4 4.4 0 0 1 6.2 0 4.4 4.4 0 0 1 0 6.2z" />,
  respiratory: <path d="M12 4v7.4M8.9 7.1C6.4 7.8 4.5 11.8 4.5 16c0 2.1 1 3.4 2.7 3.4 1.8 0 2.8-1.5 2.8-3.5V8.8c0-1.1-.4-1.8-1.1-1.7zM15.1 7.1c2.5.7 4.4 4.7 4.4 8.9 0 2.1-1 3.4-2.7 3.4-1.8 0-2.8-1.5-2.8-3.5V8.8c0-1.1.4-1.8 1.1-1.7z" />,
  metabolic: <path d="M13.2 14.6a4.6 4.6 0 1 1-9.2 0 4.6 4.6 0 0 1 9.2 0zM19.5 7.8a3.1 3.1 0 1 1-6.2 0 3.1 3.1 0 0 1 6.2 0z" />,
  digestive: <path d="M9 2.8v3.4c0 2.2-4 3.2-4 7.4s3.2 7 7.4 7c2.8 0 5-1.2 6.2-3.2l2.2.8M12 2.8v4c0 3.8 1.4 6.4 4.6 7 1.4.3 2.4 1.5 2 3.6" />,
  genitourinary: <path d="M12.6 3.8c-3.8 0-7.1 3.6-7.1 8.2s3.3 8.2 7.1 8.2c2.5 0 4.1-1.7 4.1-3.8 0-1.9-1.7-2.6-1.7-4.4s1.7-2.5 1.7-4.4c0-2.1-1.6-3.8-4.1-3.8z" />,
  musculoskeletal: <path d="M7 17l10-10M5 15.5a2.2 2.2 0 1 0 3.5 3.5M15.5 5a2.2 2.2 0 1 1 3.5 3.5" />,
  blood: <path d="M12 3.4c3.2 4.2 6 7.3 6 10.7a6 6 0 0 1-12 0c0-3.4 2.8-6.5 6-10.7z" />,
  infections: <path d="M12 3.4l7 2.8v5.2c0 4.4-2.9 7.9-7 9.1-4.1-1.2-7-4.7-7-9.1V6.2zM12 9.2v4.8M9.6 11.6h4.8" />,
  neoplasms: <path d="M20.2 12a8.2 8.2 0 1 1-16.4 0 8.2 8.2 0 0 1 16.4 0zM16.6 12a4.6 4.6 0 1 1-9.2 0 4.6 4.6 0 0 1 9.2 0z" />,
  eye: <path d="M2.8 12s3.4-6.1 9.2-6.1 9.2 6.1 9.2 6.1-3.4 6.1-9.2 6.1S2.8 12 2.8 12zM14.8 12a2.8 2.8 0 1 1-5.6 0 2.8 2.8 0 0 1 5.6 0z" />,
  skin: <path d="M3 7.5c3-2.4 6 2.4 9 0s6-2.4 9 0M3 12.5c3-2.4 6 2.4 9 0s6-2.4 9 0M3 17.5c3-2.4 6 2.4 9 0s6-2.4 9 0" />,
  multisystem: <path d="M12 7.5 6.8 16M12 7.5 17.2 16M8.8 17.6h6.4" />,
};

const FILL: Record<string, string> = { typical: "#e6e9f2", moderate: "#e8bb50", high: "#d93a1e" };
const GLYPH: Record<string, string> = { typical: "#203a85", moderate: "#10214b", high: "#fff" };

/** ProteoRisk's body-systems wheel: colour and count here, the names listed underneath. */
export function Wheel({ systems }: { systems: { code: string; name: string; status: string }[] }) {
  const size = 300;
  const c = 150;
  const outer = 146;
  const inner = 94;
  const slice = 360 / systems.length;
  const polar = (r: number, d: number): [number, number] => [c + r * Math.sin((d * Math.PI) / 180), c - r * Math.cos((d * Math.PI) / 180)];
  const typical = systems.filter((s) => s.status === "typical").length;
  return (
    <figure className="rv-wheel" role="img" aria-label={`${typical} of ${systems.length} body systems look typical`}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {systems.map((s, i) => {
          const from = i * slice - slice / 2 + 1.3;
          const to = (i + 1) * slice - slice / 2 - 1.3;
          const [ax, ay] = polar(outer, from);
          const [bx, by] = polar(outer, to);
          const [dx, dy] = polar(inner, to);
          const [ex, ey] = polar(inner, from);
          const [mx, my] = polar((inner + outer) / 2, i * slice);
          return (
            <g key={s.code}>
              <path d={`M${ax} ${ay}A${outer} ${outer} 0 0 1 ${bx} ${by}L${dx} ${dy}A${inner} ${inner} 0 0 0 ${ex} ${ey}Z`} fill={FILL[s.status]} />
              <g transform={`translate(${mx - 15.6} ${my - 15.6}) scale(1.3)`} fill="none" stroke={GLYPH[s.status]} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[s.code]}
              </g>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <b>
          {typical} of {systems.length}
        </b>
        <small>body systems look typical</small>
      </figcaption>
    </figure>
  );
}

const TIER: Record<string, string> = { high: "#d93a1e", moderate: "#e8bb50", low: "#203a85" };

export function Gauge({ score, tier }: { score: number; tier: string }) {
  const arc = (end: number) => {
    const r = 26;
    const a = (end * Math.PI) / 180;
    return `M6 35A${r} ${r} 0 0 1 ${(32 + r * Math.sin(a)).toFixed(2)} ${(35 - r * Math.cos(a)).toFixed(2)}`;
  };
  return (
    <svg className="rv-gauge" viewBox="0 0 64 42" aria-hidden>
      <path d={arc(90)} fill="none" stroke="#e6e9f2" strokeWidth="6" strokeLinecap="round" />
      <path d={arc(-90 + Math.max(2, 1.8 * score))} fill="none" stroke={TIER[tier]} strokeWidth="6" strokeLinecap="round" />
      <text x="32" y="37" textAnchor="middle" fontSize="17" fontWeight="500" fill="#10214b">
        {score}
      </text>
    </svg>
  );
}
