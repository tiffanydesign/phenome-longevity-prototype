import { useState } from "react";
import { Glyph } from "../ui/glyphs";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import { notes, useNotes, type Note } from "./store";
import "./notify.css";

type Filter = "all" | "daily" | "clinic";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "daily", label: "Daily" },
  { id: "clinic", label: "Clinic" },
];

/** Daily notes come from the ring, the band and the diary; clinic notes from visits and the lab. The two are never shown as one. */
const DAILY: Note["kind"][] = ["Report", "Sleep", "Activity"];
const CLINIC: Note["kind"][] = ["Clinic", "Lab"];

const matches = (n: Note, f: Filter) => f === "all" || (f === "daily" ? DAILY.includes(n.kind) : CLINIC.includes(n.kind));

/** Which day a note belongs to, from the words its time is printed in. */
function dayOf(n: Note): "Today" | "Yesterday" | "Earlier" {
  if (/ago$|^now$/i.test(n.when)) return "Today";
  if (/^yesterday$/i.test(n.when)) return "Yesterday";
  return "Earlier";
}

/**
 * Every message the app has pushed. Unread ones gather under New at the top;
 * the rest fall by day. A filter keeps daily readings and clinic results apart.
 */
export function NotificationsScreen() {
  const go = useGo();
  const { list } = useNotes();
  const [filter, setFilter] = useState<Filter>("all");
  const shown = list.filter((n) => matches(n, filter));
  const unread = list.filter((n) => !n.read).length;

  const groups: { title: string; items: Note[] }[] = [
    { title: "New", items: shown.filter((n) => !n.read) },
    ...(["Today", "Yesterday", "Earlier"] as const).map((d) => ({ title: d, items: shown.filter((n) => n.read && dayOf(n) === d) })),
  ].filter((g) => g.items.length > 0);

  return (
    <V2Screen nav={false}>
      <div className="nt scroll">
        <BackBar title="Notifications" />

        <div className="nt-filter" role="tablist" aria-label="Show">
          {FILTERS.map((f) => {
            const count = list.filter((n) => !n.read && matches(n, f.id)).length;
            return (
              <button key={f.id} role="tab" aria-selected={f.id === filter} onClick={() => setFilter(f.id)}>
                {f.label}
                {count > 0 && <i>{count}</i>}
              </button>
            );
          })}
          {unread > 0 && (
            <button className="nt-all" onClick={notes.readAll}>
              Mark all read
            </button>
          )}
        </div>

        {groups.length === 0 && (
          <div className="nt-empty">
            <span className="nt-empty-mark">
              <Glyph name="bell" size={22} />
            </span>
            <b>Nothing here yet</b>
            <span>{filter === "clinic" ? "Results and notes from your clinic will appear here." : "Your reports and daily nudges will appear here."}</span>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.title} className="nt-group" aria-label={g.title}>
            <h2>{g.title}</h2>
            <ul>
              {g.items.map((n) => (
                <li key={n.id}>
                  <button
                    className="nt-row"
                    data-unread={n.read ? undefined : ""}
                    data-field={n.field}
                    onClick={() => {
                      notes.read(n.id);
                      go(n.to);
                    }}
                  >
                    <span className="nt-mark">
                      <Glyph name={n.glyph} size={19} />
                    </span>
                    <span className="nt-text">
                      <span className="nt-meta">
                        <b>{n.kind}</b>
                        <time>{n.when}</time>
                        {!n.read && <i className="nt-dot" aria-label="Unread" />}
                      </span>
                      <strong>{n.title}</strong>
                      <span className="nt-body">{n.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <footer className="nt-foot">
          <p>Notifications arrive on your phone even when the app is closed. Choose which kinds in Settings.</p>
          {/* prototype only: drops the next push in as a banner */}
          <button className="nt-test" onClick={() => notes.push()}>
            Send a test notification
          </button>
        </footer>
      </div>
    </V2Screen>
  );
}
