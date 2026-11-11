import { Toggle } from "@/components/DevPanel";
import { bookingActions, useBooking } from "@/data/booking-store";
import { PARTS, setWinsState, useToday, type WinsState } from "../habits/plan";
import { notes, useNotes } from "../notify/store";
import { setOmicsNew, useAnyUnseen } from "../omics/tests";
import { TOPICS } from "../omics/topics";
import { DAY_PARTS, setDayPart, useDayPart, useHour, type DayPart } from "./clock";

/*
 * The clinical edition's day-to-day states, for the review panel: what time
 * of day it is, how far the small wins have got, whether a consultation is
 * booked, and whether anything new is waiting. Each switch changes the
 * prototype's own stores, so the screens move with it.
 */

const PART_LABEL: Record<DayPart, string> = { live: "Live clock", morning: "Morning", afternoon: "Afternoon", evening: "Evening" };
const WINS_LABEL: Record<WinsState, string> = { fresh: "Not started", one: "One left", done: "All done" };
const WINS_NOTE: Record<WinsState, string> = {
  fresh: "Every card due now is waiting, swipe hint included",
  one: "One card left: finish it on Home to see the celebration",
  done: "Everything due is done, so Home leaves the module out",
};
const TOPIC_IDS = TOPICS.map((t) => t.id);

/** Where today's small wins stand, read back from the log, so the switch shows the real state. */
function useWinsState(): WinsState | null {
  const { asked } = useToday();
  const hour = useHour();
  const due = asked.filter((t) => t.h.source !== "band" && hour >= PARTS[t.h.part].from);
  const left = due.filter((t) => !t.done).length;
  if (left === 0) return "done";
  if (left === due.length && due.every((t) => t.count === 0)) return "fresh";
  if (left === 1) return "one";
  return null;
}

export function ScenarioControls() {
  const part = useDayPart();
  const hour = useHour();
  const wins = useWinsState();
  const booking = useBooking();
  const { list } = useNotes();
  const unread = list.some((n) => !n.read);
  const fresh = useAnyUnseen(TOPIC_IDS);

  return (
    <>
      <section className="dp-group">
        <h3>Home · today</h3>
        <Toggle label="Time of day" value={part} options={DAY_PARTS} labels={PART_LABEL} wrap onChange={setDayPart} />
        <Toggle label="Small wins" value={wins} options={["fresh", "one", "done"]} labels={WINS_LABEL} onChange={(s) => setWinsState(s, hour)} />
        {wins && <p className="dp-note">{WINS_NOTE[wins]}</p>}
        <Toggle
          label="Consultation"
          value={booking ? "booked" : "none"}
          options={["none", "booked"]}
          labels={{ none: "None booked", booked: "Upcoming" }}
          onChange={(v) => (v === "booked" ? bookingActions.seed() : bookingActions.cancel())}
        />
      </section>

      <section className="dp-group">
        <h3>Updates</h3>
        <Toggle
          label="Notifications"
          value={unread ? "new" : "read"}
          options={["new", "read"]}
          labels={{ new: "Unread", read: "All read" }}
          onChange={(v) => (v === "new" ? notes.reset() : notes.readAll())}
        />
        <Toggle
          label="Omics results"
          value={fresh ? "new" : "seen"}
          options={["new", "seen"]}
          labels={{ new: "New to open", seen: "All opened" }}
          onChange={(v) => setOmicsNew(v === "new", TOPIC_IDS)}
        />
      </section>
    </>
  );
}
