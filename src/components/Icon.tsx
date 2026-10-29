import type { CSSProperties } from "react";
import { icon } from "@/lib/asset";

/**
 * Monochrome icon from the app's own SVG set (public/assets/icons, extracted from the APK),
 * painted with currentColor through a CSS mask so it follows tokens and theme.
 */
export function Icon({ name, size = 22, style, className }: { name: string; size?: number; style?: CSSProperties; className?: string }) {
  const url = `url("${icon(name)}")`;
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: size,
        height: size,
        backgroundColor: "currentColor",
        WebkitMask: `${url} center / contain no-repeat`,
        mask: `${url} center / contain no-repeat`,
        ...style,
      }}
    />
  );
}
