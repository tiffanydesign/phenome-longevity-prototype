import { Icon } from "@/components/Icon";
import { Chevron } from "../ui/icons";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import "./devices.css";

const PAIRED = [
  { name: "Phenome Ring", icon: "ring_icon", battery: 68, synced: "Synced 2 min ago", reads: "Heart, sleep, oxygen, temperature" },
  { name: "Phenome Band", icon: "band_icon", battery: 41, synced: "Synced 14 min ago", reads: "Steps, activity, calories, blood pressure" },
];

const SETTINGS = [
  { title: "Wearing hand", value: "Left" },
  { title: "Sync in background", value: "On" },
  { title: "Measurement units", value: "Metric" },
  { title: "Data sharing with your clinician", value: "On" },
];

/** The devices the twin reads from: their state, their settings, and adding another. */
export function DevicesScreen() {
  const go = useGo();
  return (
    <V2Screen nav={false}>
      <div className="dv scroll">
        <BackBar title="Devices" />
        <p className="dv-lead">Your twin reads from these. Readings are wellness estimates, not a medical device.</p>

        <h2 className="dv-h">Paired</h2>
        <div className="dv-group">
          {PAIRED.map((d) => (
            <div key={d.name} className="dv-device">
              <span className="dv-icon">
                <Icon name={d.icon} size={26} />
              </span>
              <span className="dv-text">
                <b>{d.name}</b>
                <small>{d.reads}</small>
                <span className="dv-state">
                  <i aria-hidden /> Connected · {d.synced}
                </span>
              </span>
              <span className="dv-battery" aria-label={`Battery ${d.battery}%`}>
                <span style={{ width: `${d.battery}%` }} />
                <em>{d.battery}%</em>
              </span>
            </div>
          ))}
          <button className="dv-row dv-add" onClick={() => go("/v3/add-device")}>
            <span className="dv-plus" aria-hidden>
              +
            </span>
            <span>Add a device</span>
            <Chevron size={14} />
          </button>
        </div>

        <h2 className="dv-h">Settings</h2>
        <div className="dv-group">
          {SETTINGS.map((s) => (
            <div key={s.title} className="dv-row">
              <span>{s.title}</span>
              <em>{s.value}</em>
              <Chevron size={14} />
            </div>
          ))}
        </div>
      </div>
    </V2Screen>
  );
}
