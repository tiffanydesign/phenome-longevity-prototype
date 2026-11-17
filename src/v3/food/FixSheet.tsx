import { useState } from "react";
import type { Portion } from "./data";
import { food, type Meal } from "./store";

/*
 * When the read is wrong: say what is different in a few words, or tap a
 * common fix, and the plate is read again with that in mind.
 */

const FIXES: { id: string; label: string; apply: (m: Meal) => Partial<Meal> }[] = [
  { id: "smaller", label: "Smaller portion", apply: (m) => ({ servings: Math.max(0.5, m.servings - 0.25) }) },
  { id: "bigger", label: "Bigger portion", apply: (m) => ({ servings: m.servings + 0.25 }) },
  { id: "dressing", label: "No dressing", apply: (m) => ({ items: m.items.filter((p) => !/dressing|tahini|maple/.test(p.food)) }) },
  { id: "rice", label: "Add rice", apply: (m) => ({ items: [...m.items, { food: "brown-rice", grams: 150 } as Portion] }) },
  { id: "egg", label: "Add an egg", apply: (m) => ({ items: [...m.items, { food: "egg-boiled", grams: 50 } as Portion] }) },
];

export function FixSheet({ meal, onClose }: { meal: Meal; onClose: () => void }) {
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const ready = picked.length > 0 || text.trim().length > 0;

  const submit = () => {
    let next: Meal = meal;
    FIXES.filter((f) => picked.includes(f.id)).forEach((f) => (next = { ...next, ...f.apply(next) }));
    food.reanalyse(meal.id, { items: next.items, servings: next.servings });
    onClose();
  };

  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet fd-fix" role="dialog" aria-label="Fix result" onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>What's different?</h2>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. half the rice, dressing on the side" rows={3} />
        <div className="fd-fix-chips">
          {FIXES.map((f) => (
            <button key={f.id} aria-pressed={picked.includes(f.id)} onClick={() => toggle(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <button className="mx-sheet-save" disabled={!ready} onClick={submit}>
          Read again
        </button>
        <button className="mx-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
