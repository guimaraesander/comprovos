import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { AlertError, Muted } from "../components/Alert";

import { listClients, type Client } from "../services/clients";
import { listServiceOrders, type ServiceOrder, type ServiceOrderStatus } from "../services/serviceOrders";

import styles from "./DashboardPage.module.css";

const STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  ABERTA: "ABERTA",
  EM_ANALISE: "EM ANALISE",
  AGUARDANDO_APROVACAO: "AGUARD. APROVACAO",
  EM_MANUTENCAO: "EM MANUTENCAO",
  FINALIZADA: "FINALIZADA",
  PAGO: "PAGO",
  ENTREGUE: "ENTREGUE",
  CANCELADA: "CANCELADA",
};

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

function statusBadgeStyle(status: ServiceOrderStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.2,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f2f4f7",
    color: "#344054",
    whiteSpace: "nowrap",
  };

  if (status === "CANCELADA") return { ...base, background: "#fee4e2", color: "#b42318", borderColor: "#fecdca" };
  if (status === "ENTREGUE") return { ...base, background: "#d1fadf", color: "#067647", borderColor: "#a6f4c5" };
  if (status === "FINALIZADA") return { ...base, background: "#e0eaff", color: "#175cd3", borderColor: "#c7d7fe" };
  if (status === "EM_MANUTENCAO") return { ...base, background: "#fffaeb", color: "#b54708", borderColor: "#fedf89" };
  if (status === "AGUARDANDO_APROVACAO")
    return { ...base, background: "#fef0c7", color: "#7a2e0e", borderColor: "#fedf89" };
  if (status === "EM_ANALISE") return { ...base, background: "#f0f9ff", color: "#026aa2", borderColor: "#b9e6fe" };
  return base;
}

type ActivityItem =
  | { id: string; kind: "OS"; title: string; subtitle: string; at?: string; href: string; status?: ServiceOrderStatus }
  | { id: string; kind: "CLIENT"; title: string; subtitle: string; at?: string; href: string };

type KpiCardTone = "blue" | "amber" | "emerald" | "slate" | "pink";

type KpiCardProps = {
  label: string;
  value: number;
  tone: KpiCardTone;
};

function activityIconLabel(kind: ActivityItem["kind"]) {
  return kind === "OS" ? "OS" : "CL";
}

