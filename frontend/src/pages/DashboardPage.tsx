import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { Button } from "../components/Button";
import { AlertError, Muted } from "../components/Alert";

import { listClients, type Client } from "../services/clients";
import { listServiceOrders, type ServiceOrder, type ServiceOrderStatus } from "../services/serviceOrders";

import styles from "./DashboardPage.module.css";

const STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  ABERTA: "ABERTA",
  EM_ANALISE: "EM ANÁLISE",
  AGUARDANDO_APROVACAO: "AGUARD. APROVAÇÃO",
  EM_MANUTENCAO: "EM MANUTENÇÃO",
  FINALIZADA: "FINALIZADA",
  ENTREGUE: "ENTREGUE",
  CANCELADA: "CANCELADA",
};

const STATUS_ORDER: ServiceOrderStatus[] = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_MANUTENCAO",
  "FINALIZADA",
  "ENTREGUE",
  "CANCELADA",
];

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
  if (status === "AGUARDANDO_APROVACAO") return { ...base, background: "#fef0c7", color: "#7a2e0e", borderColor: "#fedf89" };
  if (status === "EM_ANALISE") return { ...base, background: "#f0f9ff", color: "#026aa2", borderColor: "#b9e6fe" };
  return base;
}

function safeCount(map: Record<string, number>, key: string) {
  return typeof map[key] === "number" ? map[key] : 0;
}

type ActivityItem =
  | { id: string; kind: "OS"; title: string; subtitle: string; at?: string; href: string; status?: ServiceOrderStatus }
  | { id: string; kind: "CLIENT"; title: string; subtitle: string; at?: string; href: string };

