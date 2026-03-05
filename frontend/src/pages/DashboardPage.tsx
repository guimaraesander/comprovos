import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <p style={{ color: "#64748b" }}>
        Bem-vindo ao painel interno do ComprovOS.
      </p>

      <div
        style={{
          marginTop: "16px",
          padding: "16px",
          borderRadius: "12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Usuário:</strong> {user?.name}
        </p>
        <p style={{ margin: "8px 0 0 0" }}>
          <strong>Email:</strong> {user?.email}
        </p>
        <p style={{ margin: "8px 0 0 0" }}>
          <strong>Perfil:</strong> {user?.role}
        </p>
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "grid",
          gap: "12px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <div className="dashboard-card">
          <h3>Clientes</h3>
          <p>Cadastro e consulta</p>
        </div>
        <div className="dashboard-card">
          <h3>Equipamentos</h3>
          <p>Gerenciamento dos devices</p>
        </div>
        <div className="dashboard-card">
          <h3>Ordens de Serviço</h3>
          <p>Abertura e status das OS</p>
        </div>
      </div>
    </section>
  );
}