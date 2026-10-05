import React, { createContext, useState, useEffect } from "react";
import { api } from "../services/api";
export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true);
  function clearSession() { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); }
  async function logout() {
    try { if (localStorage.getItem("token")) await api.post("/logout"); }
    finally { clearSession(); }
  }
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!localStorage.getItem("token")) { if (active) setLoading(false); return; }
      try {
        const { data } = await api.get("/me");
        if (active) { setUser(data.user); localStorage.setItem("user", JSON.stringify(data.user)); }
      } catch { if (active) clearSession(); }
      finally { if (active) setLoading(false); }
    }
    restore();
    const expired = () => clearSession();
    window.addEventListener("auth:expired", expired);
    return () => { active = false; window.removeEventListener("auth:expired", expired); };
  }, []);
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    let timeout;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (!Number.isFinite(payload.exp)) { clearSession(); return; }
      timeout = setTimeout(clearSession, Math.min(2147483647, Math.max(0, payload.exp * 1000 - Date.now())));
    } catch { clearSession(); }
    return () => clearTimeout(timeout);
  }, [user]);
  async function login(userData, token) { localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(userData)); setUser(userData); }
  const can = permission => !!user && (user.role === "admin" || user.permissions?.includes(permission));
  if (loading) return <div>Carregando…</div>;
  return <AuthContext.Provider value={{ user, can, setUser, isAuthenticated: !!user, login, logout }}>{children}</AuthContext.Provider>;
};
