const API = "http://192.168.1.8:8080/api";

export type Chat = {
  id: string;
  title: string;
  createdAt: string;
};

export type Message = {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
};

export async function listChats(): Promise<Chat[]> {
  const res = await fetch(`${API}/chats`);
  if (!res.ok) throw new Error("Failed to load chats");
  return res.json();
}

export async function createChat(title: string): Promise<Chat> {
  const res = await fetch(`${API}/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create chat");
  return res.json();
}

export async function listMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`${API}/chats/${chatId}/messages`);
  if (!res.ok) throw new Error("Failed to load messages");
  return res.json();
}

export async function sendMessage(
  chatId: string,
  content: string,
  sender: string,
): Promise<Message> {
  const res = await fetch(`${API}/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, sender }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