export function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const [ordersData, clientsData] = await Promise.all([listServiceOrders(), listClients()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (e: any) {
      setError(e?.message || "Nao foi possivel carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<ServiceOrderStatus, number> = {
      ABERTA: 0,
      EM_ANALISE: 0,
      AGUARDANDO_APROVACAO: 0,
      EM_MANUTENCAO: 0,
      FINALIZADA: 0,
      PAGO: 0,
      ENTREGUE: 0,
      CANCELADA: 0,
    };
    for (const o of orders) {
      if (o?.status && counts[o.status] !== undefined) counts[o.status] += 1;
    }
    return counts;
  }, [orders]);

  const totalOrders = useMemo(() => orders.length, [orders]);
  const totalClients = useMemo(() => clients.length, [clients]);
  const pendingCount = useMemo(
    () => statusCounts.ABERTA + statusCounts.EM_ANALISE + statusCounts.AGUARDANDO_APROVACAO,
    [statusCounts]
  );
  const inProgressCount = useMemo(() => statusCounts.EM_MANUTENCAO, [statusCounts]);
  const doneCount = useMemo(
    () => statusCounts.FINALIZADA + statusCounts.PAGO + statusCounts.ENTREGUE,
    [statusCounts]
  );

  const recentOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    list.sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime();
      const bt = new Date(b.createdAt || 0).getTime();
      return bt - at;
    });
    return list.slice(0, 6);
  }, [orders]);

  const recentClients = useMemo(() => {
    const list = Array.isArray(clients) ? [...clients] : [];
    list.sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime();
      const bt = new Date(b.createdAt || 0).getTime();
      return bt - at;
    });
    return list.slice(0, 6);
  }, [clients]);

  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const o of recentOrders) {
      const label = typeof o.osNumber === "number" ? `OS #${o.osNumber}` : "OS";
      const clientName = (o as any)?.client?.name || "";
      const subtitle = clientName ? `${clientName} - ${STATUS_LABEL[o.status]}` : STATUS_LABEL[o.status];
      items.push({
        id: `os_${o.id}`,
        kind: "OS",
        title: label,
        subtitle,
        at: o.createdAt || o.entryDate,
        href: "/service-orders",
        status: o.status,
      });
    }

    for (const c of recentClients) {
      items.push({
        id: `cl_${c.id}`,
        kind: "CLIENT",
        title: c.name || "Cliente",
        subtitle: (c as any)?.cpfCnpj ? `CPF/CNPJ: ${(c as any).cpfCnpj}` : "Novo cadastro",
        at: c.createdAt,
        href: "/clients",
      });
    }

    items.sort((a, b) => {
      const at = new Date(a.at || 0).getTime();
      const bt = new Date(b.at || 0).getTime();
      return bt - at;
    });
    return items.slice(0, 10);
  }, [recentOrders, recentClients]);

  const kpis: KpiCardProps[] = [
    { label: "Ordens no total", value: totalOrders, tone: "blue" },
    {
      label: "Pendentes",
      value: pendingCount,
      tone: "amber",
    },
    { label: "Em manutencao", value: inProgressCount, tone: "emerald" },
    { label: "Concluidas", value: doneCount, tone: "pink" },
    { label: "Clientes", value: totalClients, tone: "slate" },
  ];

  const toneClass: Record<KpiCardTone, string> = {
    blue: styles.toneBlue,
    amber: styles.toneAmber,
    emerald: styles.toneEmerald,
    pink: styles.tonePink,
    slate: styles.toneSlate,
  };

  return (
    <section className="content-body">
      <PageHeader
        title="Dashboard"
        actions={
          <div className={styles.headerActions}>
            <div className={styles.lastUpdated}>
              <span className={styles.dot} />
              <span>{lastUpdatedAt ? `Atualizado: ${formatDateTimeBR(lastUpdatedAt)}` : "Carregando..."}</span>
            </div>
            <a href="/service-orders" className={styles.headerActionBtn}>
              Abrir OS
            </a>
          </div>
        }
      />

      {error && <AlertError className="mb-12">{error}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <div className={styles.pageContent}>
          <Card className={styles.heroCard}>
            <div className={styles.heroInner}>
              <div>
                <p className={styles.heroKicker}>Painel Executivo</p>
                <h2 className={styles.heroTitle}>Visao geral do dia</h2>
              </div>
            </div>
          </Card>

          <div className={styles.kpiGrid}>
            {kpis.map((card) => (
              <Card key={card.label} className={`${styles.kpiCard} ${toneClass[card.tone]}`}>
                <div className={styles.kpiValue}>{card.value}</div>
                <div className={styles.kpiTitle}>{card.label}</div>
              </Card>
            ))}
          </div>

          <div className={styles.dashboardGrid}>
            <Card className={styles.sideCard}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>Atividades Recentes</h3>
              </div>

              {activity.length === 0 ? (
                <Muted>Nenhuma atividade recente.</Muted>
              ) : (
                <div className={styles.activityList}>
                  {activity.map((it) => (
                    <a key={it.id} href={it.href} className={styles.activityItem}>
                      <div className={styles.activityIcon}>{activityIconLabel(it.kind)}</div>
                      <div className={styles.activityBody}>
                        <div className={styles.activityTitleRow}>
                          <div className={styles.activityTitle}>{it.title}</div>
                          <div className={styles.activityAt}>{formatDateTimeBR(it.at)}</div>
                        </div>
                        <div className={styles.activitySubRow}>
                          <div className={styles.activitySubtitle}>{it.subtitle}</div>
                          {"status" in it && it.status ? (
                            <span className={styles.activityPill} style={statusBadgeStyle(it.status)}>
                              {STATUS_LABEL[it.status]}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className={styles.dashboardGridDouble}>
            <Card className={styles.listCard}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>Últimas OS</h3>
                <a className={styles.linkBtn} href="/service-orders">
                  Ver todas
                </a>
              </div>

              <Table className={styles.dashboardTable} wrapClassName={styles.dashboardTableWrap}>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Numero</th>
                    <th>Status</th>
                    <th>Cliente</th>
                    <th style={{ width: 170 }}>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <Muted>Nenhuma OS encontrada.</Muted>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.osNumber ?? "-"}</td>
                        <td>
                          <span className={styles.badgeCell} style={statusBadgeStyle(o.status)}>
                            {STATUS_LABEL[o.status]}
                          </span>
                        </td>
                        <td>{(o as any)?.client?.name || "-"}</td>
                        <td>{formatDateTimeBR(o.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>

            <Card className={styles.listCard}>
              <div className={styles.cardHeaderRow}>
                <h3 className={styles.cardTitle}>Últimos clientes</h3>
                <a className={styles.linkBtn} href="/clients">
                  Ver todas
                </a>
              </div>

              <Table className={styles.dashboardTable} wrapClassName={styles.dashboardTableWrap}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style={{ width: 220 }}>CPF/CNPJ</th>
                    <th style={{ width: 220 }}>Telefone</th>
                    <th style={{ width: 170 }}>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <Muted>Nenhum cliente encontrado.</Muted>
                      </td>
                    </tr>
                  ) : (
                    recentClients.map((c) => (
                      <tr key={c.id}>
                        <td className={styles.nameCell}>{c.name || "-"}</td>
                        <td>{(c as any).cpfCnpj || "-"}</td>
                        <td>{(c as any).phone || "-"}</td>
                        <td>{formatDateTimeBR(c.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
