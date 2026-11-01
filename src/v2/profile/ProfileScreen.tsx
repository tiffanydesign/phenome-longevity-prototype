import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Chevron } from "../ui/icons";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import { DotArt } from "../ui/DotArt";
import "./profile.css";

const CARE = [
  { title: "Consultations", sub: "Book or manage sessions", to: "/discover/consultations" },
  { title: "Past tests", sub: "2 scans, Feb 2024 and Jul 2026", to: "/profile/past-tests" },
  { title: "Reports", sub: "5 PDFs", to: "/insights/reports" },
];

const ACCOUNT = [
  { title: "Personal details", to: "/profile/details" },
  { title: "Health history", to: "/profile/health-history" },
  { title: "Store orders", to: "/profile/orders" },
  { title: "Privacy", to: "/profile/privacy" },
  { title: "Language", to: "/profile/language" },
];

/** Profile sits behind the top-right avatar, so the bottom bar stays health destinations only. */
export function ProfileScreen() {
  const go = useGo();
  return (
    <V2Screen nav={false}>
      <div className="pr scroll">
        <BackBar title="Profile" />
        <p className="pr-who">Age 42. Member since 2024.</p>

        <h2>Devices</h2>
        <div className="pr-list">
          <div className="pr-row">
            <Icon name="ring_icon" size={22} />
            <span>
              Phenome Ring
              <small>68%, heart, sleep, oxygen</small>
            </span>
            <i data-on aria-label="Connected" />
          </div>
          <div className="pr-row">
            <Icon name="band_icon" size={22} />
            <span>
              Phenome Band
              <small>41%, steps, activity, calories</small>
            </span>
            <i data-on aria-label="Connected" />
          </div>
          <button className="pr-row" onClick={() => go("/v2/add-device")}>
            <span>Add a device</span>
            <Chevron size={16} />
          </button>
        </div>

        <h2>Care</h2>
        <div className="pr-list">
          {CARE.map((c) => (
            <button key={c.title} className="pr-row" onClick={() => go(c.to)}>
              <span>
                {c.title}
                <small>{c.sub}</small>
              </span>
              <Chevron size={16} />
            </button>
          ))}
        </div>

        <h2>Account</h2>
        <div className="pr-list">
          {ACCOUNT.map((c) => (
            <button key={c.title} className="pr-row" onClick={() => go(c.to)}>
              <span>{c.title}</span>
              <Chevron size={16} />
            </button>
          ))}
        </div>
      </div>
    </V2Screen>
  );
}

type Kind = "Ring" | "Band";
type Step = "list" | "scan" | "found";

/* what a device adds to the twin is the reason to pair one, so the list leads with it */
const DEVICES: { kind: Kind; icon: string; feeds: string; organ: string }[] = [
  { kind: "Ring", icon: "ring_icon", feeds: "Gives your twin a live heart, lungs and sleep", organ: "heart" },
  { kind: "Band", icon: "band_icon", feeds: "Gives your twin steps, activity and blood pressure", organ: "bone" },
];

export function AddDeviceScreen() {
  const go = useGo();
  const [step, setStep] = useState<Step>("list");
  const [kind, setKind] = useState<Kind>("Ring");

  useEffect(() => {
    if (step !== "scan") return;
    const t = window.setTimeout(() => setStep("found"), 2600);
    return () => window.clearTimeout(t);
  }, [step]);

  const back = step === "list" ? undefined : () => setStep("list");

  return (
    <V2Screen nav={false}>
      <div className="pr scroll">
        <BackBar title="Add device" onBack={back} />
        {step === "list" && (
          <>
            <div className="pr-note">
              <b>Not a medical device</b>
              Readings are wellness estimates.
            </div>
            <div className="pr-devices">
              {DEVICES.map((d) => (
                <button
                  key={d.kind}
                  className="pr-device"
                  onClick={() => {
                    setKind(d.kind);
                    setStep("scan");
                  }}
                >
                  <span className="pr-device-art">
                    <DotArt organ={d.organ} size={96} crop={1.1} color="#203a85" />
                  </span>
                  <span>
                    <b>{d.kind}</b>
                    <small>{d.feeds}</small>
                  </span>
                  <Chevron />
                </button>
              ))}
              <div className="pr-device" aria-disabled>
                <span>
                  <b>Watch</b>
                  <small>Coming soon</small>
                </span>
              </div>
            </div>
          </>
        )}
        {step !== "list" && (
          <div className="pr-scan" data-step={step}>
            <span className="pr-rings" aria-hidden>
              <i />
              <i />
              <i />
              <Icon name={kind === "Ring" ? "ring_icon" : "band_icon"} size={34} />
            </span>
            {step === "scan" ? (
              <h2>Searching for your {kind.toLowerCase()}</h2>
            ) : (
              <>
                <h2>Phenome {kind} found</h2>
                <p>Your twin starts reading from it as soon as you connect.</p>
                <button className="v2-pillbtn" data-solid onClick={() => go("/v2/twin", { replace: true })}>
                  Connect and open your twin
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </V2Screen>
  );
}
