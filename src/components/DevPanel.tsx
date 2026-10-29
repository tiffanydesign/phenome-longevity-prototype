import { useLocation, useNavigate } from "react-router-dom";
import { usePrefs } from "@/lib/prefs";
import "./DevPanel.css";

/**
 * Prototype controls (desktop only, outside the phone). Not part of the original app.
 * Lets reviewers flip theme / data / network and jump to any screen.
 */
export function DevPanel() {
  const p = usePrefs();
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <aside className="dp">
      <h2 className="dp-title">Prototype</h2>
      <p className="dp-path">{loc.pathname}</p>
      <Toggle label="Theme" value={p.theme} options={["light", "dark"]} onChange={(theme) => p.set({ theme })} />
      <Toggle label="Data" value={p.data} options={["real", "demo"]} onChange={(data) => p.set({ data })} />
      <Toggle label="Network" value={p.network} options={["online", "offline"]} onChange={(network) => p.set({ network })} />
      <button className="dp-link" onClick={() => nav("/__screens")}>All screens →</button>
    </aside>
  );
}

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="dp-row">
      <span>{label}</span>
      <div className="dp-seg">
        {options.map((o) => (
          <button key={o} data-on={o === value || undefined} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
