import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "admin_portal_session";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [admin]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError("");
    try {
      const session = await api.login(email, password);
      setAdmin(session);
      return true;
    } catch (err) {
      setError(err.message || "Unable to sign in.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => setAdmin(null), []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout, error, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
