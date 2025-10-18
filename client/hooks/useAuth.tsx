import React, { createContext, useContext, useEffect, useState } from "react";

type Role = "ADMIN" | "MANAGER" | "DEVELOPER" | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sf_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("sf_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setToken(null); setUser(null); localStorage.removeItem("sf_token"); localStorage.removeItem("sf_user"); return; }
        const data = await res.json();
        setUser(data);
        localStorage.setItem("sf_user", JSON.stringify(data));
      } catch (err) {
        setToken(null);
        setUser(null);
      }
    })();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error("Login failed");
    const payload = await res.json();
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem("sf_token", payload.token);
    localStorage.setItem("sf_user", JSON.stringify(payload.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
