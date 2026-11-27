import { useState } from "react";
import { Chevron } from "../ui/icons";

/*
 * The care team's note, folded by default: one row with who wrote it and
 * the start of what they said, cut to one line. Open, the full note reads
 * as a quote under the same head, so nothing moves but the words.
 */
export function PlanNote({ text, by }: { text: string; by: string }) {
  const [open, setOpen] = useState(false);
  const name = by.replace(/, .*$/, "");
  const role = by.includes(", ") ? by.slice(by.indexOf(", ") + 2) : "";
  return (
    <section className="pt-memo" data-open={open || undefined}>
      <button className="pt-memo-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="pt-memo-mark" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.2 3.2a.8.8 0 0 1-1.3-.6V17A3.5 3.5 0 0 1 4 13.5z" />
          </svg>
        </span>
        <span className="pt-memo-t">
          <b>
            Note from {name}
            {role && <em>{role}</em>}
          </b>
          {!open && <small>{text}</small>}
        </span>
        <Chevron dir={open ? "up" : "down"} size={14} />
      </button>
      {open && <p className="pt-memo-body">{text}</p>}
    </section>
  );
}
