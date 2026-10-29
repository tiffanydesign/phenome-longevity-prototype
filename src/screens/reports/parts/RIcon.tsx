import type { CSSProperties } from "react";
import { photo } from "@/lib/asset";
import { ICONS, type RIconName } from "./iconSizes";

/**
 * Report-module icon: an alpha mask cropped 1:1 from the captures
 * (public/assets/photos/reports/icons, see iconSizes.ts) painted with currentColor,
 * so it follows the theme like the shared <Icon>. Sized to the captured ink box.
 * TODO(fidelity): these are Material-style glyphs the APK draws from an icon font we
 * don't have as SVG; crops are pixel-accurate at 3.25 DPR only.
 */
export function RIcon({ name, scale = 1, style, className }: { name: RIconName; scale?: number; style?: CSSProperties; className?: string }) {
  const [w, h] = ICONS[name];
  const url = `url("${photo(`reports/icons/${name}.png`)}")`;
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: w * scale,
        height: h * scale,
        backgroundColor: "currentColor",
        WebkitMask: `${url} center / 100% 100% no-repeat`,
        mask: `${url} center / 100% 100% no-repeat`,
        ...style,
      }}
    />
  );
}

/** Simple stroked chevrons / arrows used across report screens. */
export function Chevron({ dir = "right", size = 16, stroke = 2 }: { dir?: "right" | "down"; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ transform: dir === "down" ? "rotate(90deg)" : undefined, flexShrink: 0 }}>
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 9h11.5M9.5 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Good afternoon" greeting the hubs show (captures were taken at 13:xx). */
export function greeting(d = new Date()): string {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
