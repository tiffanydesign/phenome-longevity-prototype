import { useEffect, useState } from "react";
import { useDataset } from "@/lib/data";
import { DASH, LIFESTYLE_OPTIONS, PASSWORD_RULES, profileData, type Address, type HealthHistory, type Lifestyle } from "@/data/profile";
import { addressStore, healthStore } from "@/screens/profile/DetailScreens";
import { lifestyleStore } from "@/screens/profile/LifestyleScreen";
import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import { EditPill, Empty, Fields, Group, PrimaryButton, SubPage, Tick, Toast, useEdit } from "./kit";

/* ---------------------------------------------------------------- health history */

export function HealthHistoryPage() {
  const d = useDataset(profileData);
  const e = useEdit<HealthHistory>(healthStore.use() ?? d.health, healthStore.set);
  return (
    <SubPage title="Health history" lead="Your clinician reads this before each visit." right={<EditPill editing={e.editing} onToggle={e.toggle} />}>
      <Group title="Habits">
        <Fields<HealthHistory> rows={[["Smoking", "smoking"], ["Alcohol", "alcohol"]]} value={e.v} editing={e.editing} onChange={e.set} />
      </Group>
      <Group title="Conditions and medicines" note="Add anything a clinician should know, even if it seems minor.">
        <Fields<HealthHistory>
          rows={[
            ["Chronic conditions", "chronic"],
            ["Medical history", "medical"],
            ["Regular medicines", "medications"],
          ]}
          value={e.v}
          editing={e.editing}
          onChange={e.set}
        />
      </Group>
    </SubPage>
  );
}

/* ---------------------------------------------------------------- lifestyle */

const LS: { title: string; key: "activity" | "water" | "sleep"; unit: string }[] = [
  { title: "Daily activity", key: "activity", unit: "of movement a day" },
  { title: "Water", key: "water", unit: "a day" },
  { title: "Sleep", key: "sleep", unit: "a night" },
];

function useToast(): [string | null, (t: string) => void] {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    const t = window.setTimeout(() => setText(null), 2400);
    return () => window.clearTimeout(t);
  }, [text]);
  return [text, setText];
}

export function LifestylePage() {
  const d = useDataset(profileData);
  const [toast, say] = useToast();
  const e = useEdit<Lifestyle>(lifestyleStore.use() ?? d.lifestyle, (v) => {
    lifestyleStore.set(v);
    say("Saved");
  });
  const set = (k: "activity" | "water" | "sleep", o: string) => e.set({ [k]: e.v[k] === o ? DASH : o } as Partial<Lifestyle>);
  const goal = (g: string) => e.set({ goals: e.v.goals.includes(g) ? e.v.goals.filter((x) => x !== g) : [...e.v.goals, g] });

  return (
    <SubPage
      title="Lifestyle"
      lead="A starting point for your habits and the goals your plan works toward."
      right={<EditPill editing={e.editing} onToggle={e.toggle} />}
      overlay={<Toast text={toast} />}
    >
      {e.editing ? (
        <>
          {LS.map((g) => (
            <Group key={g.key} title={g.title}>
              <div className="pf-seg" role="radiogroup" aria-label={g.title}>
                {LIFESTYLE_OPTIONS[g.key].map((o) => (
                  <button key={o} role="radio" aria-checked={e.v[g.key] === o} onClick={() => set(g.key, o)}>
                    {o}
                  </button>
                ))}
              </div>
            </Group>
          ))}
          <Group title="Goals" note="Pick as many as you like.">
            <div className="pf-chips">
              {LIFESTYLE_OPTIONS.goals.map((g) => (
                <button key={g} aria-pressed={e.v.goals.includes(g)} onClick={() => goal(g)}>
                  {e.v.goals.includes(g) && <Tick />}
                  {g}
                </button>
              ))}
            </div>
          </Group>
        </>
      ) : (
        <>
          <div className="pf-trio">
            {LS.map((g) => {
              const v = e.v[g.key];
              const has = v && v !== DASH;
              return (
                <div key={g.key} data-empty={has ? undefined : ""}>
                  <small>{g.title}</small>
                  <b>{has ? v : "Not set"}</b>
                  {has && <span>{g.unit}</span>}
                </div>
              );
            })}
          </div>
          <Group title="Goals">
            {e.v.goals.length ? (
              <div className="pf-chips" data-read="">
                {e.v.goals.map((g) => (
                  <span key={g}>{g}</span>
                ))}
              </div>
            ) : (
              <p className="pf-note">No goals yet. Tap Edit to choose some.</p>
            )}
          </Group>
        </>
      )}
    </SubPage>
  );
}

/* ---------------------------------------------------------------- address */

