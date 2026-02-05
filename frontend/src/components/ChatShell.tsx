// src/components/ChatShell.tsx
import type { Chat, Message } from "../api/client";

export function ChatShell(props: {
  me: string;

  chats: Chat[];
  selectedChatId: string | null;
  setSelectedChatId: (id: string) => void;

  newChatTitle: string;
  setNewChatTitle: (v: string) => void;
  newChatParticipant: string;
  setNewChatParticipant: (v: string) => void;
  onCreateChat: () => void;

  selectedChat: Chat | null;
  messages: Message[];

  newMessage: string;
  setNewMessage: (v: string) => void;
  onSend: () => void;

  onLogout: () => void;
}) {
  const {
    me,
    chats,
    selectedChatId,
    setSelectedChatId,
    newChatTitle,
    setNewChatTitle,
    newChatParticipant,
    setNewChatParticipant,
    onCreateChat,
    selectedChat,
    messages,
    newMessage,
    setNewMessage,
    onSend,
    onLogout,
  } = props;

  return (
    <div className="qc-app">
      <aside className="qc-sidebar">
        <div className="qc-sidebar-header">
          QuickChat <span style={{ opacity: 0.7, fontSize: 12 }}>({me})</span>
          <button onClick={onLogout} style={{ float: "right" }}>
            Logout
          </button>
        </div>

        <div className="qc-newchat">
          <input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Chat title..."
            onKeyDown={(e) => e.key === "Enter" && onCreateChat()}
          />
          <input
            value={newChatParticipant}
            onChange={(e) => setNewChatParticipant(e.target.value)}
            placeholder="Participants (comma-separated: deba, amit, sara)..."
            onKeyDown={(e) => e.key === "Enter" && onCreateChat()}
          />
          <button onClick={onCreateChat}>+</button>
        </div>

        <div className="qc-chatlist">
          {chats.map((c) => (
            <button
              key={c.id}
              className={
                "qc-chatitem " + (c.id === selectedChatId ? "active" : "")
              }
              onClick={() => setSelectedChatId(c.id)}
            >
              <div className="qc-chattitle">{c.title}</div>
              <div className="qc-chatsub">
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="qc-main">
        <div className="qc-main-header">
          {selectedChat ? selectedChat.title : "Select a chat"}
        </div>

        <div className="qc-messages">
          {messages.map((m) => {
            const mine = m.sender === me;
            return (
              <div
                key={m.id}
                className={"qc-msg " + (mine ? "mine" : "theirs")}
              >
                <div className="qc-msg-meta">
                  <span className="qc-msg-sender">{m.sender}</span>
                  <span className="qc-msg-time">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="qc-msg-bubble">{m.content}</div>
              </div>
            );
          })}
        </div>

        <div className="qc-composer">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />
          <button onClick={onSend}>Send</button>
        </div>
      </main>
    </div>
  );
}
