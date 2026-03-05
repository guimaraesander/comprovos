import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setApiAuthToken } from "../services/api";

type UserRole = "ADMIN" | "TECNICO";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextData = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
};

const AUTH_STORAGE_KEY = "@comprovos:auth";

const AuthContext = createContext<AuthContextData | undefined>(undefined);

type AuthStorageData = {
  token: string;
  user: AuthUser;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuthData = useCallback((data: AuthStorageData) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuthData();
    setApiAuthToken(null);
  }, [clearAuthData]);

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      const response = await api.post("/auth/login", { email, password });

      const responseUser = response.data?.user as AuthUser | undefined;
      const responseToken = response.data?.token as string | undefined;

      if (!responseUser || !responseToken) {
        throw new Error("Resposta de login invalida");
      }

      setUser(responseUser);
      setToken(responseToken);

      setApiAuthToken(responseToken);

      saveAuthData({
        token: responseToken,
        user: responseUser,
      });
    },
    [saveAuthData]
  );

  useEffect(() => {
    async function restoreSession() {
      try {
        const storageRaw = localStorage.getItem(AUTH_STORAGE_KEY);

        if (!storageRaw) {
          setIsLoading(false);
          return;
        }

        const parsed = JSON.parse(storageRaw) as Partial<AuthStorageData>;

        if (!parsed.token) {
          logout();
          setIsLoading(false);
          return;
        }

        setApiAuthToken(parsed.token);

        // Valida token no backend e pega user atual
        const meResponse = await api.get<AuthUser>("/auth/me");

        const meUser = meResponse.data;

        setToken(parsed.token);
        setUser(meUser);

        saveAuthData({
          token: parsed.token,
          user: meUser,
        });
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, [logout, saveAuthData]);

  const value = useMemo<AuthContextData>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}