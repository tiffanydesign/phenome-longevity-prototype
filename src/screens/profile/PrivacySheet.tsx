import { useNavigate } from "react-router-dom";
import { PRIVACY_TEXT, PRIVACY_TITLE } from "@/data/profilePrivacy";
import { ProfileTab } from "./ProfileTab";
import { IcClose } from "./ProfileIcons";
import "./PrivacySheet.css";

/**
 * Privacy Policy — capture: profile_privacy/top, scroll_1…scroll_4.
 * A draggable bottom sheet over the Profile tab: it opens at y 256 and, as you scroll, first grows to
 * y 43 (scroll_1+) and then scrolls its text under a sticky header. Emulated with one scroll root whose
 * first 213 px are a transparent spacer (tapping it closes, like the scrim).
 */
export function PrivacyScreen() {
  // background tab scrolled as in the capture (Past Activated Test row at y ≈ 126)
  return <ProfileTab initialScroll={420} overlay={<PrivacySheet />} />;
}

function PrivacySheet() {
  const nav = useNavigate();
  const close = () => nav("/profile", { replace: true });
  return (
    <div className="prf-pv" role="dialog" aria-modal aria-label={PRIVACY_TITLE}>
      <div className="prf-pv-scrim" aria-hidden />
      <div className="prf-pv-scroll scroll" data-scroll-root>
        <button className="prf-pv-spacer" aria-label="Dismiss" onClick={close} />
        <div className="prf-pv-sheet">
          <div className="prf-pv-head">
            <span className="prf-pv-handle" />
            <div className="prf-pv-titlerow">
              <h2 className="prf-pv-title">{PRIVACY_TITLE}</h2>
              <button className="prf-pv-close" aria-label="Close" onClick={close}>
                <IcClose size={24} />
              </button>
            </div>
          </div>
          {/* the app wraps at the XML's non-breaking spaces as if they were normal spaces */}
          <div className="prf-pv-text">{PRIVACY_TEXT.replace(/\u00a0/g, " ")}</div>
        </div>
      </div>
    </div>
  );
}
