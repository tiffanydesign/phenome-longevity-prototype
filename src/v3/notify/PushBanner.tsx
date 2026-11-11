import { useEffect, useRef } from "react";
import { useGo } from "../ui/shell";
import { notes, useNotes } from "./store";
import "./notify.css";

/** A push that arrives while the app is open: it drops in from the top, and goes after a few seconds or on a swipe up. */
export function PushBanner() {
  const go = useGo();
  const { banner } = useNotes();
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => notes.dismiss(), 6000);
    return () => window.clearTimeout(t);
  }, [banner]);

  if (!banner) return null;
  return (
    <div
      className="nt-banner"
      role="status"
      data-field={banner.field}
      onPointerDown={(e) => (startY.current = e.clientY)}
      onPointerUp={(e) => {
        if (startY.current !== null && e.clientY - startY.current < -24) notes.dismiss();
        startY.current = null;
      }}
    >
      <button
        className="nt-banner-body"
        onClick={() => {
          notes.read(banner.id);
          go(banner.to);
        }}
      >
        <span className="nt-banner-app" aria-hidden>
          <img src={`${import.meta.env.BASE_URL}assets/icons/Logo_Big.svg`} alt="" />
        </span>
        <span className="nt-text">
          <span className="nt-meta">
            <b>Phenome</b>
            <time>now</time>
          </span>
          <strong>{banner.title}</strong>
          <span>{banner.body}</span>
        </span>
      </button>
      {/* a way to close it straight away, top right */}
      <button className="nt-banner-close" aria-label="Dismiss notification" onPointerDown={(e) => e.stopPropagation()} onClick={() => notes.dismiss()}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
