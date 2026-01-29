import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { createChat, listChats, listMessages, sendMessage } from "./api/client";
import type { Chat, Message } from "./api/client";
import { Client } from "@stomp/stompjs";

const API_BASE = "192.168.1.8:8080"; // same host/port as backend
const WS_URL = `ws://${API_BASE}/ws`;

function getOrCreateMe() {
  const key = "qc_me";
  const existing = localStorage.getItem(key);
  if (existing && existing.trim()) return existing;

  const suggested = `user${Math.floor(Math.random() * 9000 + 1000)}`;
  const name = window.prompt("Choose your name", suggested) || suggested;
  localStorage.setItem(key, name);
  return name;
}

export default function App() {
  const me = useMemo(() => getOrCreateMe(), []);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const stompRef = useRef<Client | null>(null);
  const subRef = useRef<any>(null);

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

  // Initial load
  useEffect(() => {
    refreshChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when chat changes
  useEffect(() => {
    if (selectedChatId) refreshMessages(selectedChatId);
  }, [selectedChatId]);

  // Connect STOMP once
  useEffect(() => {
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 1000,
    });

    client.onConnect = () => {
      // when connected, subscribe to currently selected chat (if any)
      if (selectedChatId) {
        subRef.current = client.subscribe(
          `/topic/chats/${selectedChatId}`,
          (frame) => {
            const msg = JSON.parse(frame.body) as Message;
            setMessages((prev) => {
              // avoid duplicates if you refresh + WS same time
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-subscribe when selected chat changes
  useEffect(() => {
    const client = stompRef.current;
    if (!client || !client.connected) return;

    try {
      subRef.current?.unsubscribe?.();
    } catch {}

    if (!selectedChatId) return;

    // also refresh messages from REST (history)
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
  }, [selectedChatId]);

  async function onCreateChat() {
    const title = newChatTitle.trim();
    if (!title) return;
    await createChat(title);
    setNewChatTitle("");
    await refreshChats();
  }

  // Send via WebSocket if connected; else fallback to REST
  async function onSend() {
    if (!selectedChatId) return;
    const content = newMessage.trim();
    if (!content) return;

    const client = stompRef.current;
    setNewMessage("");

    if (client && client.connected) {
      client.publish({
        destination: `/app/chats/${selectedChatId}/send`,
        body: JSON.stringify({ content, sender: me }),
      });
      return;
    }

    // fallback (in case WS not connected)
    await sendMessage(selectedChatId, content, me);
    await refreshMessages(selectedChatId);
  }

  return (
    <div className="qc-app">
      <aside className="qc-sidebar">
        <div className="qc-sidebar-header">
          QuickChat <span style={{ opacity: 0.7, fontSize: 12 }}>({me})</span>
        </div>

        <div className="qc-newchat">
          <input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="New chat title..."
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
