import { Sheet } from "@/components/Overlay";
import { assistantStore, newChat, openChat } from "./assistantStore";
import { ChatBubble, Plus, Radio } from "./icons";

/** "Chat history" bottom sheet — capture assistant/history (sheet top y 239). */
export function AssistantHistory({ onClose }: { onClose: () => void }) {
  const { chats, current } = assistantStore.use();
  return (
    <Sheet open onClose={onClose} handle height={614}>
      <div className="ah">
        <div className="ah-head">
          <h2>Chat history</h2>
          <button
            className="ah-new"
            onClick={() => {
              newChat();
              onClose();
            }}
          >
            <Plus size={17} /> New chat
          </button>
        </div>
        {/* TODO(fidelity): only "Today" grouping was captured; older groups not reproduced */}
        {chats.length > 0 && <p className="ah-group">Today</p>}
        {chats.map((c) => (
          <button
            key={c.id}
            className="ah-item"
            data-on={c.id === current || undefined}
            onClick={() => {
              openChat(c.id);
              onClose();
            }}
          >
            <span className="ah-icon">
              <ChatBubble size={15} />
            </span>
            <span className="ah-text">
              <span className="ah-title">{c.title}</span>
              <span className="ah-time">{c.time}</span>
            </span>
            {c.id === current && (
              <span className="ah-check">
                <Radio on size={19} />
              </span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
