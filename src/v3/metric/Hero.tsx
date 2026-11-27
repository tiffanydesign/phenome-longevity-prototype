import type { Metric } from "../data/metrics";
import { STATUS_LABEL } from "../data/metrics";
import { Num } from "../ui/Num";
import { CardGlyph, stampOf } from "../home/CardGlyph";
import "../home/card-glyph.css";

/*
 * The top of every reading's page, as one plain white card:
 *
 *   head    when it was last synced, after a small clock, at left; the status at right
 *   body    the number, its unit on the same baseline, and at right the same
 *           small picture its Home card carries
 *   foot    under a hairline, how it moved, in the status colour: green when
 *           the reading is in range, amber to monitor, red for an alert, and
 *           neutral grey when nothing moved ("Same as yesterday")
 */
const cap = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : "");
const PERIOD = /^(overnight|last night|today|this morning)$/i;
const DATE = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/;

/**
 * When the reading was last synced, said the way a health app says it:
 * a clock time for today, "Yesterday", a weekday within the week, then a
 * date (the year only when it isn't this one). A reading logged by hand
 * has no sync, so nothing.
 */
function synced(m: Metric): string | undefined {
  const stamp = stampOf(m);
  if (stamp) return stamp;
  const hit = DATE.exec(m.when);
  if (!hit) return undefined;
  const d = new Date(`${hit[1]} ${hit[2]} ${hit[3]}`);
  if (Number.isNaN(d.getTime())) return undefined;
  const today = new Date();
  const days = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.getFullYear() === today.getFullYear() ? `${hit[1]} ${hit[2]}` : m.when;
}

export function Hero({ m }: { m: Metric }) {
  // the part of the day the reading covers, the sync time, or the source's own words when neither applies
  const period = PERIOD.test(m.when) ? cap(m.when) : undefined;
  const time = m.source === "log" ? undefined : synced(m);
  const context = [period, time ?? (period || DATE.test(m.when) ? undefined : cap(m.when))].filter(Boolean) as string[];
  const sign = m.delta.trim()[0];
  const signed = sign === "+" || sign === "−" || sign === "-";
  const change = signed ? m.delta.replace(/^[+−-]\s?/, "") : m.delta;
  return (
    <section className="mx-hero" style={{ viewTransitionName: "v2-hero" }}>
      <div className="mx-hero-head">
        <p className="mx-src">
          {context.length > 0 && (
            <svg className="mx-src-clock" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5V12l3 2" />
            </svg>
          )}
          {context.map((c) => (
            <span key={c} className="mx-src-when">
              {c}
            </span>
          ))}
        </p>
        <em className="mx-status" data-status={m.status}>
          {STATUS_LABEL[m.status]}
        </em>
      </div>
      <div className="mx-hero-body">
        <div className="mx-value">
          <b>
            <Num v={m.value} />
          </b>
          <span>{m.unit}</span>
        </div>
        <span className="mx-hero-pic" aria-hidden>
          <CardGlyph m={m} />
        </span>
      </div>
      {m.delta && (
        <p className="mx-delta" data-status={/^same /i.test(m.delta.trim()) ? "flat" : m.status}>
          {signed && (
            <svg className="mx-delta-arrow" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d={sign === "+" ? "M6 10V2.6M2.6 5.6 6 2.2l3.4 3.4" : "M6 2v7.4M2.6 6.4 6 9.8l3.4-3.4"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {signed && <span className="mx-sr">{sign === "+" ? "Up " : "Down "}</span>}
          {change}
        </p>
      )}
    </section>
  );
}
