import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { ChevronLeft } from "@/components/NavHeader";
import { IcEdit, IcSave } from "./ProfileIcons";
import "./profile.css";

/**
 * Profile sub-page header: navy ‹ chevron, bold navy centred title, optional right action,
 * soft shadow under the bar (capture: profile_account/top, profile_faqs/top …).
 * Module-local because the shared NavHeader has no navy/bold variant with this shadow.
 */
export function PfHeader({ title, right, onBack }: { title: string; right?: ReactNode; onBack?: () => void }) {
  const nav = useNavigate();
  return (
    <header className="prf-hd">
      <button className="prf-hd-back" aria-label="Back" onClick={onBack ?? (() => nav(-1))}>
        <ChevronLeft size={26} />
      </button>
      <h1 className="prf-hd-title">{title}</h1>
      <div className="prf-hd-right">{right}</div>
    </header>
  );
}

/** Edit ↔ save toggle at (370, 75) — same button, icon swaps (capture: profile_lifestyle/edit). */
export function EditToggle({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button className="prf-hd-action" aria-label={editing ? "Save" : "Edit"} onClick={onToggle}>
      {editing ? <IcSave size={22} /> : <IcEdit size={25} />}
      {/* transparent text label so tests (click by text) and screen readers can reach the icon */}
      <span className="prf-hd-action-label">{editing ? "Save" : "Edit"}</span>
    </button>
  );
}

/** Standard profile sub-screen: header + body wrapped in .prf-root (scopes module colour vars). */
export function PfScreen({
  title,
  right,
  children,
  overlay,
  footer,
  bodyClassName,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  overlay?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <Screen header={<PfHeader title={title} right={right} />} overlay={overlay} footer={footer} bodyClassName={bodyClassName}>
      <div className="prf-root">{children}</div>
    </Screen>
  );
}

/** Read-only field: navy bold label above a pale rounded value box. */
export function ViewField({ label, value, tall = false }: { label: string; value: ReactNode; tall?: boolean }) {
  return (
    <div className="prf-field" data-tall={tall || undefined}>
      <span className="prf-field-label">{label}</span>
      <span className="prf-field-box">{value}</span>
    </div>
  );
}

/** Editable variant of ViewField (same geometry; box becomes an input). */
export function EditField({
  label,
  value,
  onChange,
  tall = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tall?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="prf-field" data-tall={tall || undefined}>
      <span className="prf-field-label">{label}</span>
      <span className="prf-field-box pf-field-edit">
        <input value={value === "—" ? "" : value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      </span>
    </label>
  );
}

/** Centered empty state: 85 px pale circle + navy glyph + grey line (profile_orders/top). */
export function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="prf-empty">
      <span className="prf-empty-icon">{icon}</span>
      <span className="prf-empty-text">{text}</span>
    </div>
  );
}

/** Option card with icon tile + radio (Appearance, Language). */
export function OptionCard({
  icon,
  title,
  sub,
  selected,
  onClick,
}: {
  icon: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button className="prf-opt" data-on={selected || undefined} onClick={onClick}>
      <span className="prf-opt-tile">{icon}</span>
      <span className="prf-opt-text">
        <span className="prf-opt-title">{title}</span>
        {sub && <span className="prf-opt-sub">{sub}</span>}
      </span>
      <span className="prf-opt-radio" aria-hidden>
        {selected && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
