import { useState, type ReactNode } from "react";
import { photo } from "@/lib/asset";

/**
 * Add Device overlays. The location / Bluetooth prompts are Android system UI
 * (permissioncontroller, com.android.settings) reproduced as OS-style sheets; scrim
 * strengths are sampled from the captures, so they differ from the shared Sheet/Modal.
 */
function Layer({ scrim, children, onScrim }: { scrim: number; children: ReactNode; onScrim?: () => void }) {
  return (
    <div className="adv-layer" role="dialog" aria-modal>
      <button className="adv-scrim" style={{ background: `rgba(0,0,0,${scrim})` }} aria-label="Dismiss" onClick={onScrim} />
      {children}
    </div>
  );
}

/** capture: add_device/disclaimer */
export function DisclaimerSheet({ onClose }: { onClose: () => void }) {
  return (
    <Layer scrim={0.545} onScrim={onClose}>
      <div className="adv-sheet">
        <div className="adv-sheet-icon">
          <svg width="28" height="24" viewBox="0 0 28 24" aria-hidden>
            <path
              d="M14 23.5L2.6 12.4A7 7 0 0112.6 2.6L14 4l1.4-1.4a7 7 0 0110 9.8L14 23.5z"
              fill="var(--c-navy)"
            />
            <path d="M3 12h6l2.2-4 3.6 8 2.4-4.5H25" stroke="#e8ebf3" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Not a medical device</h2>
        <p>
          Your ring or band is a wellness device, not a medical device. Its readings, such as heart rate, blood oxygen, blood pressure and temperature,
          are estimates for general wellness. They are not meant to diagnose, treat or prevent any condition. Always ask a doctor for advice in addition
          to using this app, and before making any medical decision.
        </p>
        <button className="adv-ok" onClick={onClose}>
          OK
        </button>
      </div>
    </Layer>
  );
}

/** capture: add_device/permission_location (Android 14 location permission dialog). */
export function LocationPermission({ onChoose }: { onChoose: () => void }) {
  const [precise, setPrecise] = useState(true);
  return (
    <Layer scrim={0.6}>
      <div className="os-perm">
        <div className="os-perm-icon">
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden>
            <path d="M8 19s6.3-6.4 6.3-11A6.3 6.3 0 001.7 8c0 4.6 6.3 11 6.3 11z" stroke="#3c3c3c" strokeWidth="1.8" />
            <circle cx="8" cy="8" r="2.2" stroke="#3c3c3c" strokeWidth="1.8" />
          </svg>
        </div>
        <h2>Allow Phenome Longevity to access this device’s location?</h2>
        <div className="os-perm-maps">
          <button className="os-map" data-on={precise || undefined} onClick={() => setPrecise(true)}>
            <span className="os-map-head">
              <Radio on={precise} /> Precise
            </span>
            <img src={photo("home/location_precise.png")} alt="" />
          </button>
          <button className="os-map os-map-approx" data-on={!precise || undefined} onClick={() => setPrecise(false)}>
            <span className="os-map-head">
              <Radio on={!precise} /> Approximate
            </span>
            <img src={photo("home/location_approx.png")} alt="" />
          </button>
        </div>
        <button className="os-btn os-btn-primary" onClick={onChoose}>
          While using the app
        </button>
        <button className="os-btn" onClick={onChoose}>
          Only this time
        </button>
        {/* TODO(fidelity): "Don't allow" path not captured — assumed to land on the same Bluetooth error. */}
        <button className="os-btn" onClick={onChoose}>
          Don't allow
        </button>
      </div>
    </Layer>
  );
}

function Radio({ on }: { on: boolean }) {
  return on ? (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r="11" fill="#5b4a17" />
      <path d="M6.5 11.2l3 3 6-6.2" stroke="#f4db95" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle cx="11" cy="11" r="9.8" stroke="#5f5a50" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

/** capture: add_device/bt_enable_prompt (com.android.settings RequestPermissionActivity). */
export function BtPrompt({ onDeny, onAllow }: { onDeny: () => void; onAllow: () => void }) {
  return (
    <Layer scrim={0.2}>
      <div className="os-bt">
        <p>Phenome Longevity wants to turn on Bluetooth</p>
        <div className="os-bt-row">
          <button className="os-btn" onClick={onDeny}>
            Deny
          </button>
          <button className="os-btn os-btn-primary" onClick={onAllow}>
            Allow
          </button>
        </div>
      </div>
    </Layer>
  );
}

/** capture: add_device/scan_result */
export function NoDeviceFound({ onCancel, onRetry }: { onCancel: () => void; onRetry: () => void }) {
  return (
    <Layer scrim={0.54}>
      <div className="adv-dialog">
        <h2>No Device Found</h2>
        <p>Make sure your device is turned on and nearby</p>
        <div className="adv-dialog-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="adv-retry" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    </Layer>
  );
}
