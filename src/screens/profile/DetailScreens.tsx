import { useState } from "react";
import { createStore, useDataset } from "@/lib/data";
import { profileData, DASH, type Address, type HealthHistory, type ProfileUser } from "@/data/profile";
import { EditField, EditToggle, PfScreen, ViewField } from "./ProfileKit";
import "./DetailScreens.css";

/** Saved edits survive navigation (reset on reload). null = still the dataset value. */
export const userStore = createStore<ProfileUser | null>(null);
export const healthStore = createStore<HealthHistory | null>(null);
export const addressStore = createStore<Address | null>(null);

/**
 * Generic view/edit hook: the header icon toggles edit mode, the same icon saves
 * (pattern captured on profile_lifestyle/edit → saved).
 */
function useEditable<T>(stored: T | null, base: T, save: (v: T) => void) {
  const value = stored ?? base;
  const [draft, setDraft] = useState<T | null>(null);
  const editing = draft !== null;
  const toggle = () => {
    if (editing) {
      save(draft);
      setDraft(null);
    } else setDraft(value);
  };
  const set = (patch: Partial<T>) => setDraft((d) => ({ ...(d ?? value), ...patch }));
  return { value, draft: draft ?? value, editing, toggle, set };
}

/** Personal Details — capture: profile_account/top. */
export function PersonalDetailsScreen() {
  const d = useDataset(profileData);
  const e = useEditable(userStore.use(), d.user, userStore.set);
  const u = e.draft;
  const initials = `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`;
  // TODO(fidelity): edit form not captured — fields simply become text inputs (pickers for sex / DOB unknown).
  const F = (label: string, k: keyof ProfileUser) =>
    e.editing ? <EditField tall label={label} value={u[k]} onChange={(v) => e.set({ [k]: v } as Partial<ProfileUser>)} /> : <ViewField tall label={label} value={u[k]} />;

  return (
    <PfScreen title="Personal Details" right={<EditToggle editing={e.editing} onToggle={e.toggle} />}>
      <div className="prf-details">
        <span className="prf-details-avatar">{initials}</span>
        <div className="prf-form prf-form-tall">
          <div className="prf-row2">
            {F("First Name", "firstName")}
            {F("Last Name", "lastName")}
          </div>
          {/* e-mail is not editable in-app (assumed) */}
          <ViewField tall label="Email" value={u.email} />
          {F("Biological Sex", "sex")}
          {F("Date of Birth", "dob")}
          <div className="prf-row2">
            {F("Weight", "weight")}
            {F("Height", "height")}
          </div>
        </div>
        {/* TODO(fidelity): deactivate flow not captured — button is inert. */}
        <button className="prf-deactivate">Deactivate account</button>
      </div>
    </PfScreen>
  );
}

const HEALTH_FIELDS: [string, keyof HealthHistory][] = [
  ["Smoking Status", "smoking"],
  ["Alcohol Consumption", "alcohol"],
  ["Chronic Diseases", "chronic"],
  ["Significant Medical History", "medical"],
  ["Regularly Used Medications", "medications"],
];

/** Health History — capture: profile_health_history/top. */
export function HealthHistoryScreen() {
  const d = useDataset(profileData);
  const e = useEditable(healthStore.use(), d.health, healthStore.set);
  // TODO(fidelity): edit form not captured — rendered as text inputs (the app likely uses chips like Lifestyle).
  return (
    <PfScreen title="Health History" right={<EditToggle editing={e.editing} onToggle={e.toggle} />}>
      <div className="prf-form">
        {HEALTH_FIELDS.map(([label, k]) =>
          e.editing ? (
            <EditField key={k} label={label} value={e.draft[k]} onChange={(v) => e.set({ [k]: v } as Partial<HealthHistory>)} />
          ) : (
            <ViewField key={k} label={label} value={e.draft[k]} />
          ),
        )}
      </div>
    </PfScreen>
  );
}

const ADDRESS_FIELDS: [string, keyof Address][] = [
  ["Address Line 1", "line1"],
  ["Town", "town"],
  ["City", "city"],
  ["Postal Code", "postcode"],
  ["Country", "country"],
];

/** Saved Address — capture: profile_saved_address/top. */
export function SavedAddressScreen() {
  const d = useDataset(profileData);
  const e = useEditable(addressStore.use(), d.address, (v) => addressStore.set(normalise(v)));
  // TODO(fidelity): edit form not captured — rendered as text inputs.
  return (
    <PfScreen title="Saved Address" right={<EditToggle editing={e.editing} onToggle={e.toggle} />}>
      <div className="prf-form prf-form-address">
        {ADDRESS_FIELDS.map(([label, k]) =>
          e.editing ? (
            <EditField key={k} label={label} value={e.draft[k]} onChange={(v) => e.set({ [k]: v } as Partial<Address>)} />
          ) : (
            <ViewField key={k} label={label} value={e.draft[k]} />
          ),
        )}
      </div>
    </PfScreen>
  );
}

function normalise(a: Address): Address {
  const out = { ...a };
  (Object.keys(out) as (keyof Address)[]).forEach((k) => {
    if (!out[k].trim()) out[k] = DASH;
  });
  return out;
}
