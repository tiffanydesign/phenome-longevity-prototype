import type { ReactNode } from "react";
import "./Overlay.css";

/**
 * Bottom sheet (Clinical field input, search results, chat history, game launcher…).
 * Captures: insights_clinical/field_edit, meal_log/search_results, assistant/history.
 */
export function Sheet({
  open,
  onClose,
  children,
  handle = false,
  height,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  handle?: boolean;
  /** fixed height in px, otherwise content height */
  height?: number;
}) {
  if (!open) return null;
  return (
    <div className="ov" role="dialog" aria-modal>
      <button className="ov-scrim" aria-label="Dismiss" onClick={onClose} />
      <div className="ov-sheet" style={height ? { height } : undefined}>
        {handle && <div className="ov-handle" />}
        {children}
      </div>
    </div>
  );
}

/**
 * Centred dialog: scrim fades while the card fades + scales up (~330 ms,
 * recordings/anim_modal_trait.mp4).
 */
export function Modal({ open, onClose, children, width = 334 }: { open: boolean; onClose?: () => void; children: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div className="ov ov-center" role="dialog" aria-modal>
      <button className="ov-scrim" aria-label="Dismiss" onClick={onClose} />
      <div className="ov-modal" style={{ width }}>
        {children}
      </div>
    </div>
  );
}
