import type { ReactNode } from "react";
import { CHECKOUT_NAME } from "@/data/store";
import { sek } from "../ProductScreen";
import { arrival, PAY, SHIP, suggest, type PayId, type ShipId } from "./data";
import type { Delivery } from "./CheckoutScreen";

/*
 * The three steps and their shared frame. Every step is one white card with
 * the same head: a number disc (a tick once done), the title, and at right
 * either nothing, or Edit. Inside, every choice is a row on one grid
 * (mark · words · value), so radios, prices and dates align down the page.
 */

type State = "open" | "done" | "next";

export function Step({ n, title, state, summary, onEdit, children }: { n: number; title: string; state: State; summary?: string[]; onEdit: () => void; children: ReactNode }) {
  return (
    <li className="co3-step" data-state={state}>
      <div className="co3-step-head">
        <span className="co3-num" aria-hidden>
          {state === "done" ? <Tick /> : n}
        </span>
        <h2>{title}</h2>
        {state === "done" && (
          <button className="co3-edit" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`}>
            Edit
          </button>
        )}
      </div>
      {state === "done" && summary && (
        <p className="co3-sum">
          {summary.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </p>
      )}
      {state === "open" && <div className="co3-step-body">{children}</div>}
    </li>
  );
}

/** Address: search first; a picked address shows as a block with Change. Then the optional line and the phone. */
export function AddressStep({ d, set, tried, phoneOk }: { d: Delivery; set: (p: Partial<Delivery>) => void; tried: boolean; phoneOk: boolean }) {
  const hits = d.address ? [] : suggest(d.query);
  const addrErr = tried && !d.address;
  const phoneErr = tried && !phoneOk;
  return (
    <div className="co3-form">
      <div className="co3-field">
        <span className="co3-label">Recipient</span>
        <span className="co3-value">{CHECKOUT_NAME}</span>
      </div>

      {d.address ? (
        <div className="co3-field co3-picked">
          <span className="co3-label">Address</span>
          <span className="co3-addr">
            <b>{d.address.line1}</b>
            <small>
              {d.address.postal} {d.address.city}, {d.address.country}
            </small>
          </span>
          <button className="co3-change" onClick={() => set({ address: null })}>
            Change
          </button>
        </div>
      ) : (
        <div className="co3-field" data-error={addrErr || undefined}>
          <label className="co3-label" htmlFor="co3-q">
            Address
          </label>
          <span className="co3-search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input id="co3-q" value={d.query} autoComplete="off" placeholder="Start typing your street" onChange={(e) => set({ query: e.target.value })} />
          </span>
          {hits.length > 0 && (
            <ul className="co3-hits" role="listbox" aria-label="Suggested addresses">
              {hits.map((a) => (
                <li key={a.line1 + a.postal}>
                  <button role="option" aria-selected={false} onClick={() => set({ address: a, query: a.line1 })}>
                    <b>{a.line1}</b>
                    <small>
                      {a.postal} {a.city}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {d.query.trim().length >= 2 && hits.length === 0 && <span className="co3-hint">No match yet. Try the street name only, e.g. "Sveavägen".</span>}
          {addrErr && <span className="co3-err">Pick your address from the suggestions.</span>}
        </div>
      )}

      <div className="co3-field">
        <label className="co3-label" htmlFor="co3-l2">
          Apartment, floor or c/o <em>Optional</em>
        </label>
        <input id="co3-l2" className="co3-input" value={d.line2} placeholder="e.g. 3 tr" onChange={(e) => set({ line2: e.target.value })} />
      </div>

      <div className="co3-field" data-error={phoneErr || undefined}>
        <label className="co3-label" htmlFor="co3-ph">
          Mobile number
        </label>
        <input id="co3-ph" className="co3-input" inputMode="tel" value={d.phone} placeholder="07X XXX XX XX" onChange={(e) => set({ phone: e.target.value })} />
        {phoneErr ? <span className="co3-err">Add a mobile number so the courier can reach you.</span> : <span className="co3-hint">Only used for delivery updates.</span>}
      </div>
    </div>
  );
}

/** Delivery: two rows, the arrival date leading, the price at right. */
export function ShipStep({ value, onChange }: { value: ShipId; onChange: (v: ShipId) => void }) {
  return (
    <div className="co3-opts" role="radiogroup" aria-label="Delivery">
      {SHIP.map((s) => (
        <button key={s.id} role="radio" aria-checked={value === s.id} className="co3-opt" onClick={() => onChange(s.id)}>
          <Radio on={value === s.id} />
          <span className="co3-opt-t">
            <b>{arrival(s.days)}</b>
            <small>
              {s.name} · {s.days[0] === s.days[1] ? "next working day" : `${s.days[0]}–${s.days[1]} working days`}
            </small>
          </span>
          <em>{sek(s.price)}</em>
        </button>
      ))}
    </div>
  );
}

/** Payment: the saved card first, then the other ways to pay. */
export function PayStep({ value, onChange }: { value: PayId; onChange: (v: PayId) => void }) {
  return (
    <div className="co3-opts" role="radiogroup" aria-label="Payment">
      {PAY.map((p) => (
        <button key={p.id} role="radio" aria-checked={value === p.id} className="co3-opt" onClick={() => onChange(p.id)}>
          <Radio on={value === p.id} />
          <span className="co3-opt-t">
            <b>{p.name}</b>
            <small>{p.note}</small>
          </span>
          <span className="co3-pay-mark" data-pay={p.id} aria-hidden>
            <PayMark id={p.id} />
          </span>
        </button>
      ))}
    </div>
  );
}

function Radio({ on }: { on: boolean }) {
  return <span className="co3-radio" data-on={on || undefined} aria-hidden />;
}

function Tick() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function PayMark({ id }: { id: PayId }) {
  if (id === "card")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19M6.5 15h4" />
      </svg>
    );
  if (id === "swish")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2.5" width="12" height="19" rx="3" />
        <path d="M10.5 18.5h3" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5h9l4 4v15H6z" />
      <path d="M14.5 2.5v4.5H19M9.5 12h6M9.5 16h4" />
    </svg>
  );
}
