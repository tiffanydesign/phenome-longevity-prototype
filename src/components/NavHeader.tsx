import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import "./NavHeader.css";

type Variant =
  /** "‹  Capacity" — chevron, centred light title (Capacity, Health Monitor, Diet Tracker…) */
  | "chevron"
  /** "←  Reports" — arrow, centred or left title (Reports, Order History, Personal Details…) */
  | "arrow"
  /** "←  Good afternoon, Tiffany / Genetic Insights   [Generate PDF]" — report hubs */
  | "greeting";

interface NavHeaderProps {
  variant?: Variant;
  title?: ReactNode;
  /** small grey line above the title (greeting variant) */
  eyebrow?: ReactNode;
  /** title alignment for the arrow variant ("left" = Reports) */
  align?: "center" | "left";
  right?: ReactNode;
  onBack?: () => void;
}

export function NavHeader({ variant = "chevron", title, eyebrow, align = "center", right, onBack }: NavHeaderProps) {
  const nav = useNavigate();
  const back = onBack ?? (() => nav(-1));
  return (
    <header className={`nh nh-${variant}`} data-align={align}>
      <button className="nh-back" onClick={back} aria-label="Back">
        {variant === "chevron" ? <ChevronLeft /> : <ArrowLeft />}
      </button>
      {variant === "greeting" ? (
        <div className="nh-greet">
          <span className="nh-eyebrow">{eyebrow}</span>
          <span className="nh-greet-title">{title}</span>
        </div>
      ) : (
        <h1 className="nh-title">{title}</h1>
      )}
      <div className="nh-right">{right}</div>
    </header>
  );
}

export function ChevronLeft({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowLeft({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 12H4m0 0l7-7m-7 7l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
