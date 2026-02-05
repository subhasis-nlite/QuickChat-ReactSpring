// src/hooks/useChats.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Chat } from "../api/client";
import { createChat, listChats } from "../api/client";

export function useChats(token: string) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [newChatTitle, setNewChatTitle] = useState("");
  const [newChatParticipant, setNewChatParticipant] = useState("");

  // keep latest selection available for other async code
  const selectedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  async function refreshChats() {
    const data = await listChats();
    setChats(data);
    if (!selectedChatIdRef.current && data.length > 0) {
      setSelectedChatId(data[0].id);
    }
  }

  useEffect(() => {
    if (!token) return;
    refreshChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onCreateChat() {
    const title = newChatTitle.trim();
    const participants = newChatParticipant
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title) {
      alert("Enter a chat title");
      return;
    }
    if (participants.length < 1) {
      alert("Enter at least one participant username");
      return;
    }

    try {
      await createChat(title, participants);
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

  return {
    chats,
    selectedChatId,
    setSelectedChatId,
    selectedChat,
    refreshChats,

    newChatTitle,
    setNewChatTitle,
    newChatParticipant,
    setNewChatParticipant,
    onCreateChat,

    selectedChatIdRef, // used by socket hook
  };
}
