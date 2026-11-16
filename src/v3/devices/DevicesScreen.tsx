import { useState, type ReactNode } from "react";
import { Chevron } from "../ui/icons";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import { DeviceMark } from "./marks";
import { HOME_DEVICES, isLow, PAIRED, type Device } from "./paired";
import "./devices.css";

const SETTINGS = [
  { title: "Wearing hand", value: "Left" },
  { title: "Sync in background", value: "On" },
  { title: "Measurement units", value: "Metric" },
  { title: "Data sharing with your clinician", value: "On" },
];

/** The page's head: a round glass way back, then the title large on its own line. */
function Head({ title, lead }: { title: string; lead?: string }) {
  return (
    <>
      <header className="dv-bar">
        <BackBar />
      </header>
      <h1 className="dv-title">{title}</h1>
      {lead && <p className="dv-lead">{lead}</p>}
    </>
  );
}

/** A battery drawn as a battery: the level fills the body, the number sits beside it. */
export function Battery({ d }: { d: Device }) {
  return (
    <span className="dv-batt" data-low={isLow(d) ? "" : undefined} aria-label={`Battery ${d.battery}%${isLow(d) ? ", low" : ""}`}>
      <em>{d.battery}%</em>
      <span className="dv-batt-body" aria-hidden>
        <i style={{ width: `${Math.max(d.battery, 6)}%` }} />
      </span>
    </span>
  );
}

/** Wellness, not medicine: said once, up front, with the longer version a tap away. */
function NotMedical() {
  const [open, setOpen] = useState(false);
  return (
    <button className="dv-info" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="dv-info-mark" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.6v.1" />
        </svg>
      </span>
      <span className="dv-info-t">
        <b>Not a medical device</b>
        <small>
          Readings are wellness estimates.
          {open
            ? " They help you see patterns over days and weeks, but they cannot diagnose or rule out a condition. Talk to your clinician about anything that worries you."
            : " Tap to read more."}
        </small>
      </span>
      <Chevron dir={open ? "up" : "down"} size={14} />
    </button>
  );
}

/**
 * One paired device. The top opens its own page; below, what it reads and
 * where those readings show, each a way straight there.
 */
function DeviceRow({ d }: { d: Device }) {
  const go = useGo();
  return (
    <div className="dv-device">
      <button className="dv-dev-top" aria-label={`${d.name}, details`} onClick={(e) => go(`/v3/devices/${d.id}`, { from: e.currentTarget })}>
        <span className="dv-icon">
          <DeviceMark d={d} size={26} />
        </span>
        <span className="dv-main">
          <span className="dv-line">
            <b className="dv-name">{d.name}</b>
            <Battery d={d} />
          </span>
          <span className="dv-state" data-link={d.link} data-low={isLow(d) ? "" : undefined}>
            {d.link === "live" && <i aria-hidden />}
            {isLow(d) ? `Charge soon · ${d.synced.toLowerCase()}` : d.link === "live" ? `Connected · ${d.synced.toLowerCase()}` : d.synced}
          </span>
        </span>
        <Chevron size={14} />
      </button>
      <div className="dv-shows">
        <span>{d.reads}</span>
        <div className="dv-chips">
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
      </div>
    </div>
  );
}

/** Adding a device: the page's one solid action, in the brand navy. */
function AddButton({ label }: { label: ReactNode }) {
  const go = useGo();
  return (
    <button className="dv-addbtn" onClick={() => go("/v3/add-device")}>
      <span>{label}</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dv-sec">
      <h2 className="dv-h">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Devices: what is worn comes first, since those feed the twin all day and are
 * the ones the Home header reports on; adding one sits right under them.
 * Devices kept at home (scales, bottle) sit one level down, in a single row.
 */
export function DevicesScreen() {
  const go = useGo();
  const low = HOME_DEVICES.filter(isLow);
  return (
    <V2Screen nav={false}>
      <div className="dv scroll">
        <Head title="Devices" />
        <NotMedical />

        <Section title="Worn every day">
          <div className="dv-group">
            {PAIRED.map((d) => (
              <DeviceRow key={d.id} d={d} />
            ))}
          </div>
          <AddButton
            label={
              <>
                Add a <b>Phenome</b>Tech device
              </>
            }
          />
        </Section>

        <Section title="At home">
          <div className="dv-group">
            <button className="dv-home" onClick={(e) => go("/v3/devices/home", { from: e.currentTarget })}>
              <span className="dv-stack" aria-hidden>
                {HOME_DEVICES.map((d) => (
                  <span key={d.id} className="dv-icon">
                    <DeviceMark d={d} size={18} />
                  </span>
                ))}
              </span>
              <span className="dv-home-t">
                <b>Home devices</b>
                <small>
                  {HOME_DEVICES.length} paired
                  {low.length > 0 && (
                    <>
                      {" · "}
                      <em>{low.length} to charge</em>
                    </>
                  )}
                </small>
              </span>
              <Chevron size={14} />
            </button>
          </div>
        </Section>

        <Section title="Settings">
          <div className="dv-group">
            {SETTINGS.map((s) => (
              <div key={s.title} className="dv-row">
                <span>{s.title}</span>
                <em>{s.value}</em>
                <Chevron size={14} />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </V2Screen>
  );
}

/** The devices kept at home: each one, where its readings go, and adding another. */
export function HomeDevicesScreen() {
  return (
    <V2Screen nav={false}>
      <div className="dv scroll">
        <Head title="Home devices" lead="They log for you whenever you use them, so there is nothing to type in." />
        <Section title="Paired">
          <div className="dv-group">
            {HOME_DEVICES.map((d) => (
              <DeviceRow key={d.id} d={d} />
            ))}
          </div>
          <AddButton label="Add a home device" />
        </Section>
      </div>
    </V2Screen>
  );
}
