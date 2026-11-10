import { useMemo, useState } from "react";
import { bookingActions, bookingClinic, bookingDay, bookingLabel, bookingTime, bookingWhen, useBooking, type Booking } from "@/data/booking-store";
import { VISITS } from "../study/data";
import { Chevron } from "../ui/icons";
import { BackBar, BlurLayers, useGo, V2Screen } from "../ui/shell";
import "./consult.css";

/** A calendar file for the session, so it lands in the member's own calendar. */
function calendarFile(b: Booking): string {
  const start = new Date(b.day + b.start * 60_000);
  const end = new Date(start.getTime() + b.minutes * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);
  const clinic = bookingClinic(b);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Phenome//Consultation//EN",
    "BEGIN:VEVENT",
    `DTSTART;TZID=${b.timezone}:${stamp(start)}`,
    `DTEND;TZID=${b.timezone}:${stamp(end)}`,
    `SUMMARY:${bookingLabel(b)}`,
    `LOCATION:${clinic.name}, ${clinic.address}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="cs-row">
      <span className="cs-row-k">{label}</span>
      <span className="cs-row-v">
        <b>{value}</b>
        {sub && <small>{sub}</small>}
      </span>
    </div>
  );
}

/**
 * The booked session at a glance: when first (the one thing a member checks),
 * then where and what it costs, then the three things they might do about it.
 * Cancelling asks twice, in place, rather than in a dialog.
 */
export function ConsultScreen() {
  const go = useGo();
  const b = useBooking();
  const [confirming, setConfirming] = useState(false);
  const ics = useMemo(() => (b ? calendarFile(b) : ""), [b]);

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="cs scroll">
        <header className="cs-bar">
          <BackBar />
        </header>

        {!b ? (
          <section className="cs-empty">
            <span className="cs-empty-mark" aria-hidden>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
            </span>
            <h1>No upcoming consultation</h1>
            <p>Book a session with your clinician to go through your results.</p>
            <button className="cs-primary" onClick={() => go("/v3/booking")}>
              Book a consultation
            </button>
          </section>
        ) : (
          <>
            <section className="cs-hero">
              <p className="cs-badges">
                <span className="cs-badge">Upcoming</span>
                <span className="cs-when">{bookingWhen(b)}</span>
              </p>
              <h1>{bookingLabel(b)}</h1>
            </section>

            {/* the date as a calendar leaf: the one thing a member comes back to check */}
            <section className="cs-date">
              <span className="cs-leaf" aria-hidden>
                <small>{bookingDay(b).month}</small>
                <b>{bookingDay(b).num}</b>
              </span>
              <span className="cs-date-t">
                <b>
                  {bookingDay(b).weekdayLong} {bookingDay(b).num} {bookingDay(b).monthLong}
                </b>
                <small>
                  {bookingTime(b)} · {b.minutes} min
                </small>
              </span>
            </section>

            <section className="cs-card" aria-label="Details">
              <Row label="Where" value={bookingClinic(b).name} sub={bookingClinic(b).address} />
              <Row label="Time zone" value={b.timezone.replace("_", " ")} />
              <Row label="Price" value={b.price} />
            </section>

            <button className="cs-card cs-link" onClick={(e) => go("/v3/twin", { from: e.currentTarget })}>
              <span className="cs-row-v">
                <b>Shared with your clinician</b>
                <small>Your digital twin and all {VISITS.length} visits</small>
              </span>
              <Chevron size={16} />
            </button>

            <div className="cs-actions">
              <a className="cs-primary" href={ics} download="consultation.ics">
                Add to calendar
              </a>
              <button className="cs-secondary" onClick={() => go("/v3/booking")}>
                Reschedule
              </button>
              <button
                className="cs-cancel"
                data-confirm={confirming ? "" : undefined}
                onClick={() => {
                  if (!confirming) return setConfirming(true);
                  bookingActions.cancel();
                  setConfirming(false);
                }}
                onBlur={() => setConfirming(false)}
              >
                {confirming ? "Tap again to cancel the booking" : "Cancel booking"}
              </button>
            </div>
          </>
        )}

        <button className="cs-all" onClick={() => go("/v3/consultations")}>
          All consultations
          <Chevron size={14} />
        </button>
      </div>
    </V2Screen>
  );
}
