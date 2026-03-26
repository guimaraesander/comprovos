import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // âœ… Evita navegar no meio do render com navigate(), usando Navigate Ã© mais seguro
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // âœ… MantÃ©m compatibilidade com o seu AuthContext atual
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const axiosLike = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (axiosLike.response) {
        const status = axiosLike.response.status;
        const apiMessage = axiosLike.response.data?.message;

        if (status === 401) {
          setErrorMessage("Email ou senha inválidos.");
        } else if (status === 400) {
          setErrorMessage("Dados inválidos. Verifique email e senha.");
        } else {
          setErrorMessage(apiMessage || "Falha ao realizar login.");
        }
      } else if (axios.isAxiosError(error)) {
        setErrorMessage("Não foi possível conectar ao servidor.");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Não foi possível conectar ao servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>ComprovOS</h1>
          <p>Acesse o painel interno</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@comprovos.com"
              required
              autoComplete="username"
            />
          </label>

          <label>
            Senha
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                autoComplete="current-password"
                style={{ width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: '#666'
                }}
              >
                {showPassword ? "Esconder" : "Mostrar"}
              </button>
            </div>
          </label>

          {errorMessage && (
            <div className="auth-error" role="alert" aria-live="polite" data-testid="login-error">
              {errorMessage}
            </div>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="auth-footer">
          <small>
            Ambiente de teste:
            <br />
            - ADM: admin@comprovos.com / 123456
            <br />
            - TÉCNICO: tecnico@comprovos.com / 123456
          </small>
        </div>
      </section>
    </main>
  );
}

