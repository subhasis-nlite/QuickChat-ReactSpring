// src/hooks/useAuth.ts
import { useState } from "react";
import type { User } from "../api/client";
import { login as apiLogin, logout as apiLogout } from "../api/client";
import { clearAuth, getStoredAuth, storeAuth } from "../app/storage";

export function useAuth() {
  const [{ token, user }, setAuth] = useState(getStoredAuth);
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");

  const me = user?.username ?? "";

  async function onLogin() {
    setLoginError("");
    const username = loginName.trim();
    if (!username) return;

    try {
      const res = await apiLogin(username);
      storeAuth(res.token, res.user);
      setAuth({ token: res.token, user: res.user });
    } catch (e: any) {
      setLoginError(e?.message || "Login failed");
    }
  }

  function onLogout() {
    apiLogout();
    clearAuth();
    setAuth({ token: "", user: null });
  }

  return {
    token,
    user,
    me,
    loginName,
    setLoginName,
    loginError,
    onLogin,
    onLogout,
    // expose setter if other hooks need to force logout on auth error later
    _setAuth: setAuth,
  };
}
