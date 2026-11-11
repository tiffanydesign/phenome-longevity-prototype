import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { EDITION } from "@/lib/edition";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Overlay";
import { Button } from "@/components/Controls";
import { useDataset } from "@/lib/data";
import { profileData } from "@/data/profile";
import { ChevronLeft } from "@/components/NavHeader";
import { useNotes } from "@/v3/notify/store";
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

/** The redesign's devices, listed in the account as one more section. */
const DEVICES = [
  { label: "Phenome Ring", icon: "ring_icon" },
  { label: "Phenome Band", icon: "band_icon" },
];

/**
 * Profile tab — capture: tab_profile/top, tab_profile/scroll_1, dark_tab_profile/top.
 * `initialScroll` / `overlay` let the Privacy Policy route render this tab underneath its sheet.
 */
export function ProfileTab({ initialScroll = 0, overlay, page = false }: { initialScroll?: number; overlay?: ReactNode; page?: boolean }) {
  const d = useDataset(profileData);
  const nav = useNavigate();
  const base = EDITION === "v3" ? "/v3" : "/v2";
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
      tabs={!page}
      statusTone={page ? undefined : "light"}
      header={<ProfileLogo onBack={page ? () => nav(-1) : undefined} bell={page && EDITION === "v3" ? () => nav("/v3/notifications") : undefined} />}
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

        {page && (
          <section>
            <h2 className="prf-tab-section">Devices</h2>
            <div className="prf-tab-card">
              {DEVICES.map((d) => (
                <div key={d.label} className="prf-tab-row">
                  <span className="prf-tab-icon">
                    <Icon name={d.icon} size={22} />
                  </span>
                  <span className="prf-tab-label">{d.label}</span>
                  <span className="prf-tab-on">Connected</span>
                </div>
              ))}
              <button className="prf-tab-row" onClick={() => nav(`${base}/add-device`)}>
                <span className="prf-tab-icon prf-tab-plus" aria-hidden>
                  +
                </span>
                <span className="prf-tab-label">Add Device</span>
                <IcArrowRight size={20} />
              </button>
            </div>
          </section>
        )}

        {/* the clinical edition keeps consultations here as well as on Home */}
        {page && EDITION === "v3" && (
          <section>
            <h2 className="prf-tab-section">Clinic</h2>
            <div className="prf-tab-card">
              <button className="prf-tab-row" onClick={() => nav("/discover/consultations")}>
                <span className="prf-tab-icon" aria-hidden>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                    <path d="M3.5 10h17M8 3v4M16 3v4M8.5 14.5l2 2 4-4" />
                  </svg>
                </span>
                <span className="prf-tab-label">Consultations</span>
                <IcArrowRight size={20} />
              </button>
            </div>
          </section>
        )}

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

        {/* the page closes on a quiet sign-off rather than on the last button */}
        {EDITION === "v3" && (
          <footer className="prf-tab-foot">
            <Icon name="PL_Logo" size={28} style={{ height: 18, color: "var(--prf-section)" }} />
            <span>Phenome Longevity</span>
          </footer>
        )}
      </div>
    </Screen>
  );
}

function ProfileLogo({ onBack, bell }: { onBack?: () => void; bell?: () => void }) {
  return (
    <div className="prf-tab-logo">
      {onBack && (
        <button className="prf-tab-back" aria-label="Back" onClick={onBack}>
          <ChevronLeft />
        </button>
      )}
      <Icon name="PL_Logo" size={36} style={{ height: 24, color: "var(--prf-logo)" }} />
      {bell && <ProfileBell onOpen={bell} />}
    </div>
  );
}

/** The clinical edition keeps notifications behind the profile: a bell at its top right, with the unread count. */
function ProfileBell({ onOpen }: { onOpen: () => void }) {
  const { list } = useNotes();
  const unread = list.filter((n) => !n.read).length;
  return (
    <button className="prf-tab-bell" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} onClick={onOpen}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
        <path d="M10 20.5a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 && <i>{unread}</i>}
    </button>
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
