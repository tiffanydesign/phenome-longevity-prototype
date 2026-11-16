import { Icon } from "@/components/Icon";
import type { Device } from "./paired";

/* home devices as rounded line marks on a 24 grid, at the habit marks' weight */
const MARKS: Record<NonNullable<Device["mark"]>, JSX.Element> = {
  // a square platform with its readout window
  scale: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M9 8.6a4.5 4.5 0 0 1 6 0" />
      <path d="m12 10.4.9-1.4" />
    </>
  ),
  // a bowl on a low base
  kitchen: (
    <>
      <path d="M4 10h16a8 6 0 0 1-16 0z" />
      <path d="M6.5 19.5h11M9.5 16v3.5M14.5 16v3.5" />
    </>
  ),
  // a bottle with a cap and a water line
  bottle: (
    <>
      <path d="M10 2.8h4v2.6h-4z" />
      <path d="M9.4 5.4h5.2c1 1 1.9 2.2 1.9 3.8v9.3a2.7 2.7 0 0 1-2.7 2.7h-3.6a2.7 2.7 0 0 1-2.7-2.7V9.2c0-1.6.9-2.8 1.9-3.8z" />
      <path d="M7.5 13.2c1.5-.9 3-.9 4.5 0s3 .9 4.5 0" />
    </>
  ),
};

/** A device's mark: the app's own icon for wearables, a line mark for the rest. */
export function DeviceMark({ d, size = 22 }: { d: Device; size?: number }) {
  if (d.icon) return <Icon name={d.icon} size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {MARKS[d.mark!]}
    </svg>
  );
}
