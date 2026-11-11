import { useRef, useState, type FormEvent, type ReactNode } from "react";
import "./Gate.css";

/*
 * The prototype's front gate: a viewer enters the access key once, then every
 * page opens on this device. Only a hash of the key ships in the code.
 *
 * This keeps a shared link from opening for anyone who has not been given the
 * key. It is not access control: the site is static, so the files themselves
 * stay public.
 */
const KEY_HASH = "2698df0befa71dbe9020d83c248020aed56a80423bb3aca454af07cdb4753cc1";
const SALT = "phenome-gate:";
const STORE = "phenome.gate";

async function hashOf(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

const remembered = () => {
  try {
    return localStorage.getItem(STORE) === KEY_HASH;
  } catch {
    return false;
  }
};

export function Gate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(remembered);
  const [key, setKey] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  if (open) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!key || busy) return;
    setBusy(true);
    const ok = (await hashOf(key.trim())) === KEY_HASH;
    setBusy(false);
    if (!ok) {
      setWrong(true);
      setKey("");
      input.current?.focus();
      return;
    }
    try {
      localStorage.setItem(STORE, KEY_HASH);
    } catch {
      // storage blocked: the key is asked again next visit
    }
    setOpen(true);
  };

  return (
    <main className="gate">
      <form className="gate-card" data-wrong={wrong ? "" : undefined} onSubmit={submit} onAnimationEnd={() => setWrong(false)}>
        <span className="gate-lock" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
            <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
          </svg>
        </span>
        <h1>Phenome prototype</h1>
        <p>This preview is private. Enter the access key you were given to view it.</p>
        <label className="gate-field">
          <span>Access key</span>
          <input
            ref={input}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={key}
            aria-invalid={wrong}
            aria-describedby="gate-msg"
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <p id="gate-msg" className="gate-msg" role="alert">
          {wrong ? "That key doesn't match. Try again." : " "}
        </p>
        <button type="submit" disabled={!key || busy}>
          View prototype
        </button>
      </form>
    </main>
  );
}
