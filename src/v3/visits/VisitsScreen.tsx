import { useMemo, useState } from "react";
import { metric, type Metric } from "../data/metrics";
import { trim, visitDate, VISITS } from "../study/data";
import { CHECKPOINTS, clinicShort } from "../twin/checkpoints";
import { Chevron } from "../ui/icons";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import { CompareSheet } from "./CompareSheet";
import { RangeBar } from "./RangeBar";
import { at, decimalsOf, shortDate, verdictOf, VERDICT_LABEL, type Verdict } from "./verdict";
import "./visits.css";

/** Everything the clinic measured, by system. Device and diary readings live on Home, not here. */
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Vitals", ids: ["bp", "pulse", "spo2", "resp"] },
  { title: "Body", ids: ["weight", "bmi", "bodyfat", "visceral", "bone", "skin"] },
  { title: "Blood", ids: ["glucose", "hba1c", "tc", "tg", "crp", "tsh", "egfr"] },
  { title: "Gut", ids: ["diversity"] },
];

type Filter = "all" | "better" | "worse" | "steady";

const nameOf = (m: Metric) => (m.id === "bp" ? "Blood pressure" : m.label);

/** "136 mmHg" or "–" when a visit has no reading */
const fmt = (m: Metric, v: number | null) => (v === null ? "–" : trim(v, decimalsOf(m)));

/** A reading across the two visits: then, now, the verdict, and the range it sits in. */
function Row({ m, a, b, large }: { m: Metric; a: number; b: number; large?: boolean }) {
  const go = useGo();
  const va = at(m, a);
  const vb = at(m, b);
  const v = verdictOf(m, a, b);
  return (
    <button
      className="vc-row"
      data-large={large ? "" : undefined}
      data-field={m.field}
      data-verdict={v.kind}
      onClick={(e) => go(`/v3/metric/${m.id}`, { from: e.currentTarget })}
      aria-label={`${nameOf(m)}, ${fmt(m, va)} to ${fmt(m, vb)} ${m.unit}, ${VERDICT_LABEL[v.kind]}`}
    >
      <span className="vc-row-top">
        <span className="vc-name">{nameOf(m)}</span>
        <span className="vc-pill" data-verdict={v.kind}>
          {VERDICT_LABEL[v.kind]}
        </span>
      </span>
      <span className="vc-vals">
        <span className="vc-then">{fmt(m, va)}</span>
        <svg className="vc-to" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <b className="vc-now">{fmt(m, vb)}</b>
        <u>{m.unit}</u>
        <span className="vc-diff">{v.diff}</span>
      </span>
      <RangeBar m={m} a={a} b={b} kind={v.kind} />
      <Chevron size={14} />
    </button>
  );
}

/**
 * Two clinic visits side by side. The page answers in the order a member asks:
 * what changed overall, which readings moved most, then every reading by system.
 * Direction is read against each reading's reference range, never up or down alone.
 */
