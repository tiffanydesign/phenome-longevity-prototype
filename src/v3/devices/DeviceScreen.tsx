import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chevron } from "../ui/icons";
import { BackBar, BlurLayers, useGo, V2Screen } from "../ui/shell";
import { DeviceMark } from "./marks";
import { deviceById, isLow } from "./paired";
import { veilOnScroll } from "./veil";
import "./devices.css";

/**
 * One device. Read top to bottom: which device and whether it is talking to
 * the app; how much battery is left and for how long; the two things a member
 * does here (make it the main source, sync now); where its readings show;
 * the product's details; and, apart at the foot, unpairing.
 */
export function DeviceScreen() {
  const { id = "" } = useParams();
  const d = deviceById(id);
  const go = useGo();
  const nav = useNavigate();
  const [main, setMain] = useState(d?.id === "ring");
  const [sync, setSync] = useState<"idle" | "busy" | "done">("idle");
  const [unpair, setUnpair] = useState(false);

  if (!d) {
    return (
      <V2Screen nav={false}>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
        <div className="dv scroll" onScroll={veilOnScroll}>
          <header className="dv-bar">
            <BackBar />
          </header>
          <p className="dv-lead">This device is no longer paired.</p>
        </div>
      </V2Screen>
    );
  }

  const low = isLow(d);
  const live = d.link === "live";
  const status = sync === "busy" ? "Syncing…" : sync === "done" ? "Synced just now" : `Last synced ${d.lastSync}`;

  const syncNow = () => {
    if (sync === "busy") return;
    setSync("busy");
    window.setTimeout(() => setSync("done"), 1400);
  };

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="dv scroll" onScroll={veilOnScroll}>
        <header className="dv-bar">
          <BackBar />
        </header>

        {/* who it is */}
        <section className="dd-hero">
          <span className="dd-mark">
            <DeviceMark d={d} size={44} />
          </span>
          <h1>{d.name}</h1>
          <p className="dv-state" data-link={d.link}>
            {live && <i aria-hidden />}
            {status}
          </p>
        </section>

        {/* how much is left */}
        <section className="dd-batt" data-low={low ? "" : undefined} style={{ "--lvl": `${Math.max(d.battery, 3)}%` } as CSSProperties}>
          <span className="dd-batt-k">Battery</span>
          <b>
            {d.battery}
            <u>%</u>
          </b>
          <span className="dd-batt-bar" aria-hidden>
            <i />
          </span>
          <span className="dd-batt-t">{low ? `Charge soon · ${d.left.toLowerCase()}` : d.left}</span>
        </section>

        {/* what the member does here */}
        <div className="dv-group dd-acts">
          {live && (
            <label className="dd-switch">
              <span>
                <b>Main device</b>
                <small>When two devices measure the same thing, this one's reading is used</small>
              </span>
              <input type="checkbox" checked={main} onChange={(e) => setMain(e.target.checked)} />
              <i aria-hidden />
            </label>
          )}
          <button className="dd-row" data-state={sync} onClick={syncNow} disabled={sync === "busy"}>
            <span className="dd-row-mark" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
                <path d="M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
                <path d="M20 20v-4h-4" />
              </svg>
            </span>
            <span className="dd-row-t">{sync === "busy" ? "Syncing…" : "Sync now"}</span>
            {sync === "done" && <em>Up to date</em>}
          </button>
        </div>

        <section className="dv-sec">
          <h2 className="dv-h">Shows in</h2>
          <div className="dv-chips dd-chips">
            {d.shows.map((s) =>
              s.to ? (
                <button key={s.label} className="dv-chip" onClick={(e) => go(s.to!, { from: e.currentTarget })}>
                  {s.label}
                  <Chevron size={11} />
                </button>
              ) : (
                <span key={s.label} className="dv-chip" data-soon="">
                  {s.label} · soon
                </span>
              ),
            )}
          </div>
        </section>

        <section className="dv-sec">
          <h2 className="dv-h">Device details</h2>
          <dl className="dv-group dd-spec">
            {d.spec.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* set apart at the foot: the one action that cannot be undone here */}
        <div className="dv-group dd-unpair">
          <button
            className="dd-row"
            data-confirm={unpair ? "" : undefined}
            onClick={() => (unpair ? nav(-1) : setUnpair(true))}
            onBlur={() => setUnpair(false)}
          >
            <span className="dd-row-t">{unpair ? `Tap again to unpair ${d.short.toLowerCase()}` : "Unpair device"}</span>
          </button>
        </div>
        <p className="dd-foot">Readings already in your history stay after unpairing.</p>
      </div>
    </V2Screen>
  );
}
