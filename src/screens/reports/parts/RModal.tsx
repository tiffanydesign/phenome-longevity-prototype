import type { ReactNode } from "react";
import "@/components/Overlay.css";

/**
 * Module-local variant of the shared <Modal>: the app centres report dialogs inside the
 * app viewport below the status bar (y 47–833 in every captured report modal), not on the
 * full screen, so the card sits ~13 px lower than the shared Modal would place it.
 */
export function RModal({ open, onClose, children, width = 314, overflowVisible = false }: { open: boolean; onClose?: () => void; children: ReactNode; width?: number; overflowVisible?: boolean }) {
  if (!open) return null;
  return (
    <div className="ov ov-center" role="dialog" aria-modal style={{ padding: "47px 0 20px" }}>
      {/* capture scrim: white → 117 grey (≈ 54 % black) */}
      <button className="ov-scrim" aria-label="Dismiss" onClick={onClose} style={{ background: "rgba(0, 0, 0, 0.54)" }} />
      <div className="ov-modal" style={{ width, borderRadius: 18, maxHeight: "100%", overflow: overflowVisible ? "visible" : undefined }}>
        {children}
      </div>
    </div>
  );
}
