import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../src/routes/ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("../src/context/AuthContext", () => {
  return {
    useAuth: () => mockUseAuth(),
  };
});

function renderProtected(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Área protegida</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Tela de login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("deve renderizar nada enquanto a autenticação está carregando", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = renderProtected();

    expect(container).toBeEmptyDOMElement();
  });

  it("deve redirecionar para login quando usuário não estiver autenticado", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByText("Tela de login")).toBeInTheDocument();
  });

  it("deve renderizar a área protegida quando usuário estiver autenticado", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: "user-1",
        name: "Administrador",
        email: "admin@comprovos.com",
        role: "ADMIN",
      },
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderProtected();

    expect(screen.getByText("Área protegida")).toBeInTheDocument();
  });
});