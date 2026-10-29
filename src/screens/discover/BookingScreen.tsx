import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { CLINICS, CONSULT_TYPES, DURATIONS, PRICE, TIMEZONE, type ConsultTypeId } from "@/data/discover";
import { Clock, Globe, PersonPin, Pin, Radio, Route, Timer, Video } from "./icons";
import { BookingDateTime } from "./BookingDateTime";
import { longDate, slotLabel, wallNow } from "./bookingTime";
import "./Booking.css";

const TYPE_ICON: Record<ConsultTypeId, ReactNode> = {
  journey: <Route size={20} />,
  video: <Video size={20} />,
  inperson: <PersonPin size={20} />,
};

/**
 * Book Consultation — 4-step flow in one route. Captures: booking/top, type_selected,
 * clinic_selected (step 1), duration (2), datetime + slot_selected (3), review (4).
 */
export function BookingScreen() {
  const nav = useNavigate();
  const now = useMemo(wallNow, []);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<ConsultTypeId | null>(null);
  const [clinic, setClinic] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [day, setDay] = useState(now.day);
  const [slot, setSlot] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const back = () => (step === 0 ? nav(-1) : setStep(step - 1));
  const typeLabel = CONSULT_TYPES.find((t) => t.id === type)?.label ?? "";
  const clinicName = CLINICS.find((c) => c.id === clinic)?.name ?? "";

  return (
    <Screen
      header={
        <div className="bk-hdr">
          <NavHeader variant="chevron" title="Book Consultation" onBack={back} />
        </div>
      }
      overlay={
        // TODO(fidelity): post-confirm screen not captured (Confirm booking was not tapped) — simple toast.
        done && <div className="bk-toast">Consultation booked</div>
      }
    >
      <div className="bk">
        <div className="bk-progress" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} data-on={i <= step || undefined} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h2 className="bk-h">Please select a consultation type</h2>
            {CONSULT_TYPES.map((t) => (
              <OptionCard key={t.id} icon={TYPE_ICON[t.id]} on={type === t.id} onClick={() => setType(t.id)}>
                <b className="bk-opt-title">{t.label}</b>
              </OptionCard>
            ))}
            {type && (
              <>
                <h2 className="bk-h bk-h-sub">Where are you located</h2>
                {CLINICS.map((c) => (
                  <OptionCard key={c.id} icon={<Pin size={20} />} on={clinic === c.id} onClick={() => setClinic(c.id)} tall>
                    <b className="bk-opt-title">{c.name}</b>
                    <span className="bk-opt-sub">
                      {c.address} · {c.km}
                    </span>
                  </OptionCard>
                ))}
              </>
            )}
            <Continue disabled={!type || !clinic} onClick={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="bk-h">Duration</h2>
            {DURATIONS.map((d) => (
              <OptionCard key={d} icon={<Timer size={20} />} on={duration === d} onClick={() => setDuration(d)} dur>
                <b className="bk-opt-title">{d} min</b>
                <span className="bk-opt-sub">{PRICE}</span>
              </OptionCard>
            ))}
            <Continue disabled={!duration} onClick={() => setStep(2)} />
          </>
        )}

        {step === 2 && duration && (
          <>
            <BookingDateTime
              now={now}
              duration={duration}
              day={day}
              slot={slot}
              onDay={(d) => {
                setDay(d);
                setSlot(null);
              }}
              onSlot={setSlot}
            />
            <Continue disabled={slot === null} onClick={() => setStep(3)} />
          </>
        )}

        {step === 3 && duration && slot !== null && (
          <>
            <h2 className="bk-h">Review</h2>
            <div className="bk-review">
              <div className="bk-review-head">
                <span className="bk-icon bk-icon-on">{type && TYPE_ICON[type]}</span>
                <b>{typeLabel}</b>
              </div>
              <div className="bk-review-rows">
                <span>
                  <Pin size={16} /> {clinicName}
                </span>
                <span>
                  <Clock size={16} /> {longDate(day)} · {slotLabel(slot, duration)}
                </span>
                <span className="bk-review-tz">
                  <Globe size={16} /> {TIMEZONE}
                </span>
              </div>
              <div className="bk-review-price">{PRICE}</div>
            </div>
            <button className="bk-continue" onClick={() => setDone(true)}>
              Confirm booking
            </button>
          </>
        )}
      </div>
    </Screen>
  );
}

function OptionCard({ icon, on, onClick, tall, dur, children }: { icon: ReactNode; on: boolean; onClick: () => void; tall?: boolean; dur?: boolean; children: ReactNode }) {
  return (
    <button className={`bk-opt${tall ? " bk-opt-tall" : ""}${dur ? " bk-opt-dur" : ""}`} data-on={on || undefined} onClick={onClick}>
      <span className="bk-icon">{icon}</span>
      <span className="bk-opt-text">{children}</span>
      <span className="bk-radio">
        <Radio on={on} size={21} />
      </span>
    </button>
  );
}

function Continue({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button className="bk-continue" disabled={disabled} onClick={onClick}>
      Continue
    </button>
  );
}
