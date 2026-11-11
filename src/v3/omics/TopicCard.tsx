import type { NavigateOptions } from "react-router-dom";
import { Chevron } from "../ui/icons";
import { Glyph } from "../ui/glyphs";
import { Ring } from "./Ring";
import type { Topic } from "./topics";

/** a row's tap, handed the element it came from so the page can open from it */
export type Go = (from: HTMLElement) => void;
type Nav = (to: string, opts?: NavigateOptions & { from?: HTMLElement | null }) => void;

/**
 * One study as a card: its name as a link to the study, the bold status, the
 * lead value and the ring beside them; then two sub-readings side by side on a
 * hairline; then one sentence that says what the numbers mean.
 */
export function TopicCard({ t, go, onOpen }: { t: Topic; go: Nav; onOpen?: () => void }) {
  return (
    <section className="om-card" data-field={t.field}>
      <div className="om-card-top">
        <div className="om-card-l">
          <button className="om-name" onClick={() => go(`/v3/study/${t.id}`)}>
            {t.name} <Chevron size={12} />
          </button>
          <b className="om-status" data-tone={t.tone || undefined}>
            {t.status}
          </b>
          <span className="om-key">
            <small>{t.key.label}</small>
            <strong>{t.key.value}</strong>
          </span>
        </div>
        <button className="om-ring-b" onClick={onOpen ?? (() => go(`/v3/study/${t.id}`))} aria-label={`${t.name} in detail`}>
          <Ring spec={t.ring} size={78} stroke={9}>
            {t.ring.center ? <b>{t.ring.center}</b> : <Glyph name={t.glyph} size={24} />}
          </Ring>
        </button>
      </div>
      <dl className={`om-stats${t.stats.length > 2 ? " om-stats-3" : ""}`}>
        {t.stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
            {s.sub && <dd className="om-stat-sub">{s.sub}</dd>}
          </div>
        ))}
      </dl>
      <p className="om-insight">{t.insight}</p>
    </section>
  );
}