export function AddressPage() {
  const d = useDataset(profileData);
  const e = useEdit<Address>(addressStore.use() ?? d.address, (v) =>
    addressStore.set(Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x).trim() || DASH])) as unknown as Address),
  );
  const lines = [e.v.line1, [e.v.town, e.v.city].filter((x) => x && x !== DASH).join(", "), e.v.postcode, e.v.country].filter((x) => x && x !== DASH);
  return (
    <SubPage title="Address" lead="Where kits and orders are sent." right={<EditPill editing={e.editing} onToggle={e.toggle} />}>
      {e.editing ? (
        <Group>
          <Fields<Address>
            rows={[
              ["Street", "line1"],
              ["Town", "town"],
              ["City", "city"],
              ["Postcode", "postcode"],
              ["Country", "country"],
            ]}
            value={e.v}
            editing
            onChange={e.set}
          />
        </Group>
      ) : (
        <Group title="Delivery address">
          <div className="dv-group pf-addr">
            {lines.length ? (
              <>
                <span className="pf-addr-mark" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                </span>
                <address>
                  {lines.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </address>
              </>
            ) : (
              <p className="pf-note pf-addr-none">No address yet. Tap Edit to add one.</p>
            )}
          </div>
        </Group>
      )}
    </SubPage>
  );
}

/* ---------------------------------------------------------------- orders */

export function OrdersPage() {
  const d = useDataset(profileData);
  const go = useGo();
  return (
    <SubPage title="Orders" lead="Kits and products you have bought.">
      {d.orders.length === 0 ? (
        <Empty title="No orders yet" line="Kits and products you buy will show here, with their delivery status.">
          <PrimaryButton onClick={() => go("/v3/store")}>Browse the store</PrimaryButton>
        </Empty>
      ) : (
        <Group>
          <div className="dv-group">
            {d.orders.map((o) => (
              <div key={o.id} className="pf-item">
                <span className="pf-item-t">
                  <b>{o.title}</b>
                  <small>
                    {o.date} · {o.id}
                  </small>
                </span>
                <span className="pf-item-v">
                  <b>{o.total}</b>
                  <em data-ok={o.status === "Delivered" ? "" : undefined}>{o.status}</em>
                </span>
              </div>
            ))}
          </div>
        </Group>
      )}
    </SubPage>
  );
}

/* ---------------------------------------------------------------- activated tests */

export function TestsPage() {
  const d = useDataset(profileData);
  const go = useGo();
  return (
    <SubPage title="Activated tests" lead="Kits you have registered. Results arrive in Omics.">
      {d.pastTests.length === 0 ? (
        <Empty title="No tests yet" line="Activate a kit when it arrives so the lab can match your sample to you." />
      ) : (
        <Group>
          <div className="dv-group">
            {d.pastTests.map((t) => (
              <button key={t.id} className="pf-item" onClick={(e) => go("/v3/omics", { from: e.currentTarget })}>
                <span className="pf-item-t">
                  <b>{t.name}</b>
                  <small>
                    Activated {t.date} · {t.id}
                  </small>
                </span>
                <Chevron size={14} />
              </button>
            ))}
          </div>
        </Group>
      )}
      <div className="pf-foot-act">
        <PrimaryButton onClick={() => go("/v3/profile/activate")}>Activate a new test</PrimaryButton>
      </div>
    </SubPage>
  );
}

/* ---------------------------------------------------------------- activate */

export function ActivatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  return (
    <SubPage title="Activate a test" lead="Register your kit before you post the sample, so the lab can match it to you.">
      <Group title="Activation code" note="Printed on the card inside the kit box, 6 to 10 letters and numbers.">
        <label className="pf-code" data-error={error ? "" : undefined}>
          <input
            value={code}
            placeholder="e.g. 4KT9QX"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={error}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/\s/g, ""));
              setError(false);
            }}
          />
        </label>
        {error && <p className="pf-error">That code was not recognised. Check it against the card and try again.</p>}
      </Group>
      <div className="pf-foot-act">
        <PrimaryButton disabled={!code.trim()} onClick={() => setError(true)}>
          Activate kit
        </PrimaryButton>
      </div>
    </SubPage>
  );
}

/* ---------------------------------------------------------------- password */

function PasswordField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pf-pw">
      <label>
        <small>{label}</small>
        <input type={show ? "text" : "password"} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      </label>
      <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="3" />
          {!show && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </div>
  );
}

export function PasswordPage() {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [toast, say] = useToast();
  const okRules = PASSWORD_RULES.every((r) => r.test(pw));
  const match = again.length > 0 && again === pw;
  return (
    <SubPage title="Change password" overlay={<Toast text={toast} />}>
      <Group>
        <div className="dv-group">
          <PasswordField label="New password" value={pw} onChange={setPw} placeholder="Enter a new password" />
          <PasswordField label="Confirm" value={again} onChange={setAgain} placeholder="Type it again" />
        </div>
        {again.length > 0 && !match && <p className="pf-error">The two passwords do not match yet.</p>}
      </Group>
      <Group title="It needs">
        <ul className="dv-group pf-rules">
          {PASSWORD_RULES.map((r) => (
            <li key={r.label} data-ok={r.test(pw) ? "" : undefined}>
              <i aria-hidden>{r.test(pw) && <Tick />}</i>
              {r.label}
            </li>
          ))}
        </ul>
      </Group>
      <div className="pf-foot-act">
        <PrimaryButton
          disabled={!okRules || !match}
          onClick={() => {
            setPw("");
            setAgain("");
            say("Password changed");
          }}
        >
          Change password
        </PrimaryButton>
      </div>
    </SubPage>
  );
}
