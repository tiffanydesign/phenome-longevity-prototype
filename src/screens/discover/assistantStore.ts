import { createStore } from "@/lib/data";
import { answerFor, TYPING_MS, type AnswerBlock } from "@/data/discoverAssistant";

export type Msg = { id: number; role: "user"; text: string } | { id: number; role: "ai"; blocks: AnswerBlock[] };

export interface Chat {
  id: number;
  title: string;
  /** "15:07" — time of the first message */
  time: string;
  msgs: Msg[];
}

interface AssistantState {
  chats: Chat[];
  /** null = fresh "Welcome to Longevity AI" screen */
  current: number | null;
  /** waiting for an answer: "typing" shows the navy dots; "stalled" (offline) shows nothing */
  pending: "typing" | "stalled" | null;
}

/** Conversations survive navigation between tabs (in-memory, resets on reload). */
export const assistantStore = createStore<AssistantState>({ chats: [], current: null, pending: null });

let seq = 1;
let timer: number | undefined;

const clock = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * Send a question. Online: typing dots for TYPING_MS, then the whole answer at once (no streaming,
 * recordings/flow_assistant_answer.mp4). Offline: the user bubble stays alone, no reply and no error
 * (capture offline/assistant).
 */
export function ask(text: string, offline: boolean) {
  const q = text.trim();
  if (!q) return;
  const s = assistantStore.get();
  let chats = s.chats;
  let current = s.current;
  const userMsg: Msg = { id: seq++, role: "user", text: q };
  if (current === null) {
    current = seq++;
    chats = [{ id: current, title: q, time: clock(), msgs: [userMsg] }, ...chats];
  } else {
    chats = chats.map((c) => (c.id === current ? { ...c, msgs: [...c.msgs, userMsg] } : c));
  }
  assistantStore.set({ chats, current, pending: offline ? "stalled" : "typing" });
  if (offline) return;
  const chatId = current;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    assistantStore.set((st) => ({
      ...st,
      pending: null,
      chats: st.chats.map((c) => (c.id === chatId ? { ...c, msgs: [...c.msgs, { id: seq++, role: "ai", blocks: answerFor(q) }] } : c)),
    }));
  }, TYPING_MS);
}

export function newChat() {
  window.clearTimeout(timer);
  assistantStore.set((s) => ({ ...s, current: null, pending: null }));
}

export function openChat(id: number) {
  assistantStore.set((s) => ({ ...s, current: id }));
}