export function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      setError(e?.message || "Não foi possível carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setError(null);
    setRefreshing(true);
    try {
      const [ordersData, clientsData] = await Promise.all([listServiceOrders(), listClients()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setLastUpdatedAt(new Date().toISOString());
    } catch (e: any) {
      setError(e?.message || "Não foi possível atualizar o dashboard.");
    } finally {
      setRefreshing(false);
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

  const pendingCount = useMemo(() => {
    return safeCount(statusCounts as any, "ABERTA") + safeCount(statusCounts as any, "EM_ANALISE") + safeCount(statusCounts as any, "AGUARDANDO_APROVACAO");
  }, [statusCounts]);

  const inProgressCount = useMemo(() => safeCount(statusCounts as any, "EM_MANUTENCAO"), [statusCounts]);
  const doneCount = useMemo(() => safeCount(statusCounts as any, "FINALIZADA") + safeCount(statusCounts as any, "ENTREGUE"), [statusCounts]);

  const maxStatusCount = useMemo(() => {
    let m = 1;
    for (const s of STATUS_ORDER) m = Math.max(m, safeCount(statusCounts as any, s));
    return m;
  }, [statusCounts]);

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

  // PASSO (6): feed de atividade + “última atualização”
  const activity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const o of recentOrders) {
      const label = typeof o.osNumber === "number" ? `OS #${o.osNumber}` : "OS";
      const clientName = (o as any)?.client?.name || "";
      const subtitle = clientName ? `${clientName} • ${STATUS_LABEL[o.status]}` : STATUS_LABEL[o.status];
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

  return (
    <section className="content-body">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do ComprovOS (painel interno)."
        actions={
          <div className={styles.headerActions}>
            <div className={styles.lastUpdated}>
              <span className={styles.dot} />
              <span>
                {lastUpdatedAt ? `Atualizado: ${formatDateTimeBR(lastUpdatedAt)}` : "Carregando…"}
              </span>
            </div>

            <Button type="button" variant="secondary" onClick={refresh} disabled={loading || refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
        }
      />

      {error && <AlertError className="mb-12">{error}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiTitle}>Ordens (total)</div>
                <div className={styles.kpiChip}>OS</div>
              </div>
              <div className={styles.kpiValue}>{totalOrders}</div>
              <Muted className={styles.kpiHint}>Total de ordens cadastradas</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiTitle}>Pendentes</div>
                <div className={styles.kpiChip}>Fila</div>
              </div>
              <div className={styles.kpiValue}>{pendingCount}</div>
              <Muted className={styles.kpiHint}>Abertas / Em análise / Aguard. aprovação</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiTitle}>Em manutenção</div>
                <div className={styles.kpiChip}>Andamento</div>
              </div>
              <div className={styles.kpiValue}>{inProgressCount}</div>
              <Muted className={styles.kpiHint}>Ordens em execução</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiTitle}>Concluídas</div>
                <div className={styles.kpiChip}>Final</div>
              </div>
              <div className={styles.kpiValue}>{doneCount}</div>
              <Muted className={styles.kpiHint}>Finalizadas + Entregues</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiTitle}>Clientes</div>
                <div className={styles.kpiChip}>Base</div>
              </div>
              <div className={styles.kpiValue}>{totalClients}</div>
              <Muted className={styles.kpiHint}>Clientes cadastrados</Muted>
            </Card>
          </div>

          {/* Distribuição por status */}
          <div className={styles.grid2}>
            <Card>
              <div className={styles.cardHeaderRow}>
                <div>
                  <h3 className={styles.cardTitle}>Distribuição por status</h3>
                  <Muted className={styles.cardSubtitle}>Visão rápida do volume por etapa</Muted>
                </div>
              </div>

              <div className={styles.statusList}>
                {STATUS_ORDER.map((s) => {
                  const value = safeCount(statusCounts as any, s);
                  const pct = Math.round((value / maxStatusCount) * 100);
                  return (
                    <div key={s} className={styles.statusRow}>
                      <div className={styles.statusLeft}>
                        <span style={statusBadgeStyle(s)}>{STATUS_LABEL[s]}</span>
                        <span className={styles.statusCount}>{value}</span>
                      </div>
                      <div className={styles.barWrap} aria-label={`${STATUS_LABEL[s]}: ${value}`}>
                        <div className={styles.barFill} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* PASSO (6): Atividade recente */}
            <Card>
              <div className={styles.cardHeaderRow}>
                <div>
                  <h3 className={styles.cardTitle}>Atividade recente</h3>
                  <Muted className={styles.cardSubtitle}>Últimos eventos do sistema</Muted>
                </div>
              </div>

              {activity.length === 0 ? (
                <Muted>Nenhuma atividade recente.</Muted>
              ) : (
                <div className={styles.activityList}>
                  {activity.map((it) => (
                    <a key={it.id} href={it.href} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        {it.kind === "OS" ? "🧾" : "👤"}
                      </div>

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

              <div className={styles.activityFooter}>
                <a className={styles.linkBtn} href="/service-orders">Ver OS</a>
                <a className={styles.linkBtn} href="/clients">Ver clientes</a>
              </div>
            </Card>
          </div>

          {/* Atalhos + Tabelas recentes */}
          <div className={styles.grid2}>
            <Card>
              <div className={styles.cardHeaderRow}>
                <div>
                  <h3 className={styles.cardTitle}>Atalhos</h3>
                  <Muted className={styles.cardSubtitle}>Acesso rápido às telas principais</Muted>
                </div>
              </div>

              <div className={styles.shortcuts}>
                <a className={styles.shortcut} href="/clients">
                  <div className={styles.shortcutIcon}>👤</div>
                  <div>
                    <div className={styles.shortcutTitle}>Clientes</div>
                    <Muted className={styles.shortcutSub}>Cadastrar, buscar e editar</Muted>
                  </div>
                </a>

                <a className={styles.shortcut} href="/service-orders">
                  <div className={styles.shortcutIcon}>🧾</div>
                  <div>
                    <div className={styles.shortcutTitle}>Ordens de Serviço</div>
                    <Muted className={styles.shortcutSub}>Criar e acompanhar status</Muted>
                  </div>
                </a>
              </div>
            </Card>

            <Card>
              <div className={styles.cardHeaderRow}>
                <div>
                  <h3 className={styles.cardTitle}>Últimas OS</h3>
                  <Muted className={styles.cardSubtitle}>Mais recentes (por criação)</Muted>
                </div>
                <a className={styles.linkBtn} href="/service-orders">Ver todas</a>
              </div>

              <Table>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>Nº</th>
                    <th>Status</th>
                    <th>Cliente</th>
                    <th style={{ width: 160 }}>Criada em</th>
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
                          <span style={statusBadgeStyle(o.status)}>{STATUS_LABEL[o.status]}</span>
                        </td>
                        <td>{(o as any)?.client?.name || "-"}</td>
                        <td>{formatDateTimeBR(o.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          </div>

          <div className={styles.grid1}>
            <Card>
              <div className={styles.cardHeaderRow}>
                <div>
                  <h3 className={styles.cardTitle}>Últimos clientes</h3>
                  <Muted className={styles.cardSubtitle}>Cadastros mais recentes</Muted>
                </div>
                <a className={styles.linkBtn} href="/clients">Ver todos</a>
              </div>

              <Table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style={{ width: 220 }}>CPF/CNPJ</th>
                    <th style={{ width: 220 }}>Telefone</th>
                    <th style={{ width: 160 }}>Criado em</th>
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
                        <td style={{ fontWeight: 800 }}>{c.name || "-"}</td>
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
        </>
      )}
    </section>
  );
}