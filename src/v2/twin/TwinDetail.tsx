import { Hero } from "../study/parts";
import { FIELD_MID } from "../ui/fields";
import "../study/study.css";
import { DotArt } from "../ui/DotArt";
import { Num } from "../ui/Num";
import { Chevron, IconClose } from "../ui/icons";
import { useGo } from "../ui/shell";
import { AS_OF, LENS_LABEL, lensOf, readingOf, regionsOf, toneOf, type Lens, type Region } from "./regions";

/** The readings under the figure: the lens's studies at rest, one study's data when a region is open. */
export function TwinDetail({ lens, region, onSelect }: { lens: Lens; region: Region | null; onSelect: (id: string | null) => void }) {
  return (
    <section className="tw-detail" aria-label={region ? region.name : `${LENS_LABEL[lens]} overview`}>
      {region ? <RegionPanel region={region} onClose={() => onSelect(null)} /> : <LensPanel lens={lens} onSelect={onSelect} />}
    </section>
  );
}

/** A status as the presentation words it; a study with no status shows none. */
function StatusTag({ id }: { id: string }) {
  const v = readingOf(id);
  if (!v.status) return null;
  const tone = toneOf(v);
  return <small data-status={tone === "mon" || tone === "alert" ? "monitor" : "normal"}>{v.status}</small>;
}

function LensPanel({ lens, onSelect }: { lens: Lens; onSelect: (id: string) => void }) {
  return (
    <>
      <div className="tw-body">
        <ul className="tw-list">
          {regionsOf(lens).map((r) => {
            const v = readingOf(r.id);
            return (
              <li key={r.id}>
                <button onClick={() => onSelect(r.id)}>
                  {/* the study's own hue: its organ drawn in it on a pale disc of the same */}
                  <span className="tw-thumb" data-field={r.field}>
                    <DotArt organ={r.map} size={40} color={FIELD_MID[r.field]} crop={r.map === "body" ? 1.4 : 1.2} />
                  </span>
                  <span className="tw-name">
                    {r.name}
                    <StatusTag id={r.id} />
                  </span>
                  <span className="tw-val">
                    <b>
                      <Num v={v.value} />
                    </b>{" "}
                    {v.unit ?? ""}
                  </span>
                  <Chevron size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function RegionPanel({ region, onClose }: { region: Region; onClose: () => void }) {
  const go = useGo();
  const v = readingOf(region.id);
  return (
    <>
      <p className="tw-over" data-field={region.field}>{LENS_LABEL[lensOf(region.id)]}</p>
      <div className="tw-organ-head">
        <h2>{region.name}</h2>
        <StatusTag id={region.id} />
        <button aria-label="Back to the whole body" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <div className="tw-body">
        <div className="tw-reading">
          <Hero value={v.value} unit={v.unit} flagged={v.flagged} />
          {v.label && <p>{v.label}</p>}
          <p className="tw-asof">{v.single ? `Recorded once, ${v.single}` : AS_OF}</p>
        </div>
        <div className="tw-cards">{v.cards}</div>
        <button className="tw-study" onClick={() => go(`/v2/study/${region.id}`)}>
          Every visit in the full review
          <Chevron size={16} />
        </button>
        <button className="tw-ask" onClick={() => go(`/v2/assistant?ask=${encodeURIComponent(`Talk me through my ${region.name.toLowerCase()} results`)}`)}>
          Ask Longevity AI about your {region.name.toLowerCase()}
        </button>
      </div>
    </>
  );
}
