import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Chevron } from "../ui/icons";
import { Group, PrimaryButton, SubPage, Tick } from "../profile/kit";
import { DeviceMark } from "./marks";
import { HOME_DEVICES, PAIRED, type Device } from "./paired";
import "./add-device.css";

/*
 * Adding a device, one question per step:
 *   choose   which device
 *   ready    how to get it ready (Bluetooth asked for here, once)
 *   search   looking for it nearby
 *   found    the device it found, to confirm
 *   pairing  connecting
 *   done     paired, and what happens next
 * Back always steps back one, never out of the flow by surprise.
 */

type Step = "choose" | "ready" | "search" | "found" | "pairing" | "done";

const WEAR = [
  { d: PAIRED[0], line: "Sleep, heart, oxygen and temperature" },
  { d: PAIRED[1], line: "Steps, activity and blood pressure" },
];
const HOME = HOME_DEVICES.map((d) => ({ d, line: d.reads }));

const kindOf = (d: Device) => d.short.toLowerCase();

export function AddDevice() {
  // every entry starts the flow afresh
  return <AddDeviceFlow key={useLocation().key} />;
}

function AddDeviceFlow() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [device, setDevice] = useState<Device>(PAIRED[0]);
  const [askBt, setAskBt] = useState(false);
  const [btOk, setBtOk] = useState(false);
  const [denied, setDenied] = useState(false);

  // the search finds the device after a moment; pairing takes a moment more
  useEffect(() => {
    if (step === "search") {
      const t = window.setTimeout(() => setStep("found"), 2600);
      return () => window.clearTimeout(t);
    }
    if (step === "pairing") {
      const t = window.setTimeout(() => setStep("done"), 1800);
      return () => window.clearTimeout(t);
    }
  }, [step]);

  const back = () => {
    if (step === "choose") return nav(-1);
    if (step === "ready") return setStep("choose");
    return setStep("ready");
  };

  const start = () => {
    if (!btOk) return setAskBt(true);
    setStep("search");
  };

  const sheet = askBt ? (
    <div className="ad-sheet-wrap" role="dialog" aria-modal aria-label="Allow Bluetooth">
      <button className="ad-scrim" aria-label="Close" onClick={() => setAskBt(false)} />
      <div className="ad-sheet">
        <span className="ad-sheet-mark" aria-hidden>
          <BtGlyph />
        </span>
        <h3>Allow Bluetooth</h3>
        <p>Phenome uses Bluetooth to find your {kindOf(device)} and keep it in sync. It is only used for your own devices.</p>
        <PrimaryButton
          onClick={() => {
            setBtOk(true);
            setDenied(false);
            setAskBt(false);
            setStep("search");
          }}
        >
          Allow
        </PrimaryButton>
        <button
          className="ad-quiet"
          onClick={() => {
            setDenied(true);
            setAskBt(false);
          }}
        >
          Not now
        </button>
      </div>
    </div>
  ) : null;

  if (step === "choose") {
    return (
      <SubPage title="Add a device" lead="Choose what you are adding. Readings are wellness estimates, not a medical device." onBack={back}>
        <Group title="Worn every day">
          <div className="dv-group">
            {WEAR.map(({ d, line }) => (
              <Choice key={d.id} d={d} line={line} onPick={() => (setDevice(d), setStep("ready"))} />
            ))}
            <div className="ad-choice" aria-disabled="true">
              <span className="dv-icon">
                <Icon name="watch_icon" size={24} />
              </span>
              <span className="ad-choice-t">
                <b>Phenome Watch</b>
                <small>Coming soon</small>
              </span>
            </div>
          </div>
        </Group>
        <Group title="At home">
          <div className="dv-group">
            {HOME.map(({ d, line }) => (
              <Choice key={d.id} d={d} line={line} onPick={() => (setDevice(d), setStep("ready"))} />
            ))}
          </div>
        </Group>
      </SubPage>
    );
  }

  if (step === "ready") {
    const tips = [
      d1(device),
      `Keep it within arm's reach of your phone.`,
      `Bluetooth stays on while you pair.`,
    ];
    return (
      <SubPage title={`Get your ${kindOf(device)} ready`} onBack={back} overlay={sheet}>
        <div className="ad-hero">
          <span className="ad-mark">
            <DeviceMark d={device} size={52} />
          </span>
        </div>
        <ol className="dv-group ad-steps">
          {tips.map((t, i) => (
            <li key={t}>
              <i>{i + 1}</i>
              {t}
            </li>
          ))}
        </ol>
        {denied && <p className="pf-error">Bluetooth is needed to find your {kindOf(device)}. You can allow it when you are ready.</p>}
        <div className="pf-foot-act">
          <PrimaryButton onClick={start}>Start searching</PrimaryButton>
        </div>
      </SubPage>
    );
  }

  if (step === "search" || step === "pairing") {
    const searching = step === "search";
    return (
      <SubPage title={searching ? `Looking for your ${kindOf(device)}` : "Connecting"} onBack={back}>
        <div className="ad-radar" data-busy="">
          <span />
          <span />
          <span />
          <span className="ad-mark">
            <DeviceMark d={device} size={52} />
          </span>
        </div>
        <p className="ad-say">{searching ? "Hold it close to your phone. This takes a few seconds." : `Pairing with ${device.name}…`}</p>
        <button className="ad-quiet" onClick={back}>
          Cancel
        </button>
      </SubPage>
    );
  }

  if (step === "found") {
    const model = device.spec.find(([k]) => k === "Model number")?.[1] ?? "";
    return (
      <SubPage title="Found it" lead={`Check this is your ${kindOf(device)}, then pair.`} onBack={back}>
        <Group>
          <div className="dv-group">
            <div className="ad-found">
              <span className="dv-icon">
                <DeviceMark d={device} size={26} />
              </span>
              <span className="ad-choice-t">
                <b>{device.name}</b>
                <small>
                  {model} · {device.spec.find(([k]) => k === "Bluetooth")?.[1].slice(-5)}
                </small>
              </span>
              <Signal />
            </div>
          </div>
        </Group>
        <div className="pf-foot-act">
          <PrimaryButton onClick={() => setStep("pairing")}>Pair</PrimaryButton>
          <button className="ad-quiet" onClick={() => setStep("search")}>
            Not mine, search again
          </button>
        </div>
      </SubPage>
    );
  }

  // done
  return (
    <SubPage title="" onBack={() => nav("/v3/devices", { replace: true })}>
      <div className="ad-done">
        <span className="ad-done-tick" aria-hidden>
          <Tick />
        </span>
        <h2>{device.name} is paired</h2>
        <p>Its first readings arrive within a few minutes. You will find them in {device.shows.map((s) => s.label).join(" and ")}.</p>
      </div>
      <div className="pf-foot-act">
        <PrimaryButton onClick={() => nav("/v3/devices", { replace: true })}>Done</PrimaryButton>
      </div>
    </SubPage>
  );
}

/** The first tip depends on the device: wearables charge, home devices take batteries. */
function d1(d: Device) {
  if (d.link === "live") return `Charge your ${kindOf(d)} for a few minutes so it wakes up.`;
  if (d.id === "scale") return "Step on the scale once to wake it.";
  if (d.id === "kitchen") return "Press the button on the scale to wake it.";
  return "Twist the cap until the light blinks.";
}

function Choice({ d, line, onPick }: { d: Device; line: string; onPick: () => void }) {
  return (
    <button className="ad-choice" onClick={onPick}>
      <span className="dv-icon">
        <DeviceMark d={d} size={24} />
      </span>
      <span className="ad-choice-t">
        <b>{d.name}</b>
        <small>{line}</small>
      </span>
      <Chevron size={14} />
    </button>
  );
}

function BtGlyph() {
  return (
    <svg width="22" height="26" viewBox="0 0 18 26" fill="none" aria-hidden>
      <path d="M2 7.5l13 11L8.6 24V2L15 7.5 2 18.5" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Signal strength: three bars, all lit when the device is close. */
function Signal() {
  return (
    <span className="ad-signal" aria-label="Strong signal">
      <i />
      <i />
      <i />
    </span>
  );
}
