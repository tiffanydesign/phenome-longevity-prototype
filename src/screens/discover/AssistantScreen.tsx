import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { useOffline } from "@/lib/data";
import { SUGGESTIONS } from "@/data/discoverAssistant";
import { assistantStore, ask, newChat } from "./assistantStore";
import { AnswerBubble, Globe3D } from "./AssistantParts";
import { AssistantHistory } from "./AssistantHistory";
import { History, Plus, Send, Wave } from "./icons";
import "./Assistant.css";

const hashQuery = () => new URLSearchParams(window.location.hash.split("?")[1] ?? "");

/**
 * Longevity AI — captures: assistant/top, typing (video frame), answer_top, answered, history;
 * offline/assistant. Tab bar stays visible (reached from the floating button on tab roots).
 * Prototype hooks (compare shots): `?ask=hello` sends a message on mount, `?sheet=history` opens the sheet.
 */
export function AssistantScreen() {
  const st = assistantStore.use();
  const offline = useOffline();
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(() => hashQuery().get("sheet") === "history");
  const scroller = useRef<HTMLDivElement>(null);
  const chat = st.chats.find((c) => c.id === st.current) ?? null;

  useEffect(() => {
    const q = hashQuery().get("ask");
    if (q && assistantStore.get().current === null) ask(q, offline);
    // run once on mount
  }, []);

  // keep the newest message in view (capture assistant/answered = scrolled to the end)
  const count = chat?.msgs.length ?? 0;
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, st.pending]);

  const send = () => {
    ask(draft, offline);
    setDraft("");
  };
  // TODO(fidelity): offline capture shows the send arrow after sending ("stalled"); online keeps the mic.
  const showSend = draft.trim() !== "" || st.pending === "stalled";

  return (
    <Screen tabs bodyClassName="as-body" overlay={historyOpen && <AssistantHistory onClose={() => setHistoryOpen(false)} />}>
      <div className="as-root">
      <div className="as-logo">
        <Icon name="PL_Logo" size={36} style={{ height: 24, color: "var(--c-navy)" }} />
      </div>
      <div className="as-actions">
        {chat && (
          <button className="as-round" aria-label="New chat" onClick={newChat}>
            <Plus size={19} />
          </button>
        )}
        <button className="as-round" aria-label="Chat history" onClick={() => setHistoryOpen(true)}>
          <History size={19} />
        </button>
      </div>

      {chat ? (
        <div className="as-chat scroll" ref={scroller} data-scroll-root>
          {chat.msgs.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="as-user">
                {m.text}
              </div>
            ) : (
              <AnswerBubble key={m.id} blocks={m.blocks} />
            ),
          )}
        </div>
      ) : (
        <div className="as-welcome">
          <h1 className="as-title">Welcome to Longevity AI</h1>
          <p className="as-sub">Your AI assistant for health insights. Ask me anything about genes, health risks or longevity...</p>
          <Globe3D />
          <div className="as-chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="as-chip" onClick={() => ask(s, offline)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {chat && st.pending === "typing" && (
        <div className="as-typing" aria-label="Assistant is typing">
          <i />
          <i />
          <i />
        </div>
      )}

      <form
        className="as-input"
        data-chat={chat ? "" : undefined}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask me anything..." />
        <button type="submit" className="as-mic" aria-label={showSend ? "Send" : "Voice input"}>
          {showSend ? <Send size={17} /> : <Wave size={19} />}
        </button>
      </form>
      </div>
    </Screen>
  );
}
