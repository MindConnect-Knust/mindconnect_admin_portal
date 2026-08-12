import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "admin_portal_session";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, [admin]);

  useEffect(() => {
    const expire = () => setAdmin(null);
    window.addEventListener("mindconnect:session-expired", expire);
    return () => window.removeEventListener("mindconnect:session-expired", expire);
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError("");
    try {
      const session = await api.login(email, password);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setAdmin(session);
      return true;
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout(admin?.refreshToken);
    setAdmin(null);
  }, [admin?.refreshToken]);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: Boolean(admin), login, logout, error, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}