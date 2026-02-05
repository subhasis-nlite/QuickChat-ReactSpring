// src/hooks/useChatSocket.ts
import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import type { Message } from "../api/client";
import { WS_URL } from "../app/constants";

export function useChatSocket(opts: {
  token: string;
  selectedChatId: string | null;
  selectedChatIdRef: React.MutableRefObject<string | null>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  refreshMessages: (chatId: string) => Promise<void>;
}) {
  const {
    token,
    selectedChatId,
    selectedChatIdRef,
    setMessages,
    refreshMessages,
  } = opts;

  const stompRef = useRef<Client | null>(null);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);

  function subscribeToChat(client: Client, chatId: string) {
    try {
      subRef.current?.unsubscribe?.();
    } catch {}
    subRef.current = null;

    subRef.current = client.subscribe(`/topic/chats/${chatId}`, (frame) => {
      const msg = JSON.parse(frame.body) as Message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
  }

  // connect once after login
  useEffect(() => {
    if (!token) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 1000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (s) => console.log("[stomp]", s),
    });

    client.onWebSocketError = (evt) => console.log("[ws-error]", evt);
    client.onStompError = (frame) =>
      console.log("[stomp-error]", frame.headers, frame.body);

    client.onConnect = () => {
      const chatId = selectedChatIdRef.current;
      if (chatId) subscribeToChat(client, chatId);
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

  // re-subscribe when chat changes
  useEffect(() => {
    const client = stompRef.current;
    if (!token || !client) return;
    if (!selectedChatId) return;

    // always refresh history on switch
    refreshMessages(selectedChatId);

    if (!client.connected) {
      const timer = window.setInterval(() => {
        const c = stompRef.current;
        if (c?.connected) {
          subscribeToChat(c, selectedChatId);
          window.clearInterval(timer);
        }
      }, 200);
      return () => window.clearInterval(timer);
    }

    subscribeToChat(client, selectedChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChatId]);

  function sendMessage(selectedChatId: string, content: string) {
    const client = stompRef.current;
    if (!client || !client.connected) {
      throw new Error(
        "WebSocket not connected yet. Wait 1–2 seconds and try again.",
      );
    }

    client.publish({
      destination: `/app/chats/${selectedChatId}/send`,
      body: JSON.stringify({ content }),
    });
  }

  function disconnect() {
    try {
      subRef.current?.unsubscribe?.();
    } catch {}
    stompRef.current?.deactivate?.();
    stompRef.current = null;
    subRef.current = null;
  }

  return { sendMessage, disconnect };
}
