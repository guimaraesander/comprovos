import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api, setApiAuthToken } from "../services/api";

type UserRole = "ADMIN" | "TECNICO";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  user: AuthUser;
  token: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_TOKEN_KEY = "comprovos:token";
const STORAGE_USER_KEY = "comprovos:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão ao abrir o app
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);

      if (savedToken) {
        setToken(savedToken);
        setApiAuthToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser) as AuthUser);
      }
    } catch {
      // Se corromper storage, limpa e segue
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      setApiAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function login(input: LoginInput) {
    const email = input.email?.trim();
    const password = input.password;

    if (!email || !password) {
      throw new Error("Email e senha são obrigatórios.");
    }

    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });

      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));

      setApiAuthToken(newToken);
    } catch (err) {
      // Padroniza erros pra UI
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiMessage = (err.response?.data as { message?: string } | undefined)?.message;

        if (!err.response) {
          throw new Error("Não foi possível conectar ao servidor.");
        }

        if (status === 401) {
          throw new Error("Credenciais inválidas.");
        }

        throw new Error(apiMessage || "Falha ao realizar login.");
      }

      throw err instanceof Error ? err : new Error("Falha ao realizar login.");
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setApiAuthToken(null);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider />");
  return ctx;
}