export function VisitsScreen() {
  const go = useGo();
  const last = VISITS.length - 1;
  const [pair, setPair] = useState<[number, number]>([Math.max(0, last - 1), last]);
  const [sheet, setSheet] = useState<"from" | "to" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [a, b] = pair;
  const one = VISITS.length < 2;

  const rows = useMemo(() => GROUPS.flatMap((g) => g.ids.map((id) => metric(id)).filter((m) => m.scans?.length)), []);
  const verdicts = useMemo(() => new Map(rows.map((m) => [m.id, verdictOf(m, a, b)])), [rows, a, b]);
  const count = (k: Verdict) => rows.filter((m) => verdicts.get(m.id)?.kind === k).length;
  const better = count("better");
  const worse = count("worse");
  const steady = count("steady") + count("shift");

  // the moves worth a look first: the largest shifts toward or away from range, worst first
  const biggest = useMemo(
    () =>
      rows
        .filter((m) => {
          const k = verdicts.get(m.id)?.kind;
          return k === "better" || k === "worse";
        })
        .sort((x, y) => {
          const vx = verdicts.get(x.id)!;
          const vy = verdicts.get(y.id)!;
          if (vx.kind !== vy.kind) return vx.kind === "worse" ? -1 : 1;
          return vy.weight - vx.weight;
        })
        .slice(0, 3),
    [rows, verdicts],
  );

  const shown = (m: Metric) => {
    if (filter === "all") return true;
    const k = verdicts.get(m.id)?.kind;
    return filter === "steady" ? k === "steady" || k === "shift" : k === filter;
  };

  const headline =
    worse === 0 && better === 0
      ? "Everything held steady"
      : worse === 0
        ? `${better} ${better === 1 ? "reading" : "readings"} moved toward range`
        : better === 0
          ? `${worse} ${worse === 1 ? "reading" : "readings"} moved away from range`
          : `${better} moved toward range, ${worse} moved away`;

  const clinicOf = (i: number) => clinicShort(CHECKPOINTS.find((c) => c.visit === VISITS[i])?.clinic ?? "");

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden />
      <div className="vs scroll">
        <header className="vs-bar">
          <BackBar />
        </header>
        <h1 className="vs-title">Clinic visits</h1>
        <p className="vs-lead">
          {VISITS.length} {VISITS.length === 1 ? "visit" : "visits"}, the latest on {visitDate(VISITS[last])}.
        </p>

        {/* the span being compared, held at the top while the readings scroll under it */}
        {!one && (
          <div className="vc-span" role="group" aria-label="Visits being compared">
            <button className="vc-tok" onClick={() => setSheet("from")} aria-label={`From ${visitDate(VISITS[a])}, change`}>
              <small>From</small>
              <b>Visit {a + 1}</b>
              <span>{shortDate(VISITS[a])}</span>
            </button>
            <svg className="vc-span-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <button className="vc-tok" data-to="" onClick={() => setSheet("to")} aria-label={`To ${visitDate(VISITS[b])}, change`}>
              <small>To</small>
              <b>
                Visit {b + 1}
                {b === last && <i>Latest</i>}
              </b>
              <span>{shortDate(VISITS[b])}</span>
            </button>
          </div>
        )}

        {/* the answer first: one sentence, then the three counts that make it, each a filter */}
        <section className="vc-sum" aria-live="polite">
          <h2>{headline}</h2>
          <p>
            {visitDate(VISITS[a])} at {clinicOf(a)} against {visitDate(VISITS[b])} at {clinicOf(b)}. Each reading is judged against its own reference range.
          </p>
          <div className="vc-tiles" role="radiogroup" aria-label="Show readings">
            {(
              [
                ["better", better, "Toward range"],
                ["worse", worse, "Away from range"],
                ["steady", steady, "Steady"],
              ] as const
            ).map(([k, n, label]) => (
              <button key={k} className="vc-tile" data-verdict={k} role="radio" aria-checked={filter === k} onClick={() => setFilter(filter === k ? "all" : k)}>
                <b>{n}</b>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {filter === "all" && biggest.length > 0 && (
          <section className="vc-sec">
            <h3>Biggest changes</h3>
            <div className="vc-stack">
              {biggest.map((m) => (
                <div key={m.id} className="vc-card">
                  <Row m={m} a={a} b={b} large />
                </div>
              ))}
            </div>
          </section>
        )}

        {GROUPS.map((g) => {
          const list = rows.filter((m) => g.ids.includes(m.id) && shown(m));
          if (!list.length) return null;
          return (
            <section key={g.title} className="vc-sec">
              <h3>
                {g.title}
                <small>{list.length}</small>
              </h3>
              <div className="vc-card vc-list">
                {list.map((m) => (
                  <Row key={m.id} m={m} a={a} b={b} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="vc-sec">
          <h3>More from your visits</h3>
          <div className="vc-card vc-list">
            <button className="vs-link" onClick={() => go("/v3/twin")}>
              <span>Your twin</span>
              <Chevron size={14} />
            </button>
            <button className="vs-link" onClick={() => go("/v3/study/apose")}>
              <span>Full review, study by study</span>
              <Chevron size={14} />
            </button>
            <button className="vs-link" onClick={() => go("/v3/study/natural")}>
              <span>Every laboratory marker</span>
              <Chevron size={14} />
            </button>
          </div>
        </section>
      </div>

      {sheet && (
        <CompareSheet
          end={sheet}
          pair={pair}
          clinicOf={clinicOf}
          onEnd={setSheet}
          onPick={(p) => {
            setPair(p);
            setFilter("all");
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </V2Screen>
  );
}
