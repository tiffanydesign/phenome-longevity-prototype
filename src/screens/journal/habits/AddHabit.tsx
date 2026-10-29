import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Controls";
import { HABIT_NAME_MAX } from "@/data/journal";
import { journalActions } from "@/data/journal-store";
import { JHeader, SoftKeyboard, suggest } from "../shared/parts";
import "./habits.css";

/**
 * Add Habits — capture: add_habit/top, add_habit/filled. `?name=&notes=` pre-fill (typed state).
 * App bug reproduced: the name counter counts *remaining* characters (100 → 85) while the
 * notes counter counts *typed* characters (0 → 11).
 */
export function AddHabit() {
  const [params] = useSearchParams();
  return <AddHabitBody key={params.toString()} name0={params.get("name") ?? ""} notes0={params.get("notes") ?? ""} />;
}

function AddHabitBody({ name0, notes0 }: { name0: string; notes0: string }) {
  const nav = useNavigate();
  const [name, setName] = useState(name0);
  const [notes, setNotes] = useState(notes0);
  const prefilled = name0 !== "" || notes0 !== "";
  const [focus, setFocus] = useState<"name" | "notes" | null>(prefilled ? "notes" : null);
  const ok = name.trim().length > 0;

  return (
    <Screen
      statusTone="light"
      header={<JHeader title="Add Habits" />}
      footer={
        <Button
          tone={ok ? "black" : "disabled"}
          disabled={!ok}
          className={`hb-cta${ok ? "" : " hb-cta-off"}`}
          style={{ marginBottom: focus ? 291 : undefined }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            journalActions.addHabit(name.trim(), notes.trim());
            nav("/journal/habits", { replace: true });
          }}
        >
          ADD TO HABITS
        </Button>
      }
      overlay={focus ? <SoftKeyboard suggestions={suggest(focus === "name" ? name : notes)} /> : undefined}
    >
      <div className="ah">
        <div className="ah-top">
          <span className="ah-label">Habit Name</span>
          <span className="ah-count">{HABIT_NAME_MAX - name.length} Characters</span>
        </div>
        <input
          className="ah-input"
          value={name}
          maxLength={HABIT_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setFocus("name")}
          onBlur={() => setFocus(null)}
        />
        <div className="ah-top ah-top-notes">
          <span className="ah-label">Notes</span>
          <span className="ah-count">{notes.length} Characters</span>
        </div>
        <textarea
          className="ah-input ah-notes"
          value={notes}
          autoFocus={prefilled}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setFocus("notes")}
          onBlur={() => setFocus(null)}
        />
      </div>
    </Screen>
  );
}
