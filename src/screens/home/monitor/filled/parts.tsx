/** Shared pieces of the synced-account Health Monitor pages (capture data2/mon/*). */

export function InfoGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
      <path d="M8 7.1v4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** ▲ / ▼ after a value. */
export function Arrow({ up, color }: { up: boolean; color?: string }) {
  return (
    <svg className="fv-arrow" width="9" height="7" viewBox="0 0 10 8" aria-hidden style={{ color }}>
      <path d={up ? "M5 0l5 8H0z" : "M5 8l5-8H0z"} fill="currentColor" />
    </svg>
  );
}

/** ● grey dot after the "previous" value. */
export function Dot() {
  return (
    <svg className="fv-dot" width="6" height="6" viewBox="0 0 6 6" aria-hidden>
      <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
  );
}

/** "● Normal, in typical range ⓘ" — green when normal, red when low / elevated. */
export function StatusPill({ text }: { text: string }) {
  const bad = /^(Low|Elevated|High)/.test(text);
  return (
    <span className="fv-pill" data-tone={bad ? "bad" : "good"}>
      <i /> {text} <InfoGlyph size={11} />
    </span>
  );
}

/** "▲ 18% vs Yesterday" */
export function DeltaPill({ text, up }: { text: string; up: boolean }) {
  return (
    <span className="fv-pill" data-tone={up ? "good" : "bad"}>
      <Arrow up={up} /> {text}
    </span>
  );
}

export function Analysis({ text, tone }: { text: string; tone: "good" | "bad" | "plain" }) {
  return (
    <div className="fv-analysis" data-tone={tone}>
      <h3>Longevity Analysis</h3>
      <p>{text}</p>
    </div>
  );
}

export function Factors({ items }: { items: [string, string][] }) {
  return (
    <>
      <h2 className="mon-h2 mon-factors-title">Influencing Factors</h2>
      <div className="mon-factors">
        {items.map(([t, d]) => (
          <div className="mon-factor" key={t}>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export function About({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h2 className="mon-h2 fv-about-title">{title}</h2>
      <p className="mon-about">{text}</p>
    </>
  );
}

/** "10.8k" / "9,100" / "567.0" → number, for comparisons only. */
export function parseShown(s: string | undefined): number {
  if (!s) return 0;
  const t = s.replace(/,/g, "").trim();
  if (/^\d+:\d+/.test(t)) {
    const [h, m] = t.split(":").map(parseFloat);
    return h * 60 + m;
  }
  const v = parseFloat(t);
  return /k$/i.test(t) ? v * 1000 : Number.isNaN(v) ? 0 : v;
}
