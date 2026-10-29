import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDataset } from "@/lib/data";
import { profileData, PASSWORD_RULES } from "@/data/profile";
import { EmptyState, PfScreen } from "./ProfileKit";
import { IcArrowRight, IcBox, IcEyeOff, IcEye, IcLock, IcTestTube } from "./ProfileIcons";
import "./FormScreens.css";

/** Order History — capture: profile_orders/top ("No orders yet"). */
export function OrdersScreen() {
  const d = useDataset(profileData);
  return (
    <PfScreen title="Order History">
      {d.orders.length === 0 ? (
        <EmptyState icon={<IcBox size={44} />} text="No orders yet" />
      ) : (
        // DEMO list layout — TODO(fidelity): populated order list never captured.
        <div className="prf-list">
          {d.orders.map((o) => (
            <div key={o.id} className="prf-list-item">
              <b>{o.title}</b>
              <span>
                {o.id} · {o.date} · {o.total}
              </span>
              <span>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </PfScreen>
  );
}

/** Past Activated Tests — capture: profile_past_tests/top ("No activated tests yet"). */
export function PastTestsScreen() {
  const d = useDataset(profileData);
  return (
    <PfScreen title="Past Activated Tests">
      {d.pastTests.length === 0 ? (
        <EmptyState icon={<IcTestTube size={38} />} text="No activated tests yet" />
      ) : (
        // DEMO list layout — TODO(fidelity): populated test list never captured.
        <div className="prf-list">
          {d.pastTests.map((t) => (
            <div key={t.id} className="prf-list-item">
              <b>{t.name}</b>
              <span>
                {t.id} · activated {t.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </PfScreen>
  );
}

/**
 * Activate Test — capture: profile_activate_test/top, invalid_code (code "ABC123").
 * Deep-link for tests: ?code=ABC123&submit=1 renders the submitted state.
 */
export function ActivateTestScreen() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [error, setError] = useState(params.get("submit") === "1" && !!params.get("code"));
  // TODO(fidelity): no valid kit code available — every non-empty code is rejected like the captured "ABC123".
  const submit = () => setError(code.trim().length > 0);
  return (
    <PfScreen title="Activate Test">
      <div className="prf-act">
        <h2 className="prf-act-title">
          Activate New <b>Kit</b>
        </h2>
        <p className="prf-act-sub">Enter your kit activation code to get started with your test.</p>
        <span className="prf-field-label prf-act-label">Activation Code</span>
        <input
          className="prf-act-input"
          data-error={error || undefined}
          value={code}
          autoFocus={error}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(false);
          }}
        />
        {error && <span className="prf-act-error">Invalid activation code</span>}
        <button className="prf-btn prf-act-btn" onClick={submit}>
          Activate New Kit <IcArrowRight size={18} />
        </button>
      </div>
    </PfScreen>
  );
}

/**
 * Change Password — capture: profile_change_password/top, typing_weak ("abc": only the lowercase rule ticks).
 * Deep-link for tests: ?pw=abc pre-fills the new password. The on-screen keyboard is not drawn.
 */
export function ChangePasswordScreen() {
  const [params] = useSearchParams();
  const [pw, setPw] = useState(params.get("pw") ?? "");
  const [confirm, setConfirm] = useState("");
  return (
    <PfScreen title="Change Password">
      <div className="prf-pw">
        <PwField label="New Password" placeholder="Enter a new password" value={pw} onChange={setPw} focused={!!params.get("pw")} />
        <span className="prf-pw-needs">Your password needs</span>
        <ul className="prf-pw-rules">
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(pw);
            return (
              <li key={r.label} data-ok={ok || undefined}>
                <span className="prf-pw-dot">
                  {ok && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {r.label}
              </li>
            );
          })}
        </ul>
        <PwField label="Confirm New Password" placeholder="Re-enter your new password" value={confirm} onChange={setConfirm} />
        {/* TODO(fidelity): submit / mismatch / success states not captured — button is inert. */}
        <button className="prf-btn prf-pw-btn">Change Password</button>
      </div>
    </PfScreen>
  );
}

function PwField({
  label,
  placeholder,
  value,
  onChange,
  focused,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  focused?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="prf-pw-field">
      <span className="prf-pw-label">{label}</span>
      <span className="prf-pw-box">
        <IcLock size={20} />
        <input
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoFocus={focused}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="prf-pw-eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
          {show ? <IcEye size={24} /> : <IcEyeOff size={24} />}
        </button>
      </span>
    </label>
  );
}
