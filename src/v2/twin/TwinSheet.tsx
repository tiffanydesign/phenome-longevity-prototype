import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { metric, metricsFor, SOURCE_LABEL, STATUS_LABEL, type Metric, type OrganId, type Source, type Status } from "../data/metrics";
import { CHRONOLOGICAL_AGE, LENSES, ORGANS, type Lens, type Organ } from "../data/organs";
import { DotArt } from "../ui/DotArt";
import { Num } from "../ui/Num";
import { Chevron, IconClose } from "../ui/icons";
import { useGo } from "../ui/shell";

type Snap = "peek" | "half" | "full";
/** distance from the top of the screen, px, from the screen's own height */
const topsFor = (h: number): Record<Snap, number> => ({ peek: h - 186, half: Math.round(h * 0.486), full: 108 });

const SUMMARY: Record<Lens, { title: string; sub: string; organ: OrganId | null }> = {
  vitals: { title: "Capacity 72", sub: "Ring and band, 6 min ago", organ: null },
  body: { title: "86 kg, 29% fat", sub: "Clinic scan, 14 July", organ: null },
  omics: { title: "Immune reads 47", sub: "Your age is 42", organ: "immune" },
};

/** The organ's study in the full review, where it has one. */
const STUDY: Partial<Record<OrganId, string>> = { brain: "brain", thyroid: "thyroid", lungs: "lungs", heart: "heart", liver: "liver", gut: "guthealth", kidneys: "kidneys", bone: "skeletal", skin: "dermatology" };

/** Live rows first, then the scan, then the slow layers: the order they change in. */
const SOURCE_ORDER: { title: string; sources: Source[] }[] = [
  { title: "Live", sources: ["ring", "band", "log"] },
  { title: "Clinic scan, 14 July", sources: ["clinic"] },
  { title: "Omics", sources: ["omics"] },
];

