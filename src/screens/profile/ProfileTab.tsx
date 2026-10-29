import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Overlay";
import { Button } from "@/components/Controls";
import { useDataset } from "@/lib/data";
import { profileData } from "@/data/profile";
import {
  IcArrowRight,
  IcBox,
  IcCheckCircle,
  IcDumbbell,
  IcEye,
  IcGlobe,
  IcHeart,
  IcHelp,
  IcHistory,
  IcLock,
  IcPalette,
  IcPin,
  IcPower,
} from "./ProfileIcons";
import "./profile.css";
import "./ProfileTab.css";

interface Row {
  label: string;
  icon: ReactNode;
  to: string;
}

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Personal Information",
    rows: [
      { label: "Health History", icon: <IcHeart size={22} />, to: "/profile/health-history" },
      { label: "Lifestyle Habits", icon: <IcDumbbell size={26} />, to: "/profile/lifestyle" },
    ],
  },
  {
    title: "Order Information",
    rows: [
      { label: "Order History", icon: <IcBox size={26} />, to: "/profile/orders" },
      { label: "Past Activated Test", icon: <IcHistory size={22} />, to: "/profile/past-tests" },
      { label: "Activate New Test", icon: <IcCheckCircle size={22} />, to: "/profile/activate" },
    ],
  },
  {
    title: "Address & Security",
    rows: [
      { label: "Change Password", icon: <IcLock size={22} />, to: "/profile/password" },
      { label: "Saved Address", icon: <IcPin size={22} />, to: "/profile/address" },
      { label: "FAQs", icon: <IcHelp size={22} />, to: "/profile/faqs" },
      { label: "Privacy Policy", icon: <IcEye size={24} />, to: "/profile/privacy" },
    ],
  },
  {
    title: "General Settings",
    rows: [
      { label: "Appearance", icon: <IcPalette size={22} />, to: "/profile/appearance" },
      { label: "Language", icon: <IcGlobe size={22} />, to: "/profile/language" },
    ],
  },
];

/**
 * Profile tab — capture: tab_profile/top, tab_profile/scroll_1, dark_tab_profile/top.
 * `initialScroll` / `overlay` let the Privacy Policy route render this tab underneath its sheet.
 */
export function ProfileTab({ initialScroll = 0, overlay }: { initialScroll?: number; overlay?: ReactNode }) {
  const d = useDataset(profileData);
  const nav = useNavigate();
  const [logout, setLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!initialScroll) return;
    const root = ref.current?.closest("[data-scroll-root]");
    root?.scrollTo(0, initialScroll);
  }, [initialScroll]);

  const initials = `${d.user.firstName[0] ?? ""}${d.user.lastName[0] ?? ""}`;

  return (
    <Screen
      tabs
      statusTone="light"
      header={<ProfileLogo />}
      overlay={
        <>
          {overlay}
          <LogoutModal open={logout} onClose={() => setLogout(false)} />
        </>
      }
    >
      <div className="prf-root prf-tab" ref={ref}>
        <h1 className="prf-tab-title">My Account</h1>

        <button className="prf-tab-user" onClick={() => nav("/profile/details")}>
          <span className="prf-tab-avatar">{initials}</span>
          <span className="prf-tab-user-text">
            <span className="prf-tab-name">
              {d.user.firstName} {d.user.lastName}
            </span>
            <span className="prf-tab-email">{d.user.email}</span>
          </span>
          <IcArrowRight size={22} />
        </button>

        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="prf-tab-section">{s.title}</h2>
            <div className="prf-tab-card">
              {s.rows.map((r) => (
                <button key={r.label} className="prf-tab-row" onClick={() => nav(r.to)}>
                  <span className="prf-tab-icon">{r.icon}</span>
                  <span className="prf-tab-label">{r.label}</span>
                  <IcArrowRight size={20} />
                </button>
              ))}
            </div>
          </section>
        ))}

        <button className="prf-tab-card prf-tab-row prf-tab-logout" onClick={() => setLogout(true)}>
          <span className="prf-tab-icon">
            <IcPower size={22} />
          </span>
          <span className="prf-tab-label">Log Out</span>
        </button>
      </div>
    </Screen>
  );
}

function ProfileLogo() {
  return (
    <div className="prf-tab-logo">
      <Icon name="PL_Logo" size={36} style={{ height: 24, color: "var(--prf-logo)" }} />
    </div>
  );
}

/** TODO(fidelity): logout not captured (forbidden during capture) — confirm dialog is a best guess and does nothing. */
function LogoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} width={330}>
      <div className="prf-logout">
        <h3 className="prf-logout-title">Log Out</h3>
        <p className="prf-logout-text">Are you sure you want to log out?</p>
        <div className="prf-logout-actions">
          <Button tone="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button tone="navy" onClick={onClose}>
            Log Out
          </Button>
        </div>
      </div>
    </Modal>
  );
}
