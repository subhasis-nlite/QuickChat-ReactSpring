// src/app/storage.ts
import type { User } from "../api/client";

export function getStoredAuth(): { token: string; user: User | null } {
  const token = localStorage.getItem("qc_token") || "";
  const userStr = localStorage.getItem("qc_user") || "";
  try {
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return { token, user };
  } catch {
    return { token, user: null };
  }
}

export function storeAuth(token: string, user: User) {
  localStorage.setItem("qc_token", token);
  localStorage.setItem("qc_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("qc_token");
  localStorage.removeItem("qc_user");
}
