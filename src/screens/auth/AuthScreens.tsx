import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/Charts";
import { ChevronLeft } from "@/components/NavHeader";
import { asset } from "@/lib/asset";
import { useOffline } from "@/lib/data";
import "./Auth.css";

/** Cold start — capture offline/launch_spinner: centred navy spinner, then /welcome (offline) or /home. */
export function LaunchScreen() {
  const nav = useNavigate();
  const offline = useOffline();
  useEffect(() => {
    // TODO(fidelity): spinner duration estimated from recordings/launch_cold_start.mp4
    const t = window.setTimeout(() => nav(offline ? "/welcome" : "/home", { replace: true }), 1800);
    return () => window.clearTimeout(t);
  }, [nav, offline]);
  return (
    <Screen bodyClassName="au-launch">
      <Spinner size={30} />
    </Screen>
  );
}

/** Logged-out welcome — capture welcome/top. */
export function WelcomeScreen() {
  const nav = useNavigate();
  return (
    <Screen bodyClassName="au-welcome">
      <Icon name="Logo_Big" size={226} className="au-biglogo" style={{ height: 149, color: "var(--c-navy)" }} />
      <h1 className="au-wtitle">
        Your Personalised
        <br />
        Health <em>Starts Here</em>
      </h1>
      <p className="au-wsub">
        <em>Balancing Insights</em> Omics for Clear Health Views and Your Personalized Wellness Journey.
      </p>
      <button className="au-btn au-navy au-join" onClick={() => nav("/signup")}>
        Join
      </button>
      <button className="au-btn au-outline" onClick={() => nav("/login")}>
        Log In
      </button>
      <p className="au-terms">
        By creating account or logging in, you agree to our
        <br />
        <u>Terms &amp; Conditions</u> and <u>Privacy Policy</u>
        <span className="au-info" aria-hidden>
          i
        </span>
      </p>
    </Screen>
  );
}

/** Sign in — capture login/top. */
export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  return (
    <Screen header={<AuthHeader />}>
      <div className="au-form">
        {/* App bug reproduced on purpose: the title renders the raw i18n key "signin.heading". */}
        <h1 className="au-title">signin.heading</h1>
        <Field label="Email" icon={<MailIcon />} top={48}>
          <input type="email" placeholder="Your email here" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" icon={<LockIcon />} top={24}>
          <input type={show ? "text" : "password"} placeholder="Enter your password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="au-eye" aria-label="Show password" onClick={() => setShow(!show)}>
            <EyeOffIcon />
          </button>
        </Field>
        <button className="au-forgot">Forgot Password</button>
        <button className="au-btn au-navy au-submit" disabled={!email || !pw}>
          Log In
        </button>
        <Or top={41} />
        <button className="au-btn au-navy au-sso au-otp">
          <LockIcon size={20} /> One Time Passcode (OTP)
        </button>
        <SocialButtons />
      </div>
    </Screen>
  );
}

/** Register — capture signup/top. */
export function SignupScreen() {
  const [email, setEmail] = useState("");
  return (
    <Screen header={<AuthHeader />}>
      <div className="au-form">
        <h1 className="au-title au-title-signup">
          Let's get <em>started</em>
        </h1>
        <p className="au-subtitle">Choose how you'd like to register.</p>
        <Field label="Email" icon={<MailIcon />} top={48}>
          <input type="email" placeholder="Your email here" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button className="au-btn au-navy au-submit au-register" disabled={!email}>
          Register
        </button>
        <Or top={214} />
        <SocialButtons first={24} />
      </div>
    </Screen>
  );
}

function AuthHeader() {
  return (
    <header className="au-header">
      <BackButton />
      <Icon name="Logo_Dark" size={153} style={{ height: 24, color: "var(--c-navy)" }} />
    </header>
  );
}

function BackButton() {
  const nav = useNavigate();
  return (
    <button className="au-back" aria-label="Back" onClick={() => nav(-1)}>
      <ChevronLeft size={22} />
    </button>
  );
}

function Field({ label, icon, top, children }: { label: string; icon: ReactNode; top: number; children: ReactNode }) {
  return (
    <label className="au-field" style={{ marginTop: top }}>
      <span className="au-label">{label}</span>
      <span className="au-box">
        {icon}
        {children}
      </span>
    </label>
  );
}

function Or({ top }: { top: number }) {
  return (
    <div className="au-or" style={{ marginTop: top }}>
      <span />
      or
      <span />
    </div>
  );
}

function SocialButtons({ first = 12 }: { first?: number }) {
  return (
    <>
      <button className="au-btn au-sso au-google" style={{ marginTop: first }}>
        <img src={asset("img/Google__G__logo.svg.png")} alt="" width={20} height={20} /> Continue with Google
      </button>
      <button className="au-btn au-sso au-apple">
        <AppleIcon /> Continue with Apple
      </button>
    </>
  );
}

const MailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3.5 7l8.5 6 8.5-6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const LockIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const AppleIcon = () => (
  <svg width="18" height="20" viewBox="0 0 17 20" aria-hidden>
    <path
      fill="currentColor"
      d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"
    />
  </svg>
);
