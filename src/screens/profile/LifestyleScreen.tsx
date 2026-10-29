import { useEffect, useState } from "react";
import { createStore, useDataset } from "@/lib/data";
import { profileData, LIFESTYLE_OPTIONS, DASH, type Lifestyle } from "@/data/profile";
import { EditToggle, PfScreen, ViewField } from "./ProfileKit";
import "./LifestyleScreen.css";

const lifestyleStore = createStore<Lifestyle | null>(null);

/**
 * Lifestyle Habits — capture: profile_lifestyle/top (view), edit (chips), edit_selected,
 * saved (values + navy "Save" snackbar).
 */
export function LifestyleScreen() {
  const d = useDataset(profileData);
  const stored = lifestyleStore.use();
  const value = stored ?? d.lifestyle;
  const [draft, setDraft] = useState<Lifestyle | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = () => {
    if (draft) {
      lifestyleStore.set(draft);
      setDraft(null);
      setToast(true);
    } else setDraft({ ...value, goals: [...value.goals] });
  };

  const pickOne = (k: "activity" | "water" | "sleep", v: string) => setDraft((s) => (s ? { ...s, [k]: s[k] === v ? DASH : v } : s));
  const toggleGoal = (g: string) =>
    setDraft((s) => (s ? { ...s, goals: s.goals.includes(g) ? s.goals.filter((x) => x !== g) : [...s.goals, g] } : s));

  return (
    <PfScreen
      title="Lifestyle Habits"
      right={<EditToggle editing={!!draft} onToggle={toggle} />}
      // TODO(fidelity): snackbar text captured as "Save" (profile_lifestyle/saved); duration/animation not captured.
      overlay={toast ? <div className="prf-snack">Save</div> : undefined}
    >
      {draft ? (
        <div className="prf-ls-edit">
          <ChipGroup label="Daily Activity Level" options={LIFESTYLE_OPTIONS.activity} isOn={(o) => draft.activity === o} onPick={(o) => pickOne("activity", o)} />
          <ChipGroup label="Daily Water Intake" options={LIFESTYLE_OPTIONS.water} isOn={(o) => draft.water === o} onPick={(o) => pickOne("water", o)} />
          <ChipGroup label="Average Nightly Sleep" options={LIFESTYLE_OPTIONS.sleep} isOn={(o) => draft.sleep === o} onPick={(o) => pickOne("sleep", o)} />
          <ChipGroup label="Health Goals" hint="Select Multiple" options={LIFESTYLE_OPTIONS.goals} isOn={(o) => draft.goals.includes(o)} onPick={toggleGoal} />
        </div>
      ) : (
        <div className="prf-form">
          <ViewField label="Daily Activity Level" value={value.activity} />
          <ViewField label="Daily Water Intake" value={value.water} />
          <ViewField label="Average Nightly Sleep" value={value.sleep} />
          <ViewField label="Health Goals" value={value.goals.length ? value.goals.join(", ") : DASH} />
        </div>
      )}
    </PfScreen>
  );
}

function ChipGroup({
  label,
  hint,
  options,
  isOn,
  onPick,
}: {
  label: string;
  hint?: string;
  options: readonly string[];
  isOn: (o: string) => boolean;
  onPick: (o: string) => void;
}) {
  return (
    <div className="prf-chips-group">
      <div className="prf-chips-head">
        <span className="prf-field-label">{label}</span>
        {hint && <span className="prf-chips-hint">{hint}</span>}
      </div>
      <div className="prf-chips">
        {options.map((o) => (
          <button key={o} className="prf-chip" data-on={isOn(o) || undefined} onClick={() => onPick(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
