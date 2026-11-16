import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { DeviceMark } from "../devices/marks";
import { ALL_DEVICES, isLow } from "../devices/paired";
import "./devices-tile.css";

/** How many fit a half-width card: the lowest batteries first, so what needs charging is never cut. */
const SMALL = 3;

/**
 * My devices: every paired device as its mark inside a battery ring, the same
 * ring the header's device button draws, so the two read as one family.
 * Worn devices come first; a low battery turns its ring red and its number with it.
 */
export function DevicesTile({ onOpen }: { onOpen: (e: { currentTarget: HTMLElement }) => void }) {
  const low = ALL_DEVICES.filter(isLow);
  const byNeed = [...ALL_DEVICES].sort((a, b) => a.battery - b.battery);
  return (
    <button className="v2-tile dvt" data-field="mist" onClick={onOpen}>
      <span className="v2-tile-head">
        <span className="v2-kind">
          <Icon name="ring_icon" size={16} />
          <span>My devices</span>
          <svg className="v2-kind-go" width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden>
            <path d="M1.5 1.5 6.5 6.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {low.length > 0 && <span className="dvt-low">{low.length} to charge</span>}
      </span>
      <span className="dvt-row" data-wide="">
        {ALL_DEVICES.map((d) => (
          <Cell key={d.id} d={d} />
        ))}
      </span>
      <span className="dvt-row" data-small="">
        {byNeed.slice(0, SMALL).map((d) => (
          <Cell key={d.id} d={d} />
        ))}
      </span>
    </button>
  );
}

function Cell({ d }: { d: (typeof ALL_DEVICES)[number] }) {
  return (
    <span className="dvt-cell" data-low={isLow(d) ? "" : undefined} aria-label={`${d.name}, battery ${d.battery}%`}>
      <span className="dvt-ring" style={{ "--b": d.battery } as CSSProperties}>
        <svg className="dvt-arc" viewBox="0 0 44 44" aria-hidden>
          <circle cx="22" cy="22" r="19.5" pathLength={100} />
          <circle cx="22" cy="22" r="19.5" pathLength={100} strokeDasharray={`${d.battery} 100`} />
        </svg>
        <DeviceMark d={d} size={19} />
      </span>
      <b>{d.battery}%</b>
      <small>{d.short}</small>
    </span>
  );
}
