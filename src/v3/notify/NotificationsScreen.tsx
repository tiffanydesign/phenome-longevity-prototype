import { Glyph } from "../ui/glyphs";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import { notes, useNotes } from "./store";
import "./notify.css";

/** Every message the app has pushed, newest first; unread ones carry a dot until opened. */
export function NotificationsScreen() {
  const go = useGo();
  const { list } = useNotes();
  const unread = list.filter((n) => !n.read).length;
  return (
    <V2Screen nav={false}>
      <div className="nt scroll">
        <BackBar
          title="Notifications"
          right={
            unread > 0 ? (
              <button className="nt-all" onClick={notes.readAll}>
                Mark all read
              </button>
            ) : undefined
          }
        />
        <ul className="nt-list">
          {list.map((n) => (
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
                  <Glyph name={n.glyph} size={18} />
                </span>
                <span className="nt-text">
                  <span className="nt-meta">
                    <b>{n.kind}</b>
                    <time>{n.when}</time>
                  </span>
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button className="nt-test" onClick={() => notes.push()}>
          Send a test notification
        </button>
        <p className="nt-foot">Notifications arrive on your phone even when the app is closed. You can choose which kinds in Settings.</p>
      </div>
    </V2Screen>
  );
}
