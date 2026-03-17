import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/pages/LoginPage";

const mockLogin = vi.fn();

vi.mock("../src/context/AuthContext", () => {
  return {
    useAuth: () => ({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
      user: null,
      logout: vi.fn(),
    }),
  };
});

function renderLogin(initialEntry = "/login") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Página inicial</div>} />
        <Route path="/clients" element={<div>Página de clientes</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o formulário de login", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: /comprovos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("deve chamar login com email e senha informados", async () => {
    mockLogin.mockResolvedValue(undefined);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@comprovos.com" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "admin@comprovos.com",
        password: "123456",
      });
    });
  });

  it("deve exibir mensagem amigável quando o login retornar 401", async () => {
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          message: "Credenciais inválidas.",
        },
      },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@comprovos.com" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "senha-invalida" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    expect(await screen.findByText("Email ou senha inválidos.")).toBeInTheDocument();
  });

  it("deve exibir mensagem quando não conseguir conectar ao servidor", async () => {
    mockLogin.mockRejectedValue({
      isAxiosError: true,
      response: undefined,
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "admin@comprovos.com" },
    });

    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText("Não foi possível conectar ao servidor.")
    ).toBeInTheDocument();
  });
});