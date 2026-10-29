import { useState } from "react";
import { searchFoods, type Food } from "@/data/journal";
import { PlusCircle } from "@/components/Controls";
import { CloseIcon, SearchIcon, VideoIcon } from "../shared/icons";
import { SoftKeyboard, fmtStamp, suggest } from "../shared/parts";

/** "Your Breakfast / Wednesday, 28 Oct 2026, 14:48" block (meal_log, meal_summary). */
export function MealTitle({ name, at }: { name: string; at: Date }) {
  return (
    <div className="ml-title">
      <h2>Your {name}</h2>
      <span>{fmtStamp(at)}</span>
    </div>
  );
}

/**
 * "Search Meal" bottom sheet over Add Breakfast (meal_log/search_results).
 * Module-local instead of the shared Sheet: top edge fixed at y 128, 16 px gutters, darker
 * Flutter scrim (#757575 over white ≈ 54 %).
 */
export function SearchSheet({ initial, onClose, onPick }: { initial: string; onClose: () => void; onPick: (f: Food) => void }) {
  const [q, setQ] = useState(initial);
  const [focused, setFocused] = useState(true);
  const results = searchFoods(q);
  return (
    <>
      <div className="ml-ov" role="dialog" aria-modal>
        <button className="ml-scrim" aria-label="Dismiss" onClick={onClose} />
        <div className="ml-sheet">
          <div className="ml-sheet-head">
            <div>
              <h2>Search Meal</h2>
              <p>Select a product from the list below:</p>
            </div>
            <button className="ml-sheet-x" aria-label="Close" onClick={onClose}>
              <CloseIcon size={22} />
            </button>
          </div>
          <label className="ml-input ml-sheet-input">
            <input
              value={q}
              autoFocus
              placeholder="e.g. Eggs"
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <SearchIcon size={24} />
          </label>
          <div className="ml-results scroll">
            {results.map((f) => (
              <button key={f.id} className="ml-result" onClick={() => onPick(f)}>
                <span className="ml-result-text">
                  <b>{f.name}</b>
                  <span>{f.desc}</span>
                </span>
                <PlusCircle size={24} />
              </button>
            ))}
            {q.trim() && results.length === 0 && <p className="ml-noresult">No results found</p>}
          </div>
        </div>
      </div>
      {focused && <SoftKeyboard suggestions={suggest(q)} />}
    </>
  );
}

/**
 * Android 14 runtime-permission dialog (system UI, meal_log/permission_camera):
 * white card x 9.8–384, y 472.6–820.9, pill buttons 50 px tall, Material blue primary.
 */
export function CameraPermission({ onAllow, onDeny }: { onAllow: () => void; onDeny: () => void }) {
  return (
    <div className="ml-ov ml-ov-perm" role="dialog" aria-modal>
      <div className="ml-scrim ml-scrim-perm" />
      <div className="ml-perm">
        <span className="ml-perm-icon">
          <VideoIcon size={22} />
        </span>
        <h2>Allow Phenome Longevity to take pictures and record video?</h2>
        <button className="ml-perm-btn ml-perm-primary" onClick={onAllow}>
          While using the app
        </button>
        <button className="ml-perm-btn" onClick={onAllow}>
          Only this time
        </button>
        <button className="ml-perm-btn" onClick={onDeny}>
          Don't allow
        </button>
      </div>
    </div>
  );
}
