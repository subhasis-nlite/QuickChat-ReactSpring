const API = "http://192.168.1.8:8080/api";

export type User = { id: string; username: string };

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

function getToken() {
  return localStorage.getItem("qc_token") || "";
}

async function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res;
}

// -------- AUTH --------
export async function login(
  username: string,
): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export function logout() {
  localStorage.removeItem("qc_token");
  localStorage.removeItem("qc_user");
}

// -------- CHATS --------
export async function listChats(): Promise<Chat[]> {
  const res = await apiFetch(`${API}/chats`);
  return res.json();
}

export async function createChat(title: string, participantUsernames: string[]): Promise<Chat> {
  const res = await apiFetch(`${API}/chats`, {
    method: "POST",
    body: JSON.stringify({ title, participantUsernames }),
  });
  return res.json();
}

// -------- MESSAGES --------
export async function listMessages(chatId: string): Promise<Message[]> {
  const res = await apiFetch(`${API}/chats/${chatId}/messages`);
  return res.json();
}

export async function sendMessage(
  chatId: string,
  content: string,
): Promise<Message> {
  const res = await apiFetch(`${API}/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return res.json();
}
