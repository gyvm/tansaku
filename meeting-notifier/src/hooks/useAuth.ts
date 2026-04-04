import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AuthState } from "../types";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false });
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const state = await invoke<AuthState>("get_auth_status");
      setAuth(state);
    } catch {
      setAuth({ isAuthenticated: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      await invoke("start_oauth");
      await checkAuth();
    } catch (e) {
      console.error("Login failed:", e);
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await invoke("logout");
      setAuth({ isAuthenticated: false });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }, []);

  return { auth, loading, login, logout };
}
