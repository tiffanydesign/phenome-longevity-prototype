import { createStore } from "@/lib/data";
import type { GlyphName } from "../ui/glyphs";

export interface Note {
  id: string;
  /** what sent it, shown as the line's kind */
  kind: "Report" | "Sleep" | "Activity" | "Clinic" | "Lab" | "Store";
  glyph: GlyphName;
  /** the category colour its mark takes */
  field: string;
  title: string;
  body: string;
  /** how long ago, as the list prints it */
  when: string;
  /** where tapping it goes */
  to: string;
  read: boolean;
}

const SEED: Note[] = [
  { id: "n1", kind: "Report", glyph: "spark", field: "capacity", title: "Your weekly report is ready", body: "HRV is up 9% and sleep held steady. Two things to try this week.", when: "8 min ago", to: "/v3/home?tab=vitals", read: false },
  { id: "n2", kind: "Activity", glyph: "flame", field: "activity", title: "1,518 steps to your goal", body: "A 15-minute walk this evening closes it.", when: "1 h ago", to: "/v3/metric/steps", read: false },
  { id: "n3", kind: "Lab", glyph: "dna", field: "body", title: "Proteomics results are in", body: "9 of 12 body systems look typical. Three are worth discussing at your next visit.", when: "Yesterday", to: "/v3/omics", read: true },
  { id: "n4", kind: "Sleep", glyph: "moon", field: "sleep", title: "Third night above seven hours", body: "Your deep sleep rose with it.", when: "Yesterday", to: "/v3/metric/sleep", read: true },
  { id: "n5", kind: "Clinic", glyph: "heart", field: "heart", title: "Book your next visit", body: "It is three months since your last scan. Pick a time that suits you.", when: "Mon", to: "/v3/booking", read: true },
];

/** The push that arrives while the member is in the app: one at a time, shown as a banner. */
const PUSHES: Omit<Note, "id" | "read" | "when">[] = [
  { kind: "Clinic", glyph: "heart", field: "heart", title: "Your clinician left a note", body: "Your visit was reviewed and two recommendations were added.", to: "/v3/twin" },
  { kind: "Sleep", glyph: "moon", field: "sleep", title: "Wind down in 30 minutes", body: "Bedtime at 22:45 keeps your streak going.", to: "/v3/metric/sleep" },
];

interface State {
  list: Note[];
  banner: Note | null;
  sent: number;
}

const store = createStore<State>({ list: SEED, banner: null, sent: 0 });

export const useNotes = () => store.use();

export const notes = {
  /** Sends the next push: it lands on top of the list and shows as a banner. */
  push() {
    const s = store.get();
    const base = PUSHES[s.sent % PUSHES.length];
    const note: Note = { ...base, id: `p${s.sent}`, when: "now", read: false };
    store.set({ list: [note, ...s.list], banner: note, sent: s.sent + 1 });
  },
  dismiss() {
    store.set((s) => ({ ...s, banner: null }));
  },
  read(id: string) {
    store.set((s) => ({ ...s, banner: s.banner?.id === id ? null : s.banner, list: s.list.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },
  readAll() {
    store.set((s) => ({ ...s, list: s.list.map((n) => ({ ...n, read: true })) }));
  },
};

/** Once a visit, a little after Home first opens, a push arrives. */
let scheduled = false;
export function schedulePush(after = 4200) {
  if (scheduled) return;
  scheduled = true;
  window.setTimeout(() => notes.push(), after);
}
