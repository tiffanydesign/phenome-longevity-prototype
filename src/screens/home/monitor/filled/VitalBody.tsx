import type { MetricDef, Period } from "@/data/home-monitor";
import type { VitalPage } from "@/data/real";
import { BP_DIA_USUAL, vitalSeries } from "@/data/real/series";
import { FilledChart } from "./FilledChart";
import { About, Analysis, Arrow, Factors, StatusPill } from "./parts";

/**
 * Vitals with readings (respiratory, BP, SpO₂, resting HR, HR, HRV) — capture
 * data2/mon/<metric>/<period>_*: status pill, chart with the usual-range band,
 * daily average + note (D), range, Longevity Analysis, Highest / Lowest, factors, About.
 */
// the synced app draws Heart Rate in green and BP in a deeper purple than the empty capture
const COLOR: Record<string, string> = { hr: "#65c466", bp: "#925cb1" };

export function VitalBody({ m: def, p, period }: { m: MetricDef; p: VitalPage; period: Period }) {
  const m = { ...def, color: COLOR[def.id] ?? def.color };
  const s = vitalSeries(m.id, period);
  const unit = m.id === "spo2" ? "%" : m.unit;
  const bp = m.id === "bp";
  return (
    <>
      <span className="mon-eyebrow">{p.eyebrow}</span>
      {bp ? (
        <div className="fv-bp-head">
          <span className="fv-bp-key">
            <i style={{ background: m.color }} /> SYSTOLIC
          </span>
          <span className="fv-bp-key">
            <i className="fv-ring" style={{ borderColor: m.color }} /> DIASTOLIC
          </span>
          <span className="fv-big">
            {p.sys}
            <small style={{ color: m.color }}>mmHg</small>
          </span>
          <span className="fv-big">
            {p.dia}
            <small style={{ color: m.color }}>mmHg</small>
          </span>
        </div>
      ) : (
        <div className="fv-big fv-big-one">
          {p.value}
          <small style={{ color: m.color }}>{unit}</small>
        </div>
      )}
      {p.status && <StatusPill text={p.status} />}
      <p className="mon-desc">{p.desc}</p>

      <FilledChart s={s} kind={period === "D" ? "dot" : "range"} color={m.color} band2={bp ? BP_DIA_USUAL : undefined} legend={p.usual} />

      {p.avg && (
        <>
          <h2 className="mon-h3 fv-sec">{p.avg.title}</h2>
          <span className="fv-val" style={{ color: m.color }}>
            <b>{p.avg.value}</b> {bp ? "" : unit}
          </span>
        </>
      )}
      {p.note && (
        <div className="mon-note fv-note">
          <h3>{p.note.title}</h3>
          <p>{p.note.text}</p>
        </div>
      )}
      {p.range && (
        <>
          <h2 className="mon-h3 fv-sec">{p.range.title}</h2>
          <span className="fv-val" style={{ color: m.color }}>
            <b>{p.range.value}</b> {unit}
          </span>
        </>
      )}
      {p.analysis && <Analysis text={p.analysis} tone={/^(Low|Elevated)/.test(p.status ?? "") ? "bad" : "good"} />}

      {bp && p.tiles && (
        <div className="mon-bp-grid fv-grid">
          {p.tiles.map(([t, v]) => (
            <div className="mon-bp-tile" key={t}>
              <span>{t}</span>
              <span className="fv-hl">
                <b>{v}</b> mmHg <Arrow up={t.startsWith("Highest")} />
              </span>
            </div>
          ))}
        </div>
      )}
      {!bp && p.hi && p.lo && (
        <div className="fv-hilo">
          {[
            ["Highest", p.hi, true] as const,
            ["Lowest", p.lo, false] as const,
          ].map(([t, v, up]) => (
            <div className="fv-hl-tile" key={t}>
              <span>{t}</span>
              <span className="fv-hl">
                <b>{v.value}</b> {unit} <Arrow up={up} />
              </span>
              <span className="fv-when">{v.when}</span>
            </div>
          ))}
        </div>
      )}

      {p.factors && <Factors items={p.factors} />}
      {p.about && <About title={p.about.title} text={p.about.text} />}
    </>
  );
}
