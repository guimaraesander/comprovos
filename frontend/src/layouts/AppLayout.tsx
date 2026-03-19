import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const isAdmin = user?.role === "ADMIN";

  const navItems = [
    { to: "/", label: "Dashboard", icon: "▣", exact: true },
    { to: "/clients", label: "Clientes", icon: "👥" },
    { to: "/service-orders", label: "Ordens de Servico", icon: "🧾" },
    ...(isAdmin ? [{ to: "/users", label: "Usuarios", icon: "🔐" }] : []),
  ];

  const pageInfo = useMemo(() => {
    if (pathname === "/") {
      return { title: "Dashboard", subtitle: "Visao geral do sistema" };
    }

    if (pathname.startsWith("/clients")) {
      return { title: "Clientes", subtitle: "Cadastro e controle de clientes" };
    }

    if (pathname.startsWith("/service-orders")) {
      return {
        title: "Ordens de Servico",
        subtitle: "Acompanhe ordens abertas e finalizadas",
      };
    }

    if (pathname.startsWith("/users")) {
      return { title: "Usuarios", subtitle: "Acesso e permissoes da equipe" };
    }

    return { title: "ComprovOS", subtitle: "" };
  }, [pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <button
        className="menu-toggle"
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        aria-label="Abrir menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-icon-wrap">◎</div>
          <div>
            <h1>ComprovOS</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
              onClick={closeMenu}
            >
              <span className="sidebar-link-icon" aria-hidden="true">
                {link.icon}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{user?.name?.charAt(0) ?? "U"}</div>
            <div>
              <p>{user?.name}</p>
              <small>{user?.role}</small>
            </div>
          </div>
          <button onClick={logout} type="button">
            Sair da conta
          </button>
        </div>
      </aside>

      {menuOpen && <div className="sidebar-backdrop" onClick={closeMenu} aria-hidden="true" />}

      <main className="content">
        <header className="content-header">
          <div>
            <p className="kicker">Painel</p>
            <h2>{pageInfo.title}</h2>
            <p>{pageInfo.subtitle}</p>
          </div>
          <div className="header-tools">
            <input className="global-search" placeholder="Buscar clientes, ordens..." aria-label="Busca geral" />
            <div className="header-quick-actions">
              <NavLink className="header-action" to="/clients">
                + Cliente
              </NavLink>
              <NavLink className="header-action secondary" to="/service-orders">
                + Ordem
              </NavLink>
            </div>
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
