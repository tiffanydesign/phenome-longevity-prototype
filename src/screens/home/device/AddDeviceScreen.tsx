import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { ChevronLeft, ChevronRight } from "@/components/NavHeader";
import { BtPrompt, DisclaimerSheet, LocationPermission, NoDeviceFound } from "./AddDeviceOverlays";
import "./AddDevice.css";

type Device = "Ring" | "Band";
type Step = "list" | "permission" | "bt-error" | "bt-prompt" | "scanning" | "not-found";

/** Scan duration before "No Device Found" (recordings/flow_device_scan.mp4, ~8 s). */
const SCAN_MS = 8000;

/**
 * Add Device flow — capture: add_device/top, disclaimer, permission_location, error_bluetooth,
 * bt_enable_prompt, scanning (scanning_from_video.png), scan_result.
 * Ring/Band → location permission → Bluetooth error → Try Again → system BT prompt → Allow →
 * scanning → No Device Found (Retry loops, Cancel closes).
 */
export function AddDeviceScreen() {
  // keyed by navigation so every entry restarts the flow / skeleton
  return <AddDeviceScreenView key={useLocation().key} />;
}

function AddDeviceScreenView() {
  const nav = useNavigate();
  const [device, setDevice] = useState<Device>("Ring");
  const [step, setStep] = useState<Step>("list");
  const [disclaimer, setDisclaimer] = useState(false);

  useEffect(() => {
    if (step !== "scanning") return;
    const t = window.setTimeout(() => setStep("not-found"), SCAN_MS);
    return () => window.clearTimeout(t);
  }, [step]);

  const start = (d: Device) => {
    setDevice(d);
    setStep("permission");
  };

  let overlay = null;
  if (disclaimer) overlay = <DisclaimerSheet onClose={() => setDisclaimer(false)} />;
  else if (step === "permission") overlay = <LocationPermission onChoose={() => setStep("bt-error")} />;
  else if (step === "bt-prompt")
    overlay = (
      <>
        {/* capture: bt_enable_prompt — the app already shows "No Device Found" underneath the system prompt. */}
        <NoDeviceFound onCancel={() => setStep("list")} onRetry={() => setStep("scanning")} />
        <BtPrompt onDeny={() => setStep("bt-error")} onAllow={() => setStep("scanning")} />
      </>
    );
  else if (step === "not-found") overlay = <NoDeviceFound onCancel={() => setStep("list")} onRetry={() => setStep("scanning")} />;

  const header = (
    <header className="adv-header">
      <button className="adv-back" aria-label="Back" onClick={() => (step === "list" ? nav(-1) : setStep("list"))}>
        <ChevronLeft size={26} />
      </button>
      <h1>Add Device</h1>
      {step === "list" && (
        <button className="adv-info" aria-label="About devices" onClick={() => setDisclaimer(true)}>
          <InfoCircle />
        </button>
      )}
    </header>
  );

  return (
    <Screen header={header} overlay={overlay}>
      {step === "list" && (
        <div className="adv">
          <button className="adv-banner" onClick={() => setDisclaimer(true)}>
            <InfoCircle className="adv-banner-icon" />
            <span className="adv-banner-text">
              <b>Not a medical device</b>
              <span>Readings are wellness estimates. Tap to read more.</span>
            </span>
            <ChevronRight size={18} />
          </button>
          <button className="adv-item" onClick={() => start("Ring")}>
            <Icon name="ring_icon" size={22} />
            <span className="adv-item-label">Ring</span>
            <ChevronRight size={22} />
          </button>
          <button className="adv-item" onClick={() => start("Band")}>
            <Icon name="band_icon" size={22} />
            <span className="adv-item-label">Band</span>
            <ChevronRight size={22} />
          </button>
          <div className="adv-item adv-item-off" aria-disabled>
            <Icon name="watch_icon" size={22} />
            <span className="adv-item-label">Watch</span>
            <small>Coming Soon</small>
          </div>
        </div>
      )}

      {step === "bt-error" && (
        <div className="adv-error">
          <BtOff />
          <h2>Bluetooth Permission Required</h2>
          <p>Please enable Bluetooth permissions in your device settings to scan for devices.</p>
          <button className="adv-try" onClick={() => setStep("bt-prompt")}>
            Try Again
          </button>
        </div>
      )}

      {(step === "scanning" || step === "not-found") && (
        <div className="adv-scan">
          <span className="adv-pulse adv-pulse-3" />
          <span className="adv-pulse adv-pulse-2" />
          <span className="adv-pulse adv-pulse-1" />
          {step === "scanning" && (
            <span className="adv-scan-label">
              <BtGlyph />
              Searching For Your {device}
            </span>
          )}
        </div>
      )}
    </Screen>
  );
}

function InfoCircle({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="10" cy="6.1" r="1.1" fill="currentColor" />
      <path d="M10 8.8v5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Bluetooth rune (capture: scanning_from_video.png). */
export function BtGlyph() {
  return (
    <svg className="adv-bt" width="18" height="26" viewBox="0 0 18 26" fill="none" aria-hidden>
      <path d="M2 7.5l13 11L8.6 24V2L15 7.5 2 18.5" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

/** Bluetooth-disabled glyph (capture: add_device/error_bluetooth). */
function BtOff() {
  return (
    <svg className="adv-btoff" width="42" height="52" viewBox="0 0 42 52" fill="none" aria-hidden>
      <path d="M20 26V3l11 9.5-6.5 6M20 26v23l11-9.5-11-13.5" stroke="currentColor" strokeWidth="4.4" strokeLinejoin="miter" />
      <path d="M3.5 8.5l35 35M3.5 39L13 30" stroke="currentColor" strokeWidth="4.4" />
    </svg>
  );
}
