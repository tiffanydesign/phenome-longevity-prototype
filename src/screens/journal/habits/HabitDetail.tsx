import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Controls";
import { journalActions, useHabits } from "@/data/journal-store";
import { JHeader } from "../shared/parts";
import { EditIcon } from "../shared/icons";
import { popOr } from "../shared/nav";
import "./habits.css";

/**
 * Habit detail — capture: habit_detail/top, habit_detail/completed (recordings/flow_habit_complete.mp4:
 * COMPLETE → "COMPLETED", then auto-pop back to the list ~600 ms later). White status icons (app quirk).
 */
export function HabitDetail() {
  const { id = "water" } = useParams();
  const nav = useNavigate();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === id) ?? habits[habits.length - 1];
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => popOr(nav, "/journal/habits"), 600);
    return () => window.clearTimeout(t);
  }, [done, nav]);

  return (
    <Screen
      statusTone="light"
      header={
        <JHeader
          title="Habits"
          right={
            // TODO(fidelity): edit-habit screen not captured
            <button className="hb-edit" aria-label="Edit habit">
              <EditIcon size={21} />
            </button>
          }
        />
      }
      footer={
        <Button
          tone="black"
          className="hb-cta"
          onClick={() => {
            if (done) return;
            journalActions.completeHabit(habit.id);
            setDone(true);
          }}
        >
          {done ? "COMPLETED" : "COMPLETE"}
        </Button>
      }
    >
      <h2 className="hb-detail-title">{habit.name}</h2>
      {/* TODO(fidelity): notes are not displayed on the captured detail screen (habit had none) */}
    </Screen>
  );
}
