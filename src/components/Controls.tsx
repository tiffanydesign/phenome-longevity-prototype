import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import "./Controls.css";

type Tone = "navy" | "black" | "outline" | "soft" | "disabled";

/** Full-width CTA. navy = "View Report"/"Proceed to Checkout", black = "COMPLETE"/"Play Now". */
export function Button({
  tone = "navy",
  block = true,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; block?: boolean }) {
  return (
    <button className={`btn btn-${tone}${block ? " btn-block" : ""} ${className ?? ""}`} {...rest}>
      {children}
    </button>
  );
}

/** D / W / M / 6M / Y period switcher (monitor, diet, habits, activity). */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o} className="seg-item" data-active={o === value || undefined} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function TextField({ label, hint, error, right, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode; hint?: ReactNode; error?: ReactNode; right?: ReactNode }) {
  return (
    <label className="tf">
      {(label || hint) && (
        <span className="tf-top">
          <span className="tf-label">{label}</span>
          {hint && <span className="tf-hint">{hint}</span>}
        </span>
      )}
      <span className="tf-box" data-error={error ? "" : undefined}>
        <input {...rest} />
        {right}
      </span>
      {error && <span className="tf-error">{error}</span>}
    </label>
  );
}

/** − 0 + quantity stepper (product footer, cart rows). */
export function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="stp">
      <button className="stp-btn" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      <span className="stp-val">{value}</span>
      <button className="stp-btn" aria-label="Increase" onClick={() => onChange(value + 1)}>
        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

export function PlusCircle({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12.5" stroke="currentColor" strokeWidth="2" />
      <path d="M14 8.5v11M8.5 14h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
