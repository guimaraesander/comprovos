import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/clients", label: "Clientes" },
  { to: "/service-orders", label: "Ordens de Servico" },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <button
        className="menu-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Abrir ou fechar menu"
      >
        <span />
        <span />
        <span />
      </button>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <h1>ComprovOS</h1>
          <p>Painel</p>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}

          {user?.role === "ADMIN" && (
            <NavLink
              to="/users"
              className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
              onClick={() => setMenuOpen(false)}
            >
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="sidebar-user">
          <p>{user?.name || "Usuario"}</p>
          <small>{user?.role || "Sem papel definido"}</small>
          <button type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <main className="content">
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
