import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import type { Chat, Message, User } from "./api/client";
import {
  createChat,
  listChats,
  listMessages,
  login,
  logout,
} from "./api/client";
import { Client } from "@stomp/stompjs";

const API_BASE = "192.168.1.8:8080";
const WS_URL = `ws://${API_BASE}/ws`;

function getStoredAuth(): { token: string; user: User | null } {
  const token = localStorage.getItem("qc_token") || "";
  const userStr = localStorage.getItem("qc_user") || "";
  try {
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return { token, user };
  } catch {
    return { token, user: null };
  }
}

export default function App() {
  const [{ token, user }, setAuth] = useState(getStoredAuth);

  const me = user?.username ?? "";

  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [newChatParticipant, setNewChatParticipant] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const stompRef = useRef<Client | null>(null);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  async function refreshChats() {
    const data = await listChats();
    setChats(data);
    if (!selectedChatId && data.length > 0) setSelectedChatId(data[0].id);
  }

  async function refreshMessages(chatId: string) {
    const data = await listMessages(chatId);
    setMessages(data);
  }

  // ---------- LOGIN ----------
  async function onLogin() {
    setLoginError("");
    const username = loginName.trim();
    if (!username) return;

    try {
      const res = await login(username);
      localStorage.setItem("qc_token", res.token);
      localStorage.setItem("qc_user", JSON.stringify(res.user));
      setAuth({ token: res.token, user: res.user });
    } catch (e: any) {
      setLoginError(e?.message || "Login failed");
    }
  }

  function onLogout() {
    try {
      subRef.current?.unsubscribe?.();
    } catch {}
    stompRef.current?.deactivate?.();
    stompRef.current = null;
    subRef.current = null;

    logout();
    setAuth({ token: "", user: null });
    setChats([]);
    setMessages([]);
    setSelectedChatId(null);
  }

  // ---------- AFTER LOGIN: load chats ----------
  useEffect(() => {
    if (!token) return;
    refreshChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- load messages when chat changes ----------
  useEffect(() => {
    if (!token) return;
    if (selectedChatId) refreshMessages(selectedChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChatId]);

  // ---------- WebSocket connect (after login) ----------
  useEffect(() => {
    if (!token) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 1000,
      connectHeaders: {
        Authorization: `Bearer ${token}`, // IMPORTANT
      },
    });

    client.onConnect = () => {
      // subscribe to currently selected chat
      if (selectedChatId) {
        subRef.current = client.subscribe(
          `/topic/chats/${selectedChatId}`,
          (frame) => {
            const msg = JSON.parse(frame.body) as Message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          },
        );
      }
    };

    client.activate();
    stompRef.current = client;

    return () => {
      try {
        subRef.current?.unsubscribe?.();
      } catch {}
      client.deactivate();
      stompRef.current = null;
      subRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- re-subscribe when chat changes ----------
  useEffect(() => {
    const client = stompRef.current;
    if (!token || !client || !client.connected) return;

    try {
      subRef.current?.unsubscribe?.();
    } catch {}

    if (!selectedChatId) return;
    refreshMessages(selectedChatId);

    subRef.current = client.subscribe(
      `/topic/chats/${selectedChatId}`,
      (frame) => {
        const msg = JSON.parse(frame.body) as Message;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChatId]);

  async function onCreateChat() {
    const title = newChatTitle.trim();
    const participantName = newChatParticipant.trim();

    if (!title) {
      alert("Enter a chat title");
      return;
    }
    if (!participantName) {
      alert("Enter participant username for 1-to-1 chat");
      return;
    }

    try {
      await createChat(title, [participantName]);
      setNewChatTitle("");
      setNewChatParticipant("");
      await refreshChats();
    } catch (e) {
      alert(
        "Failed to create chat: " +
          (e instanceof Error ? e.message : "Unknown error"),
      );
    }
  }

  // Send via WebSocket (server will set sender)
  async function onSend() {
    if (!selectedChatId) return;
    const content = newMessage.trim();
    if (!content) return;

    setNewMessage("");
    const client = stompRef.current;

    if (client && client.connected) {
      client.publish({
        destination: `/app/chats/${selectedChatId}/send`,
        body: JSON.stringify({ content }), // NO sender
      });
      return;
    }

    // fallback: refresh (optional). Usually WS is connected.
    await refreshMessages(selectedChatId);
  }

  // ---------- UI ----------
  if (!token || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            width: 360,
            maxWidth: "100%",
            background: "white",
            padding: 16,
            borderRadius: 12,
            border: "1px solid #ddd",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
            QuickChat Login
          </div>
          <input
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            placeholder="Enter username (e.g. amit)"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              marginBottom: 10,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onLogin();
            }}
          />
          <button
            onClick={onLogin}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
            }}
          >
            Login
          </button>
          {loginError && (
            <div style={{ marginTop: 10, color: "crimson" }}>{loginError}</div>
          )}
        </div>
      </div>
    );
  }

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
          />
          <input
            value={newChatParticipant}
            onChange={(e) => setNewChatParticipant(e.target.value)}
            placeholder="Participant username..."
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
            onKeyDown={(e) => {
              if (e.key === "Enter") onSend();
            }}
          />
          <button onClick={onSend}>Send</button>
        </div>
      </main>
    </div>
  );
}