export function TwinSheet({ lens, organ, onSelect }: { lens: Lens; organ: Organ | null; onSelect: (id: OrganId | null) => void }) {
  const [snap, setSnap] = useState<Snap>(organ ? "half" : "peek");
  const [drag, setDrag] = useState<number | null>(null);
  const grab = useRef({ y: 0, top: 0, moved: false });
  const sheet = useRef<HTMLElement>(null);
  const dragged = useRef<number | null>(null);
  const [height, setHeight] = useState(853);
  const TOPS = topsFor(height);

  useLayoutEffect(() => {
    setHeight(sheet.current?.parentElement?.clientHeight ?? 853);
  }, []);

  useEffect(() => {
    setSnap(organ ? "half" : "peek");
  }, [organ]);

  const top = drag ?? TOPS[snap];

  const down = (e: PointerEvent<HTMLElement>) => {
    grab.current = { y: e.clientY, top: TOPS[snap], moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    if (!e.buttons) return;
    const dy = e.clientY - grab.current.y;
    if (Math.abs(dy) > 4) grab.current.moved = true;
    if (grab.current.moved) {
      dragged.current = Math.max(TOPS.full, Math.min(TOPS.peek + 30, grab.current.top + dy));
      setDrag(dragged.current);
    }
  };
  const up = () => {
    const at = dragged.current;
    dragged.current = null;
    if (at === null) {
      if (!grab.current.moved) setSnap(snap === "peek" ? "half" : snap === "half" ? "full" : "half");
      return;
    }
    const near = (Object.keys(TOPS) as Snap[]).sort((a, b) => Math.abs(TOPS[a] - at) - Math.abs(TOPS[b] - at))[0];
    setSnap(near);
    setDrag(null);
  };

  return (
    <section ref={sheet} className="tw-sheet" data-snap={snap} data-drag={drag !== null ? "" : undefined} style={{ transform: `translateY(${top}px)`, "--tail": `${top - TOPS.full}px` } as CSSProperties} aria-label={organ ? organ.name : `${LENSES[lens].label} overview`}>
      <div className="tw-grab" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <i aria-hidden />
      </div>
      {organ ? <OrganPanel organ={organ} lens={lens} onClose={() => onSelect(null)} grip={{ down, move, up }} /> : <LensPanel lens={lens} onSelect={onSelect} grip={{ down, move, up }} />}
    </section>
  );
}

interface Grip {
  down: (e: PointerEvent<HTMLElement>) => void;
  move: (e: PointerEvent<HTMLElement>) => void;
  up: () => void;
}

const dragProps = (g: Grip) => ({ onPointerDown: g.down, onPointerMove: g.move, onPointerUp: g.up, onPointerCancel: g.up });

/** The number a row leads with: on Monitor, the marker that is the reason, so label and value agree. */
function headline(id: OrganId, lens: Lens): { value: string; unit: string; marker?: string } {
  const o = ORGANS[id];
  if (lens === "omics" && o.age) return { value: String(o.age), unit: "yrs" };
  const rows = metricsFor(id);
  const flagged = rows.find((m) => m.status === "monitor");
  if (flagged) return { value: flagged.value, unit: flagged.unit, marker: flagged.label };
  const wanted = lens === "body" ? "clinic" : lens === "omics" ? "omics" : null;
  const first = rows.find((m) => wanted === null || m.source === wanted) ?? rows[0];
  return first ? { value: first.value, unit: first.unit } : { value: "", unit: "" };
}

function LensPanel({ lens, onSelect, grip }: { lens: Lens; onSelect: (id: OrganId) => void; grip: Grip }) {
  const go = useGo();
  const def = LENSES[lens];
  const sum = SUMMARY[lens];
  return (
    <>
      <div className="tw-sum" {...dragProps(grip)}>
        <h2>{sum.title}</h2>
        <p>{sum.sub}</p>
      </div>
      <div className="tw-scroll">
        <ul className="tw-list">
          {def.organs.map((id) => {
            const o = ORGANS[id];
            const h = headline(id, lens);
            return (
              <li key={id}>
                <button onClick={() => onSelect(id)}>
                  <span className="tw-thumb">
                    <DotArt organ={o.map} size={46} color={o.status === "monitor" ? "#b27f00" : "#203a85"} crop={o.map === "body" ? 1.4 : 1.2} />
                  </span>
                  <span className="tw-name">
                    {o.name}
                    <StatusTag status={o.status} detail={h.marker} />
                  </span>
                  <span className="tw-val">
                    <b>
                      <Num v={h.value} />
                    </b>{" "}
                    {h.unit}
                  </span>
                  <Chevron size={16} />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="tw-estimate">
          <p>Anything you have not measured yet is estimated from 10,000 members like you. A clinic visit replaces those estimates with your own data.</p>
          <button className="v2-pillbtn" data-solid onClick={() => go("/v2/booking")}>
            Book a clinic visit
          </button>
        </div>
      </div>
    </>
  );
}

function StatusTag({ status, detail }: { status: Status; detail?: string }) {
  return (
    <small data-status={status}>
      {STATUS_LABEL[status]}
      {detail ? `, ${detail}` : ""}
    </small>
  );
}

function OrganPanel({ organ, lens, onClose, grip }: { organ: Organ; lens: Lens; onClose: () => void; grip: Grip }) {
  const go = useGo();
  const rows = metricsFor(organ.id).length ? metricsFor(organ.id) : organ.id === "immune" ? [metric("crp"), metric("bmi")] : [];
  const delta = organ.age !== undefined ? organ.age - CHRONOLOGICAL_AGE : 0;

  return (
    <>
      <div className="tw-organ-head" {...dragProps(grip)}>
        <h2>{organ.name}</h2>
        <StatusTag status={organ.status} />
        <button aria-label="Back to the whole body" onPointerDown={(e) => e.stopPropagation()} onPointerMove={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <div className="tw-scroll">
        {organ.age !== undefined && (
          <div className="tw-age">
            <b>{organ.age}</b>
            <span>
              biological years
              <br />
              {delta === 0 ? "Same as your age" : `${Math.abs(delta)} ${delta > 0 ? "older" : "younger"} than you`}
            </span>
          </div>
        )}
        <p className="tw-read">{organ.read}</p>
        {organ.action && (
          <button className="tw-action" onClick={() => go(`/v2/assistant?ask=${encodeURIComponent(organ.action!)}`)}>
            <span>
              <small>In your plan</small>
              {organ.action}
            </span>
            <Chevron size={16} />
          </button>
        )}
        {SOURCE_ORDER.map((group) => {
          const list = rows.filter((m) => group.sources.includes(m.source));
          if (!list.length) return null;
          return (
            <div className="tw-group" key={group.title}>
              <h3>{group.title}</h3>
              {list.map((m) => (
                <Row key={m.id} m={m} lens={lens} />
              ))}
            </div>
          );
        })}
        {STUDY[organ.id] && (
          <button className="tw-study" onClick={() => go(`/v2/study/${STUDY[organ.id]}`)}>
            Open the {organ.name.toLowerCase()} study
            <Chevron size={16} />
          </button>
        )}
        <button className="tw-ask" onClick={() => go(`/v2/assistant?ask=${encodeURIComponent(`How ${organ.name.endsWith("s") ? "are" : "is"} my ${organ.name.toLowerCase()}?`)}`)}>
          Ask Longevity AI about your {organ.name.toLowerCase()}
        </button>
      </div>
    </>
  );
}

function Row({ m }: { m: Metric; lens: Lens }) {
  const go = useGo();
  return (
    <button className="tw-row" data-flag={m.status === "monitor" ? "" : undefined} onClick={() => go(`/v2/metric/${m.id}`)}>
      <span>
        {m.label}
        <small>
          {SOURCE_LABEL[m.source]}, {m.when}
        </small>
      </span>
      <span className="tw-val">
        <b>
          <Num v={m.value} />
        </b>{" "}
        {m.unit}
      </span>
      <Chevron size={16} />
    </button>
  );
}
