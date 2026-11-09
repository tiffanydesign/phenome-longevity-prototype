import { Hero } from "../study/parts";
import { FIELD_MID } from "../ui/fields";
import "../study/study.css";
import { DotArt } from "../ui/DotArt";
import { Num } from "../ui/Num";
import { Chevron, IconClose } from "../ui/icons";
import { useGo } from "../ui/shell";
import { asOf, LENS_LABEL, lensOf, readingOf, regionsOf, toneOf, type Lens, type Region } from "./regions";

/** The readings under the figure: the lens's studies at rest, one study's data when a region is open. */
export function TwinDetail({ lens, region, visit, past, onSelect }: { lens: Lens; region: Region | null; visit: number; past: boolean; onSelect: (id: string | null) => void }) {
  return (
    <section className="tw-detail" aria-label={region ? region.name : `${LENS_LABEL[lens]} overview`}>
      {region ? <RegionPanel region={region} visit={visit} past={past} onClose={() => onSelect(null)} /> : <LensPanel lens={lens} visit={visit} past={past} onSelect={onSelect} />}
    </section>
  );
}

/** A status as the presentation words it; a study with no status shows none. */
function StatusTag({ id, visit }: { id: string; visit: number }) {
  const v = readingOf(id, visit);
  if (!v.status) return null;
  const tone = toneOf(v);
  return <small data-status={tone === "mon" || tone === "alert" ? "monitor" : "normal"}>{v.status}</small>;
}

function LensPanel({ lens, visit, past, onSelect }: { lens: Lens; visit: number; past: boolean; onSelect: (id: string) => void }) {
  const go = useGo();
  return (
    <>
      <div className="tw-body">
        <header className="twl-sec">
          <h3>Studies</h3>
        </header>
        <ul className="tw-list">
          {regionsOf(lens).map((r) => {
            const v = readingOf(r.id, visit);
            // a checkpoint row carries today's number under its own, so then and now read side by side
            const now = past ? readingOf(r.id) : null;
            return (
              <li key={r.id}>
                <button onClick={() => onSelect(r.id)}>
                  {/* the study's own hue: its organ drawn in it on a pale disc of the same */}
                  <span className="tw-thumb" data-field={r.field}>
                    <DotArt organ={r.map} size={40} color={FIELD_MID[r.field]} crop={r.map === "body" ? 1.4 : 1.2} />
                  </span>
                  <span className="tw-name">
                    {r.name}
                    <StatusTag id={r.id} visit={visit} />
                  </span>
                  <span className="tw-val">
                    <b>
                      <Num v={v.value} />
                    </b>{" "}
                    {v.unit ?? ""}
                    {now && now.value !== v.value && <small className="tw-now">Now {now.value}</small>}
                  </span>
                  <Chevron size={16} />
                </button>
              </li>
            );
          })}
        </ul>
        <button className="two-plan twl-plan" onClick={(e) => go("/v3/study/apose", { from: e.currentTarget })}>
          <span>
            <b>Your full review</b>
            <small>Every study, every visit</small>
          </span>
          <Chevron size={18} />
        </button>
      </div>
    </>
  );
}

function RegionPanel({ region, visit, past, onClose }: { region: Region; visit: number; past: boolean; onClose: () => void }) {
  const go = useGo();
  const v = readingOf(region.id, visit);
  return (
    <>
      <p className="tw-over" data-field={region.field}>{LENS_LABEL[lensOf(region.id)]}</p>
      <div className="tw-organ-head">
        <h2>{region.name}</h2>
        <StatusTag id={region.id} visit={visit} />
        <button aria-label="Back to the whole body" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <div className="tw-body">
        <div className="tw-reading">
          <Hero value={v.value} unit={v.unit} flagged={v.flagged} />
          {v.label && <p>{v.label}</p>}
          <p className="tw-asof">{v.single ? `Recorded once, ${v.single}` : past ? `${asOf(visit)} · snapshot` : asOf(visit)}</p>
        </div>
        <div className="tw-cards">{v.cards}</div>
        <button className="tw-study" onClick={() => go(`/v3/study/${region.id}`)}>
          Every visit in the full review
          <Chevron size={16} />
        </button>
        <button className="tw-ask" onClick={() => go(`/v3/assistant?ask=${encodeURIComponent(`Talk me through my ${region.name.toLowerCase()} results`)}`)}>
          Ask Longevity AI about your {region.name.toLowerCase()}
        </button>
      </div>
    </>
  );
}
