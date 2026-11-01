import { useMemo, useRef, useState, type ReactNode } from "react";
import { asset } from "@/lib/asset";
import { metric, seriesFor } from "../data/metrics";
import { MONITORING } from "../data/organs";
import { TwinField } from "../twin/TwinField";
import type { Tint } from "../twin/field";
import { CardTrend } from "../ui/charts";
import { DotArt, type Shape } from "../ui/DotArt";
import { Chevron, IconGrip, IconResize } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { useBento } from "./bento";

const SLIDES = [
  { text: "Your weekly report is ready. HRV is up 9% and sleep held steady.", to: "/v2/home?tab=vitals" },
  { text: "hs-CRP rose between your scans. See what your twin connects it to.", to: "/v2/twin?lens=vitals&organ=heart" },
  { text: "Your third scan window opens on 14 January.", to: "/v2/booking" },
];

const GOLD = "#e8bb50";

/** Weekly report strip, then the bento. The cards are the member's to arrange. */
export function Overview({ editing, onEdit }: { editing: boolean; onEdit: (on: boolean) => void }) {
  const go = useGo();
  const bento = useBento(editing, onEdit);

  return (
    <div className="v2-all">
      <Report />
      <div className="v2-bento" data-editing={editing ? "" : undefined}>
        {/* rendered in a fixed order and placed with CSS order: moving the node would drop pointer capture mid-drag */}
        {[...bento.slots].sort((a, b) => a.id.localeCompare(b.id)).map((s) => (
          <div
            key={s.id}
            className="v2-slot"
            style={{ order: bento.slots.indexOf(s) }}
            data-card={s.id}
            data-size={s.size}
            data-drag={bento.dragging === s.id ? "" : undefined}
            onPointerDown={(e) => bento.down(e, s.id)}
            onPointerMove={(e) => bento.move(e, s.id)}
            onPointerUp={bento.up}
            onPointerCancel={bento.up}
            onContextMenu={(e) => e.preventDefault()}
            onClickCapture={(e) => {
              if ((e.target as HTMLElement).closest(".v2-slot-tools")) return;
              if (editing || bento.consumedHold()) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <Tile id={s.id} size={s.size} go={go} />
            {editing && (
              <span className="v2-slot-tools">
                <i aria-hidden>
                  <IconGrip />
                </i>
                <button
                  aria-label={`Resize ${s.id}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    bento.resize(s.id);
                  }}
                >
                  <IconResize />
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="v2-all-foot">
        {editing ? (
          <>
            <button className="v2-pillbtn" onClick={bento.reset}>
              Reset layout
            </button>
            <button className="v2-pillbtn" data-solid onClick={() => onEdit(false)}>
              Done
            </button>
          </>
        ) : (
          <button className="v2-pillbtn" onClick={() => onEdit(true)}>
            Edit cards
          </button>
        )}
      </div>
    </div>
  );
}

function Report() {
  const go = useGo();
  const [at, setAt] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="v2-report">
      <div
        className="v2-report-track"
        ref={ref}
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {SLIDES.map((s) => (
          <button key={s.text} onClick={() => go(s.to)}>
            {s.text}
          </button>
        ))}
      </div>
      <div className="v2-report-dots" aria-hidden>
        {SLIDES.map((s, i) => (
          <i key={s.text} data-on={i === at ? "" : undefined} />
        ))}
      </div>
    </div>
  );
}

function Tile({ id, size, go }: { id: string; size: string; go: ReturnType<typeof useGo> }) {
  const open = (to: string) => (e: { currentTarget: HTMLElement }) => go(to, { from: e.currentTarget });
  const tiles: Record<string, () => ReactNode> = {
    twin: () => <TwinTile size={size} onOpen={open("/v2/twin")} />,
    capacity: () => <Stat m="capacity" shape="gauge" onOpen={open("/v2/metric/capacity")} />,
    activity: () => <Stat m="steps" title="Activity" shape="rings" onOpen={open("/v2/metric/steps")} />,
    sleep: () => <Stat m="sleep" shape="moon" onOpen={open("/v2/metric/sleep")} />,
    vitals: () => <Stat m="rhr" title="Heart" organ="heart" onOpen={open("/v2/metric/rhr")} />,
    food: () => <Stat m="diet" shape="plate" onOpen={open("/v2/metric/diet")} />,
    body: () => <Stat m="weight" title="Body" organ="body" onOpen={open("/v2/metric/weight")} />,
    habits: () => <Stat m="habits" shape="tick" onOpen={open("/v2/metric/habits")} />,
    consult: () => (
      <button className="v2-tile" data-field="plain" onClick={open("/v2/booking")}>
        <span className="v2-tile-t">Book your next scan</span>
        <span className="v2-tile-s">Window opens 14 January</span>
        <span className="v2-tile-go">
          <Chevron />
        </span>
      </button>
    ),
    store: () => (
      <button className="v2-tile v2-tile-store" data-field="plain" onClick={open("/v2/store")}>
        <span className="v2-tile-t">Store</span>
        <img src={asset("img/Phenome_Ring_Silver-metal_transparent.png")} alt="" />
      </button>
    ),
  };
  return <>{tiles[id]()}</>;
}

function Stat({ m, title, shape, organ, onOpen }: { m: string; title?: string; shape?: Shape; organ?: string; onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const row = metric(m);
  const week = useMemo(() => seriesFor(row, "W"), [row]);
  return (
    <button className="v2-tile" data-field={row.field} onClick={onOpen}>
      <span className="v2-tile-art">{organ ? <DotArt organ={organ} size={organ === "body" ? 168 : 118} /> : <DotArt shape={shape} size={92} />}</span>
      <span className="v2-tile-t">{title ?? row.label}</span>
      <span className="v2-tile-trend">{row.chart === "scan" ? <span className="v2-tile-d">{row.delta}</span> : <CardTrend values={week} kind={row.chart} w={120} h={30} />}</span>
      <span className="v2-tile-v">
        <b>
          <Num v={row.value} />
        </b>{" "}
        {row.unit.replace(" kcal", "")}
      </span>
    </button>
  );
}

/** The twin's front door on Home: the same field, the same regions, and what they currently say. */
function TwinTile({ size, onOpen }: { size: string; onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const tints = useMemo<Tint[]>(() => MONITORING.map((organ) => ({ organ, color: GOLD, strength: 1 })), []);
  return (
    <button className="v2-twin-tile" data-size={size} onClick={onOpen}>
      <TwinField className="v2-twin-tile-field" map="body" tints={tints} ground="dark" label="Your twin, with the heart and liver marked for monitoring" />
      <span className="v2-twin-tile-copy">
        <span className="v2-twin-tile-t">Your twin</span>
        <span className="v2-twin-tile-stat">
          <b>41</b> of 52 optimal
        </span>
        <span className="v2-twin-tile-flag">
          <i aria-hidden />
          hs-CRP and BMI on Monitor
        </span>
      </span>
      <span className="v2-twin-tile-go">
        <Chevron />
      </span>
    </button>
  );
}
