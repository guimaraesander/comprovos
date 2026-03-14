// frontend\src\pages\DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { Button } from "../components/Button";
import { AlertError, Muted } from "../components/Alert";

import { listServiceOrders, type ServiceOrder, type ServiceOrderStatus } from "../services/serviceOrders";

import styles from "./DashboardPage.module.css";

function safeErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || "Não foi possível concluir a operação.";
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível concluir a operação.";
}

const STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  ABERTA: "ABERTA",
  EM_ANALISE: "EM ANÁLISE",
  AGUARDANDO_APROVACAO: "AGUARD. APROVAÇÃO",
  EM_MANUTENCAO: "EM MANUTENÇÃO",
  FINALIZADA: "FINALIZADA",
  ENTREGUE: "ENTREGUE",
  CANCELADA: "CANCELADA",
};

function statusDotStyle(status: ServiceOrderStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
    verticalAlign: "middle",
    border: "1px solid rgba(0,0,0,0.10)",
  };

  if (status === "CANCELADA") return { ...base, background: "#fda29b", borderColor: "#f97066" };
  if (status === "ENTREGUE") return { ...base, background: "#6ce9a6", borderColor: "#32d583" };
  if (status === "FINALIZADA") return { ...base, background: "#84caff", borderColor: "#53b1fd" };
  if (status === "EM_MANUTENCAO") return { ...base, background: "#fedf89", borderColor: "#fdb022" };
  if (status === "AGUARDANDO_APROVACAO") return { ...base, background: "#fec84b", borderColor: "#f79009" };
  if (status === "EM_ANALISE") return { ...base, background: "#7cd4fd", borderColor: "#36bffa" };
  return { ...base, background: "#cbd5e1", borderColor: "#94a3b8" };
}

function equipmentLabel(order: ServiceOrder) {
  const parts = [order.equipmentType, order.equipmentBrand, order.equipmentModel].filter(Boolean);
  return parts.join(" ") || "-";
}

function formatDateTimeBR(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  async function load() {
    setPageError(null);
    setLoading(true);
    try {
      const data = await listServiceOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setPageError(null);
    setRefreshing(true);
    try {
      const data = await listServiceOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const lastOrders = useMemo(() => {
    // A API já traz desc por createdAt, mas garantimos estabilidade
    const list = Array.isArray(orders) ? [...orders] : [];
    list.sort((a, b) => (b.osNumber ?? 0) - (a.osNumber ?? 0));
    return list.slice(0, 6);
  }, [orders]);

  return (
    <section className="content-body">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do ComprovOS (painel interno)."
        actions={
          <Button type="button" variant="secondary" onClick={refresh} disabled={loading || refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        }
      />

      {pageError && <AlertError className="mb-12">{pageError}</AlertError>}

      <div className={styles.grid}>
        {/* Ações rápidas */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Ações rápidas</div>
              <div className={styles.cardSubtitle}>Atalhos para as telas principais.</div>
            </div>
          </div>

          <div className={styles.actionsGrid}>
            <a className={styles.actionTile} href="/clients">
              <div className={styles.actionIcon} aria-hidden="true">👤</div>
              <div>
                <div className={styles.actionTitle}>Clientes</div>
                <div className={styles.actionDesc}>Buscar, visualizar e editar clientes</div>
              </div>
              <div className={styles.actionChevron} aria-hidden="true">›</div>
            </a>

            <a className={styles.actionTile} href="/service-orders">
              <div className={styles.actionIcon} aria-hidden="true">🧾</div>
              <div>
                <div className={styles.actionTitle}>Ordens de Serviço</div>
                <div className={styles.actionDesc}>Criar OS, editar, orçamento e status</div>
              </div>
              <div className={styles.actionChevron} aria-hidden="true">›</div>
            </a>

            <a className={styles.actionTile} href="/service-orders">
              <div className={styles.actionIcon} aria-hidden="true">➕</div>
              <div>
                <div className={styles.actionTitle}>Nova OS</div>
                <div className={styles.actionDesc}>Ir direto para criar uma OS</div>
              </div>
              <div className={styles.actionChevron} aria-hidden="true">›</div>
            </a>
          </div>

          <div className={styles.tip}>
            <span className={styles.tipDot} aria-hidden="true" />
            <Muted style={{ margin: 0 }}>
              Dica: depois podemos colocar “botão abrir modal de Nova OS” direto aqui (sem sair do Dashboard).
            </Muted>
          </div>
        </Card>

        {/* Últimas OS */}
        <Card className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Últimas Ordens de Serviço</div>
              <div className={styles.cardSubtitle}>Um resumo rápido do que entrou recentemente.</div>
            </div>

            <a href="/service-orders" className={styles.seeAll}>
              Ver todas →
            </a>
          </div>

          {loading ? (
            <Muted>Carregando...</Muted>
          ) : lastOrders.length === 0 ? (
            <Muted>Nenhuma OS cadastrada ainda.</Muted>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Nº</th>
                  <th style={{ width: 220 }}>Status</th>
                  <th>Equipamento</th>
                  <th style={{ width: 170 }}>Entrada</th>
                </tr>
              </thead>
              <tbody>
                {lastOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 800 }}>{o.osNumber}</td>
                    <td>
                      <span style={statusDotStyle(o.status)} />
                      <span style={{ fontWeight: 800 }}>{STATUS_LABEL[o.status]}</span>
                    </td>
                    <td>{equipmentLabel(o)}</td>
                    <td>{formatDateTimeBR(o.entryDate || o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </section>
  );
}