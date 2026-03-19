import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "🏠", exact: true },
  { to: "/clients", label: "Clientes", icon: "👤" },
  { to: "/service-orders", label: "Ordens de Serviço", icon: "🛠️" },
  { to: "/users", label: "Usuários", icon: "👥", adminOnly: true },
];

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const closeMenu = () => setMenuOpen(false);
  const userInitial = user?.name?.trim().charAt(0)?.toUpperCase() || "U";

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
          {navItems.map((link) => (
            (!link.adminOnly || user?.role === "ADMIN") && (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) => (isActive ? "sidebar-link active" : "sidebar-link")}
                onClick={closeMenu}
              >
                <span className="sidebar-link-icon" aria-hidden="true">
                  {link.icon}
                </span>
                {link.label}
              </NavLink>
            )
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{userInitial}</div>
            <div>
              <p>{user?.name || "Usuário"}</p>
              <small>{user?.role || "Sem papel definido"}</small>
            </div>
          </div>
          <button type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} aria-hidden="true" />}

      <main className="content">
        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
