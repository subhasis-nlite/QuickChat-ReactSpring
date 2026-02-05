// src/App.tsx
import { useState } from "react";
import "./App.css";

import { useAuth } from "./hooks/useAuth";
import { useChats } from "./hooks/useChats";
import { useMessages } from "./hooks/useMessages";
import { useChatSocket } from "./hooks/useChatSocket";

import { LoginView } from "./components/LoginView";
import { ChatShell } from "./components/ChatShell";

export default function App() {
  const auth = useAuth();
  const { token, user, me } = auth;

  const chats = useChats(token);
  const msgs = useMessages(token, chats.selectedChatId);

  const socket = useChatSocket({
    token,
    selectedChatId: chats.selectedChatId,
    selectedChatIdRef: chats.selectedChatIdRef,
    setMessages: msgs.setMessages,
    refreshMessages: msgs.refreshMessages,
  });

  const [newMessage, setNewMessage] = useState("");

  function onLogout() {
    socket.disconnect(); // important: stop websocket before clearing auth
    auth.onLogout();
    // reset UI state that lives outside hooks
    setNewMessage("");
  }

  async function onSend() {
    if (!chats.selectedChatId) return;
    const content = newMessage.trim();
    if (!content) return;

    setNewMessage("");
    socket.sendMessage(chats.selectedChatId, content);
  }

  if (!token || !user) {
    return (
      <LoginView
        loginName={auth.loginName}
        setLoginName={auth.setLoginName}
        loginError={auth.loginError}
        onLogin={auth.onLogin}
      />
    );
  }

  return (
    <ChatShell
      me={me}
      chats={chats.chats}
      selectedChatId={chats.selectedChatId}
      setSelectedChatId={chats.setSelectedChatId}
      newChatTitle={chats.newChatTitle}
      setNewChatTitle={chats.setNewChatTitle}
      newChatParticipant={chats.newChatParticipant}
      setNewChatParticipant={chats.setNewChatParticipant}
      onCreateChat={chats.onCreateChat}
      selectedChat={chats.selectedChat}
      messages={msgs.messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSend={onSend}
      onLogout={onLogout}
    />
  );
}
