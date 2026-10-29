import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import "./TabBar.css";

const TABS = [
  { to: "/home", label: "Home", icon: "Nav_Home" },
  { to: "/insights", label: "Insights", icon: "Nav_Insights" },
  { to: "/store", label: "Store", icon: "Nav_Store" },
  { to: "/profile", label: "Profile", icon: "Nav_Profile" },
];

/** Floating frosted-glass tab pill + separate Longevity AI button (capture: home/scroll_4). */
export function TabBar() {
  const nav = useNavigate();
  return (
    <div className="tb">
      <nav className="tb-pill glass">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className="tb-item" replace>
            <span className="tb-glow" aria-hidden />
            <Icon name={t.icon} size={22} />
            <span className="tb-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="tb-fab glass" aria-label="Longevity AI" onClick={() => nav("/assistant")}>
        <Icon name="Nav_LongevityAI" size={26} />
      </button>
    </div>
  );
}
