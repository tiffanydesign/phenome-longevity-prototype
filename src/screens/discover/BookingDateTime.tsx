import { TIMEZONE } from "@/data/discover";
import { Globe } from "./icons";
import { addDays, dayNum, month, slotLabel, slotsFor, weekday, type WallNow } from "./bookingTime";

const DAYS_AHEAD = 14;

/** Step 3 — date chips + slot grid. Captures: booking/datetime, booking/slot_selected. */
export function BookingDateTime({
  now,
  duration,
  day,
  slot,
  onDay,
  onSlot,
}: {
  now: WallNow;
  duration: number;
  day: number;
  slot: number | null;
  onDay: (d: number) => void;
  onSlot: (s: number) => void;
}) {
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(now.day, i));
  const slots = slotsFor(day, now, duration);
  return (
    <>
      <h2 className="bk-h">Consultations Date &amp; Time</h2>
      <p className="bk-tz">
        <Globe size={16} /> {TIMEZONE}
      </p>
      <div className="bk-days scroll">
        {days.map((d) => (
          <button key={d} className="bk-day" data-on={d === day || undefined} onClick={() => onDay(d)}>
            <span>{weekday(d)}</span>
            <b>{dayNum(d)}</b>
            <span>{month(d)}</span>
          </button>
        ))}
      </div>
      <div className="bk-slots">
        {slots.map((s) => (
          <button key={s} className="bk-slot" data-on={s === slot || undefined} onClick={() => onSlot(s)}>
            {slotLabel(s, duration)}
          </button>
        ))}
        {/* TODO(fidelity): empty-day state not captured */}
        {slots.length === 0 && <p className="bk-noslots">No available times</p>}
      </div>
    </>
  );
}
