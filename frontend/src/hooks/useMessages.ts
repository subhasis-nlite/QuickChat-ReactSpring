// src/hooks/useMessages.ts
import { useEffect, useState } from "react";
import type { Message } from "../api/client";
import { listMessages } from "../api/client";

export function useMessages(token: string, selectedChatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);

  async function refreshMessages(chatId: string) {
    const data = await listMessages(chatId);
    setMessages(data);
  }

  useEffect(() => {
    if (!token) return;
    if (selectedChatId) refreshMessages(selectedChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedChatId]);

  return { messages, setMessages, refreshMessages };
}
