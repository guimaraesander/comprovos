import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

type AuthContextData = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

const STORAGE_KEY = "comprovos.auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { user?: AuthUser; token?: string };
      if (parsed?.token && parsed?.user) {
        setUser(parsed.user);
        setToken(parsed.token);
        setApiAuthToken(parsed.token);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = useCallback((nextUser: AuthUser | null, nextToken: string | null) => {
    if (nextUser && nextToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
      setApiAuthToken(nextToken);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setApiAuthToken(null);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const email = input.email.trim();
      const password = input.password;

      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      const nextUser = res.data.user;
      const nextToken = res.data.token;

      setUser(nextUser);
      setToken(nextToken);
      persist(nextUser, nextToken);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    persist(null, null);
  }, [persist]);

  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setUser(null);
          setToken(null);
          persist(null, null);
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [persist]);

  const value = useMemo<AuthContextData>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, token, isAuthenticated, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}