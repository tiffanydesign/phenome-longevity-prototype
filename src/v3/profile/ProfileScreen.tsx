import { useState, type ReactNode } from "react";
import { Modal } from "@/components/Overlay";
import { Icon } from "@/components/Icon";
import { useDataset } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { profileData } from "@/data/profile";
import { languageStore } from "@/screens/profile/SettingsScreens";
import { IcBox, IcCheckCircle, IcDumbbell, IcEye, IcGlobe, IcHeart, IcHelp, IcHistory, IcLock, IcPalette, IcPin } from "@/screens/profile/ProfileIcons";
import { useNotes } from "../notify/store";
import { Chevron } from "../ui/icons";
import { BackBar, BlurLayers, useGo, V2Screen } from "../ui/shell";
import { veilOnScroll } from "../devices/veil";
import "../devices/devices.css";
import "./profile.css";

interface Row {
  label: string;
  icon: ReactNode;
  to: string;
  /** a short value at the right, where the row has one */
  value?: string;
}

/**
 * Profile, ordered by how often a member needs each thing: who they are; their
 * health record; orders and tests; then settings, help and signing out.
 */
export function ProfileScreen() {
  const d = useDataset(profileData);
  const prefs = usePrefs();
  const language = languageStore.use();
  const go = useGo();
  const { list } = useNotes();
  const [logout, setLogout] = useState(false);

  const unread = list.filter((n) => !n.read).length;
  const initials = `${d.user.firstName[0] ?? ""}${d.user.lastName[0] ?? ""}`;

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Health record",
      rows: [
        { label: "Health history", icon: <IcHeart size={20} />, to: "/v3/profile/health-history" },
        { label: "Lifestyle habits", icon: <IcDumbbell size={22} />, to: "/v3/profile/lifestyle" },
        { label: "Consultations", icon: <CalendarMark />, to: "/v3/consultations" },
      ],
    },
    {
      title: "Orders and tests",
      rows: [
        { label: "Activate a new test", icon: <IcCheckCircle size={20} />, to: "/v3/profile/activate" },
        { label: "Activated tests", icon: <IcHistory size={20} />, to: "/v3/profile/tests" },
        { label: "Order history", icon: <IcBox size={22} />, to: "/v3/profile/orders" },
      ],
    },
    {
      title: "Settings",
      rows: [
        { label: "Appearance", icon: <IcPalette size={20} />, to: "/v3/profile/appearance", value: prefs.theme === "dark" ? "Dark" : "Light" },
        { label: "Language", icon: <IcGlobe size={20} />, to: "/v3/profile/language", value: language },
        { label: "Saved addresses", icon: <IcPin size={20} />, to: "/v3/profile/address" },
        { label: "Change password", icon: <IcLock size={20} />, to: "/v3/profile/password" },
      ],
    },
    {
      title: "Help",
      rows: [
        { label: "FAQs", icon: <IcHelp size={20} />, to: "/v3/profile/faqs" },
        { label: "Privacy policy", icon: <IcEye size={22} />, to: "/v3/profile/privacy" },
      ],
    },
  ];

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="dv scroll pf" onScroll={veilOnScroll}>
        <header className="dv-bar pf-bar">
          <BackBar />
          <button className="pf-round" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} onClick={(e) => go("/v3/notifications", { from: e.currentTarget })}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
              <path d="M10 20.5a2 2 0 0 0 4 0" />
            </svg>
            {unread > 0 && <i>{unread}</i>}
          </button>
        </header>

        {/* 1 · who */}
        <button className="pf-me" onClick={(e) => go("/v3/profile/details", { from: e.currentTarget })}>
          <span className="pf-avatar" aria-hidden>
            {initials}
          </span>
          <span className="pf-me-t">
            <b>
              {d.user.firstName} {d.user.lastName}
            </b>
            <small>{d.user.email}</small>
            <span className="pf-me-edit">Personal details</span>
          </span>
          <Chevron size={16} />
        </button>

        {groups.map((g) => (
          <section key={g.title} className="dv-sec">
            <h2 className="dv-h">{g.title}</h2>
            <div className="dv-group">
              {g.rows.map((r) => (
                <button key={r.label} className="pf-row" onClick={(e) => go(r.to, { from: e.currentTarget })}>
                  <span className="pf-row-mark" aria-hidden>
                    {r.icon}
                  </span>
                  <span className="pf-row-t">{r.label}</span>
                  {r.value && <em>{r.value}</em>}
                  <Chevron size={14} />
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="dv-group pf-out">
          <button className="pf-row" onClick={() => setLogout(true)}>
            <span className="pf-row-t">Log out</span>
          </button>
        </div>

        <footer className="pf-foot">
          <Icon name="PL_Logo" size={28} style={{ height: 18 }} />
          <span>Phenome Longevity</span>
        </footer>
      </div>

      <Modal open={logout} onClose={() => setLogout(false)} width={320}>
        <div className="pf-modal">
          <h3>Log out?</h3>
          <p>Your data stays in your account. Sign in again any time to pick up where you left off.</p>
          <div>
            <button onClick={() => setLogout(false)}>Cancel</button>
            <button data-danger="" onClick={() => setLogout(false)}>
              Log out
            </button>
          </div>
        </div>
      </Modal>
    </V2Screen>
  );
}

function CalendarMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M8.5 14.5l2 2 4-4" />
    </svg>
  );
}
