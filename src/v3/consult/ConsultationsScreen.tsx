import { bookingDay, bookingLabel, bookingTime, useBooking } from "@/data/booking-store";
import { Chevron } from "../ui/icons";
import { BackBar, BlurLayers, useGo, V2Screen } from "../ui/shell";
import "../home/home.css";
import "./consult.css";

/** A past session, as the clinic's calendar keeps it. Demo records for the prototype. */
interface Past {
  date: string;
  month: string;
  day: string;
  year: string;
  type: string;
  topic: string;
  who: string;
  where: string;
  time: string;
  status: "done" | "cancelled" | "missed";
  /** a written summary from the clinician */
  notes?: boolean;
}

const PAST: Past[] = [
  { date: "Wed 12 Aug", month: "Aug", day: "12", year: "2026", type: "In person", topic: "Visit 4 results review", who: "Longevity physician", where: "Stockholm Clinic", time: "10:00–10:45", status: "done", notes: true },
  { date: "Thu 18 Jun", month: "Jun", day: "18", year: "2026", type: "Video", topic: "Sleep follow-up", who: "Health coach", where: "Video call", time: "16:30–17:00", status: "done", notes: true },
  { date: "Tue 26 May", month: "May", day: "26", year: "2026", type: "Video", topic: "Nutrition plan", who: "Nutritionist", where: "Video call", time: "09:00–09:30", status: "cancelled" },
  { date: "Fri 15 May", month: "May", day: "15", year: "2026", type: "In person", topic: "Visit 3 results review", who: "Longevity physician", where: "Stockholm Clinic", time: "11:00–11:45", status: "done", notes: true },
  { date: "Mon 30 Mar", month: "Mar", day: "30", year: "2026", type: "Video", topic: "Blood pressure check-in", who: "Longevity physician", where: "Video call", time: "08:30–08:45", status: "missed" },
  { date: "Thu 12 Feb", month: "Feb", day: "12", year: "2026", type: "In person", topic: "Visit 2 results review", who: "Longevity physician", where: "Stockholm Clinic", time: "14:00–14:45", status: "done", notes: true },
  { date: "Fri 21 Nov", month: "Nov", day: "21", year: "2025", type: "Clinic journey", topic: "Visit 1 onboarding", who: "Clinic team", where: "Stockholm Clinic", time: "09:00–10:30", status: "done", notes: true },
];

const STATUS: Record<Past["status"], string> = { done: "Completed", cancelled: "Cancelled", missed: "Missed" };

/**
 * Every consultation in one place: the next one first, on its own, then the
 * history newest first and grouped by year. Each past session says how it
 * ended and whether the clinician left a written summary.
 */
export function ConsultationsScreen() {
  const go = useGo();
  const b = useBooking();
  const years = [...new Set(PAST.map((p) => p.year))];

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="cs scroll">
        <header className="cs-bar cs-bar-row">
          <BackBar />
          <button className="cs-book" onClick={() => go("/v3/booking")}>
            Book
          </button>
        </header>

        <section className="cs-hero">
          <h1>Consultations</h1>
          <p className="cs-lead">
            {PAST.filter((p) => p.status === "done").length} completed · {b ? "1 upcoming" : "none upcoming"}
          </p>
        </section>

        <h2 className="cs-h">Upcoming</h2>
        {b ? (
          <button className="cs-item cs-item-next" onClick={(e) => go("/v3/consultation", { from: e.currentTarget })}>
            <span className="cs-leaf" aria-hidden>
              <small>{bookingDay(b).month}</small>
              <b>{bookingDay(b).num}</b>
            </span>
            <span className="cs-item-t">
              <span className="cs-item-row">
                <b>{bookingLabel(b)}</b>
                <span className="v2-svc-badge">Upcoming</span>
              </span>
              <small>
                {bookingDay(b).weekdayLong} {bookingDay(b).num} {bookingDay(b).monthLong} · {bookingTime(b)}
              </small>
            </span>
            <Chevron size={16} />
          </button>
        ) : (
          <button className="cs-item cs-item-none" onClick={() => go("/v3/booking")}>
            <span className="cs-item-t">
              <b>Nothing booked</b>
              <small>Book a session with your clinician</small>
            </span>
            <Chevron size={16} />
          </button>
        )}

        {years.map((y) => (
          <section key={y} aria-label={y}>
            <h2 className="cs-h">{y === years[0] ? `Past · ${y}` : y}</h2>
            <div className="cs-list">
              {PAST.filter((p) => p.year === y).map((p) => (
                <div key={p.date + p.year} className="cs-item" data-status={p.status}>
                  <span className="cs-leaf cs-leaf-past" aria-hidden>
                    <small>{p.month}</small>
                    <b>{p.day}</b>
                  </span>
                  <span className="cs-item-t">
                    <b>{p.topic}</b>
                    <small>
                      {p.type} · {p.who}
                    </small>
                    <small>
                      {p.time} · {p.where}
                    </small>
                  </span>
                  <span className="cs-state">
                    <em data-status={p.status}>{STATUS[p.status]}</em>
                    {p.notes && <small>Summary</small>}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </V2Screen>
  );
}
