import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { useDataset } from "@/lib/data";
import { consultationsData } from "@/data/discover";
import { CalendarX, Clock, Pin } from "./icons";
import "./Booking.css";
import "./Consultations.css";

/** Your Consultations — capture: consultations/top (empty account). */
export function ConsultationsScreen() {
  const nav = useNavigate();
  const list = useDataset(consultationsData);
  return (
    <Screen header={
        <div className="bk-hdr">
          <NavHeader variant="chevron" title="Your Consultations" />
        </div>
      }>
      <div className="cons">
        <button className="cons-book" onClick={() => nav("/discover/booking")}>
          Book Consultation
        </button>
        {list.length === 0 ? (
          <div className="cons-empty">
            <span className="cons-empty-icon">
              <CalendarX size={30} />
            </span>
            <p>You don't have any upcoming consultations.</p>
          </div>
        ) : (
          // TODO(fidelity): populated consultation card not captured — DEMO layout only.
          list.map((c) => (
            <div key={c.id} className="cons-card">
              <b>{c.type}</b>
              <span>
                <Pin size={15} /> {c.clinic}
              </span>
              <span>
                <Clock size={15} /> {c.when}
              </span>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}
