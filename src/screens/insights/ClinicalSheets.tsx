import { useState } from "react";
import { Sheet } from "@/components/Overlay";
import { photo } from "@/lib/asset";
import { TILE_UNITS } from "@/data/insightsClinical";

/**
 * "Weight / [Enter value  kg] / Add Value / Cancel" — capture: insights_clinical/field_edit, field_edit_filled.
 * The capture has the OS numeric keyboard open below the sheet; it is not drawn here, so the sheet
 * docks to the bottom of the screen instead of sitting above the keyboard.
 */
export function FieldSheet({
  label,
  initial,
  onClose,
  onSave,
}: {
  label: string;
  initial: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const valid = value.trim() !== "" && !Number.isNaN(Number(value.replace(",", ".")));
  return (
    <Sheet open onClose={onClose} handle>
      <div className="cli-sheet">
        <h3 className="cli-sheet-title">{label}</h3>
        <label className="cli-input">
          <input
            inputMode="decimal"
            placeholder="Enter value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && onSave(value.replace(",", "."))}
          />
          <span className="cli-input-unit">{TILE_UNITS[label] ?? ""}</span>
        </label>
        {/* TODO(fidelity): the app's validation feedback for empty / invalid input was not captured. */}
        <button className="cli-sheet-add" onClick={() => valid && onSave(value.replace(",", "."))}>
          Add Value
        </button>
        <button className="cli-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

/** "Experimental Feature" notice before the AI lab-report upload — capture: insights_clinical/sheet_upload_notice. */
export function UploadNoticeSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet open onClose={onClose}>
      <div className="cli-notice">
        <span className="cli-notice-icon" style={{ ["--ico" as string]: `url("${photo("insights/icons/other.png")}")` }} />
        <h3 className="cli-notice-title">Experimental Feature</h3>
        <p className="cli-notice-body">
          This feature uses AI to extract values from your lab report PDF. It's experimental and may not be 100% accurate. Please review and
          confirm all extracted values before saving.
        </p>
        {/* TODO(fidelity): Continue opens the OS file picker (PDF) in the app — not reproducible here. */}
        <button className="cli-notice-continue" onClick={onClose}>
          Continue
        </button>
        <button className="cli-sheet-cancel cli-notice-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
