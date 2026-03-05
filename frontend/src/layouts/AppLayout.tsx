import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>ComprovOS</h1>
          <p>Painel interno</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/clients">Clientes</NavLink>
          <NavLink to="/devices">Equipamentos</NavLink>
          <NavLink to="/service-orders">Ordens de Serviço</NavLink>
        </nav>

        <div className="sidebar-user">
          <p>{user?.name}</p>
          <small>{user?.role}</small>
          <button onClick={logout} type="button">
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <div>
            <h2>ComprovOS</h2>
            <p>Gestão de Ordens de Serviço em Nuvem</p>
          </div>
        </header>

        <div className="content-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}