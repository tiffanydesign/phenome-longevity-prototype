import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chevron, IconClose } from "../ui/icons";
import { useGo } from "../ui/shell";
import { canCompare } from "../kits/history";
import { KitThumb, KIT_FIELD } from "./kitMarks";
import { newestOf, type Pick, type TestKit } from "./tests";

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** "Visit 4" for a test tied to a clinic visit, otherwise how it was taken. */
const meta = (kit: TestKit, run: Pick["run"]) => (run.visit ? `Visit ${run.visit}` : kit.how);

/**
 * Which test the tab is showing, above its results: the kit's mark, its name,
 * when it was run and how. With more than one test to choose from, the card
 * opens a sheet of every kit and every run, newest first; a kit the member has
 * not taken sits at the end in grey with the way to buy it.
 */
export function KitPicker({ topic, kits, at, fresh, onPick }: { topic: string; kits: TestKit[]; at: Pick; fresh: boolean; onPick: (key: string) => void }) {
  const go = useGo();
  const [open, setOpen] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const runs = kits.reduce((n, k) => n + k.runs.length, 0);
  const choice = runs > 1 || kits.some((k) => !k.runs.length);
  const compare = topic === "genomics" && canCompare("genome", at.kit.name);
  /* one Latest across the whole sheet: the tab's newest run, and its kit listed first */
  const latest = newestOf(kits)?.run.key;
  const tested = kits.filter((k) => k.runs.length);
  const order = [
    ...tested.filter((k) => k.runs.some((r) => r.key === latest)),
    ...tested.filter((k) => !k.runs.some((r) => r.key === latest)),
    ...kits.filter((k) => !k.runs.length),
  ];

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const body = (
    <>
      <KitThumb id={at.kit.id} family={at.kit.family} />
      <span className="om-pk-text">
        <small>
          {at.newest ? "Latest test" : "Earlier test"}
          {fresh && at.newest && <em className="om-new">New</em>}
        </small>
        <b>{at.kit.name}</b>
        <span>
          {at.run.date} · {meta(at.kit, at.run)}
        </span>
      </span>
    </>
  );

  return (
    <>
      <div className="om-pk" ref={card} data-field={KIT_FIELD[at.kit.family]}>
        {choice ? (
          <button className="om-pk-main" aria-haspopup="dialog" onClick={() => setOpen(true)}>
            {body}
            <span className="om-pk-change">
              Change
              <Chevron dir="down" size={13} />
            </span>
          </button>
        ) : (
          <div className="om-pk-main">{body}</div>
        )}
        {compare && (
          <button className="om-pk-compare" onClick={(e) => go(`/v3/kit/genome/compare?test=${encodeURIComponent(at.kit.name)}`, { from: e.currentTarget })}>
            Compare with your earlier test
            <Chevron size={13} />
          </button>
        )}
      </div>

      {/* the sheet covers the whole screen, tab bar included, so it lives on the screen itself rather than in the scrolling page */}
      {open &&
        createPortal(
        <div className="om-sheet" role="dialog" aria-label="Choose a test">
          <button className="om-sheet-scrim" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="om-sheet-panel">
            <header>
              <h2>Choose a test</h2>
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <IconClose />
              </button>
            </header>
            <div className="om-sheet-body">
              {order.map((k) => (
                <section key={k.id} className="om-sheet-kit" data-field={KIT_FIELD[k.family]} data-untested={k.runs.length ? undefined : ""}>
                  <div className="om-sheet-kit-head">
                    <KitThumb id={k.id} family={k.family} />
                    <span>
                      <b>{k.name}</b>
                      <small>{k.runs.length ? `${k.how} · ${k.runs.length === 1 ? "1 test" : `${k.runs.length} tests`}` : "Not tested yet"}</small>
                    </span>
                    {!k.runs.length && (
                      <button className="om-buy" onClick={(e) => go("/v3/store", { from: e.currentTarget })}>
                        Buy kit
                      </button>
                    )}
                  </div>
                  {k.runs.length > 0 && (
                    <div className="om-sheet-runs" role="radiogroup" aria-label={k.name}>
                      {k.runs.map((r) => {
                        const on = r.key === at.run.key;
                        return (
                          <button
                            key={r.key}
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              setOpen(false);
                              onPick(r.key);
                            }}
                          >
                            <span>
                              <b>
                                {r.date}
                                {r.key === latest && <em>Latest</em>}
                              </b>
                              <small>{[r.visit ? `Visit ${r.visit}` : null, r.panel].filter(Boolean).join(" · ") || k.how}</small>
                            </span>
                            {on && <IconCheck />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>,
          card.current?.closest(".v2") ?? document.body,
        )}
    </>
  );
}
