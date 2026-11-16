import { useLayoutEffect, useRef, useState } from "react";
import { useOffline } from "@/lib/data";
import { SUGGESTIONS, type AnswerBlock } from "@/data/discoverAssistant";
import { assistantStore, ask, newChat, openChat } from "@/screens/discover/assistantStore";
import { Glyph, type GlyphName } from "../ui/glyphs";
import { IconAgent } from "../ui/icons";
import { BlurLayers, V2Screen } from "../ui/shell";
import { veilOnScroll } from "../devices/veil";
import "../devices/devices.css";
import "./assistant.css";

/*
 * Ask Phenome. One question at a time, about the member's own record.
 *   Empty:  a quiet mark, one sentence on what it knows, and questions grouped
 *           by where the answer comes from, each a row with its source glyph.
 *   Chat:   the member's words in a navy bubble at the right; the answer as
 *           plain reading text at the left under a small byline, never a bubble.
 * The composer floats above the tab bar; history opens as a sheet of rows.
 */

const GROUPS: { title: string; items: { q: string; glyph: GlyphName }[] }[] = [
  {
    title: "Your results",
    items: [
      { q: SUGGESTIONS[0], glyph: "dna" },
      { q: "Why is my blood pressure above range?", glyph: "bp" },
      { q: "What changed since my last visit?", glyph: "report" },
    ],
  },
  {
    title: "Day to day",
    items: [
      { q: "How has my sleep been this week?", glyph: "moon" },
      { q: "What should I eat to support my heart?", glyph: "fork" },
    ],
  },
];

export function AssistantScreen() {
  const st = assistantStore.use();
  const offline = useOffline();
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const chat = st.chats.find((c) => c.id === st.current) ?? null;

  const count = chat?.msgs.length ?? 0;
  // a new question scrolls to the end; a new answer brings its question to the top, so it reads from the start
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !chat) return;
    const last = chat.msgs[chat.msgs.length - 1];
    const asked = el.querySelectorAll<HTMLElement>(".ai-you");
    const q = asked[asked.length - 1];
    const top = last?.role === "ai" && q ? q.offsetTop - 64 : el.scrollHeight;
    el.scrollTo({ top, behavior: count > 1 ? "smooth" : "auto" });
  }, [count, st.pending, chat?.id]);

  const send = (text = draft) => {
    if (!text.trim()) return;
    ask(text, offline);
    setDraft("");
  };

  return (
    <V2Screen>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="ai scroll" ref={scroller} onScroll={veilOnScroll}>
        <header className="dv-bar ai-bar">
          <h1 className="ai-title">{chat ? "" : "Ask"}</h1>
          <span className="ai-bar-acts">
            {chat && (
              <button className="dv-back ai-round" aria-label="New chat" onClick={newChat}>
                <PlusGlyph />
              </button>
            )}
            <button className="dv-back ai-round" aria-label="Chat history" onClick={() => setHistory(true)}>
              <ClockGlyph />
            </button>
          </span>
        </header>

        {chat ? (
          <div className="ai-thread">
            {chat.msgs.map((m) =>
              m.role === "user" ? (
                <p key={m.id} className="ai-you">
                  {m.text}
                </p>
              ) : (
                <Answer key={m.id} blocks={m.blocks} />
              ),
            )}
            {st.pending === "typing" && (
              <div className="ai-answer">
                <Byline />
                <span className="ai-typing" aria-label="Phenome is writing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            {st.pending === "stalled" && <p className="ai-stalled">You are offline. Your question will be answered when you reconnect.</p>}
          </div>
        ) : (
          <div className="ai-empty">
            <div className="ai-hero">
              <span className="ai-orb" aria-hidden>
                <IconAgent />
              </span>
              <h2>What would you like to know?</h2>
              <p>Answers draw on your visits, lab results and devices. For guidance, not a diagnosis.</p>
            </div>
            {GROUPS.map((g) => (
              <section key={g.title} className="dv-sec">
                <h3 className="dv-h">{g.title}</h3>
                <div className="dv-group">
                  {g.items.map((s) => (
                    <button key={s.q} className="ai-q" onClick={() => send(s.q)}>
                      <span className="ai-q-mark" aria-hidden>
                        <Glyph name={s.glyph} size={17} />
                      </span>
                      <span className="ai-q-t">{s.q}</span>
                      <ArrowGlyph />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="ai-floor" aria-hidden />
      <form
        className="ai-compose"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about your health" aria-label="Your question" />
        <button type="submit" className="ai-send" data-ready={draft.trim() ? "" : undefined} aria-label={draft.trim() ? "Send" : "Voice input"}>
          {draft.trim() ? <SendGlyph /> : <MicGlyph />}
        </button>
      </form>

      {history && <History onClose={() => setHistory(false)} />}
    </V2Screen>
  );
}

/** "**PEX5 Gene**: ..." as a bold run and the rest. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((part, i) => (part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>))}
    </>
  );
}

function Byline() {
  return (
    <span className="ai-by">
      <span className="ai-by-mark" aria-hidden>
        <IconAgent />
      </span>
      Phenome
    </span>
  );
}

function Answer({ blocks }: { blocks: AnswerBlock[] }) {
  return (
    <div className="ai-answer">
      <Byline />
      <div className="ai-read">
        {blocks.map((b, i) =>
          "p" in b ? (
            <p key={i}>
              <Rich text={b.p} />
            </p>
          ) : (
            <ol key={i}>
              {b.ol.map((li, j) => (
                <li key={j}>
                  <Rich text={li} />
                </li>
              ))}
            </ol>
          ),
        )}
      </div>
    </div>
  );
}

/** Past conversations: a sheet of rows, the open one ticked, a new chat at the top. */
function History({ onClose }: { onClose: () => void }) {
  const { chats, current } = assistantStore.use();
  return (
    <div className="ai-sheet-wrap" role="dialog" aria-modal aria-label="Chat history">
      <button className="ai-scrim" aria-label="Close" onClick={onClose} />
      <div className="ai-sheet">
        <span className="ai-grab" aria-hidden />
        <div className="ai-sheet-head">
          <h2>Chats</h2>
          <button
            className="ai-new"
            onClick={() => {
              newChat();
              onClose();
            }}
          >
            <PlusGlyph /> New
          </button>
        </div>
        {chats.length === 0 ? (
          <p className="ai-none">No chats yet. Your questions and answers will be kept here.</p>
        ) : (
          <>
            <h3 className="dv-h">Today</h3>
            <div className="dv-group">
              {chats.map((c) => (
                <button
                  key={c.id}
                  className="ai-q"
                  onClick={() => {
                    openChat(c.id);
                    onClose();
                  }}
                >
                  <span className="ai-q-t">
                    {c.title}
                    <small>{c.time}</small>
                  </span>
                  {c.id === current && (
                    <span className="ai-on" aria-label="Open">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const line = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function PlusGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...line} strokeWidth={2.2} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function ClockGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...line} aria-hidden>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3.5 4v4h4" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function ArrowGlyph() {
  return (
    <svg className="ai-q-go" width="16" height="16" viewBox="0 0 24 24" {...line} aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}
function SendGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...line} strokeWidth={2.4} aria-hidden>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
function MicGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" {...line} aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}
