import { createStore } from "@/lib/data";

/*
 * Today's wins doubles as an inbox: when something important arrives (a new
 * report, for now), it joins the stack as a card of its own, ahead of the
 * habits, and one tap opens it. Opened or dismissed, it leaves the stack.
 * Demo data: one mock report, switched on and off from the review panel.
 */

export interface InboxItem {
  id: string;
  /** small word over the title, in the card's hue */
  kind: string;
  title: string;
  line: string;
  /** category colour (a [data-field] name) */
  field: string;
  /** where opening it goes */
  to: string;
}

export const REPORT_READY: InboxItem = {
  id: "gut-report",
  kind: "Report",
  title: "Your gut health report is ready",
  line: "From your home kit · arrived today",
  field: "habit",
  to: "/insights/gut/report",
};

const KEY = "phenome.v3.inbox";

/** "new" waits in the stack; "opened" has been seen. */
type InboxState = Record<string, "new" | "opened">;

function load(): InboxState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as InboxState | null;
    if (saved && typeof saved === "object") return saved;
  } catch {
    // private window or corrupt value: start with the report waiting
  }
  return { [REPORT_READY.id]: "new" };
}

const store = createStore<InboxState>(load());

function save(s: InboxState) {
  store.set(s);
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage blocked: the state lasts for this session
  }
}

/** What is waiting in the stack now. */
export function useInbox(): InboxItem[] {
  const s = store.use();
  return [REPORT_READY].filter((i) => s[i.id] === "new");
}

export const inbox = {
  opened(id: string) {
    save({ ...store.get(), [id]: "opened" });
  },
  /** the review panel's switch: the report waits again, or is gone */
  setReport(waiting: boolean) {
    save({ ...store.get(), [REPORT_READY.id]: waiting ? "new" : "opened" });
  },
};
