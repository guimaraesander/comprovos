// frontend/src/pages/DashboardPage.tsx
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Muted } from "../components/Alert";

export function DashboardPage() {
  return (
    <section className="content-body">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do ComprovOS (painel interno)."
      />

      <Card>
        <h3 style={{ marginTop: 0 }}>Bem-vindo 👋</h3>
        <Muted>
          Aqui vamos mostrar indicadores rápidos (OS abertas, em manutenção,
          aguardando aprovação, finalizadas, etc.).
        </Muted>

        <div style={{ marginTop: 12 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Atalho: Clientes</li>
            <li>Atalho: Equipamentos</li>
            <li>Atalho: Ordens de Serviço</li>
          </ul>
        </div>
      </Card>
    </section>
  );
}