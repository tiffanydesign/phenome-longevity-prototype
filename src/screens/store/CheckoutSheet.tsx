import { useState, type ReactNode } from "react";
import { StatusBar } from "@/components/PhoneFrame";
import { CHECKOUT_NAME } from "@/data/store";
import { SearchGlyph } from "./StoreScreen";
import "./CheckoutSheet.css";

/**
 * Delivery Address bottom sheet over the cart — capture: checkout/top, checkout/validation_error.
 * Module-local sheet (shared Sheet has fixed padding/radius that don't match this capture).
 */
export function CheckoutSheet({ onClose }: { onClose: () => void }) {
  const [address, setAddress] = useState("");
  const [line2, setLine2] = useState("");
  const [phone, setPhone] = useState("");
  const [tried, setTried] = useState(false);

  // The address only counts once picked from the (uncaptured) suggestions list.
  // TODO(fidelity): address autocomplete + payment step were not captured — a valid form does nothing.
  const verified = false;
  const phoneErr = tried && !phone.trim();
  const addrErr = tried && !verified;

  return (
    <div className="co" role="dialog" aria-modal>
      <button className="co-scrim" aria-label="Dismiss" onClick={onClose} />
      <div className="co-sheet scroll">
        <div className="co-head">
          <h2>Delivery Address</h2>
          <button className="co-close" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M2 2l14 14M16 2 2 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <Field label="Full Name" tag="Required">
          <div className="co-box co-static">{CHECKOUT_NAME}</div>
        </Field>

        <Field label="Search for address" tag="Required">
          <label className="co-box co-search" data-error={addrErr || undefined}>
            <SearchGlyph size={22} />
            <input value={address} placeholder="Enter street address" onChange={(e) => setAddress(e.target.value)} />
          </label>
        </Field>
        <p className="co-help">Search for your address and choose it from the list. The details below fill in automatically.</p>

        <div className="co-filled">
          <span className="co-filled-h">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1v11M2.5 7.5 7 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Filled in from your search
          </span>
          {["Address Line 1", "City", "Province / State", "Postal Code", "Country"].map((f) => (
            <span key={f} className="co-filled-row">
              {f}
            </span>
          ))}
        </div>

        <Field label="Address Line 2" tag="Optional">
          <label className="co-box">
            <input value={line2} placeholder="Apartment, suite, or floor" onChange={(e) => setLine2(e.target.value)} />
          </label>
        </Field>

        <Field label="Phone Number" tag="Required">
          <label className="co-box" data-error={phoneErr ? "strong" : undefined}>
            <input value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
          </label>
          {phoneErr && <span className="co-err">This field is required</span>}
        </Field>

        {addrErr && <p className="co-addr-err">Select a verified delivery address.</p>}

        <button className="co-cta" onClick={() => setTried(true)}>
          Continue to Payment
        </button>
      </div>
      {/* status icons stay drawn above the scrim and the full-height sheet (both captures) */}
      <div className="co-status">
        <StatusBar />
      </div>
    </div>
  );
}

function Field({ label, tag, children }: { label: string; tag: "Required" | "Optional"; children: ReactNode }) {
  return (
    <div className="co-field">
      <div className="co-label">
        <span>{label}</span>
        <span className="co-tag" data-opt={tag === "Optional" || undefined}>
          {tag}
        </span>
      </div>
      {children}
    </div>
  );
}
