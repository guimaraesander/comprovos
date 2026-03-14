import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Muted, AlertError } from "../components/Alert";
import { Button } from "../components/Button";
import { Table } from "../components/Table";

import { listServiceOrders, type ServiceOrder, type ServiceOrderStatus } from "../services/serviceOrders";

import styles from "./DashboardPage.module.css";

function safeErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || "Não foi possível carregar o dashboard.";
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível carregar o dashboard.";
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

function statusChipClass(status: ServiceOrderStatus) {
  if (status === "CANCELADA") return styles.chipCancel;
  if (status === "ENTREGUE") return styles.chipDelivered;
  if (status === "FINALIZADA") return styles.chipDone;
  if (status === "EM_MANUTENCAO") return styles.chipMaintenance;
  if (status === "AGUARDANDO_APROVACAO") return styles.chipApproval;
  if (status === "EM_ANALISE") return styles.chipAnalysis;
  return styles.chipOpen;
}

function getOrderTitle(o: ServiceOrder) {
  const parts = [o.equipmentType, o.equipmentBrand, o.equipmentModel].filter(Boolean);
  return parts.join(" ") || "-";
}

export function DashboardPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await listServiceOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(safeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setError(null);
    setRefreshing(true);
    try {
      const data = await listServiceOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(safeErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const countsByStatus = useMemo(() => {
    const map = new Map<ServiceOrderStatus, number>();
    for (const s of STATUS_ORDER) map.set(s, 0);
    for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    return map;
  }, [orders]);

  const total = useMemo(() => orders.length, [orders]);

  const openTotal = useMemo(() => {
    return (
      (countsByStatus.get("ABERTA") ?? 0) +
      (countsByStatus.get("EM_ANALISE") ?? 0) +
      (countsByStatus.get("AGUARDANDO_APROVACAO") ?? 0)
    );
  }, [countsByStatus]);

  const maintenanceTotal = useMemo(() => countsByStatus.get("EM_MANUTENCAO") ?? 0, [countsByStatus]);
  const doneTotal = useMemo(() => (countsByStatus.get("FINALIZADA") ?? 0) + (countsByStatus.get("ENTREGUE") ?? 0), [countsByStatus]);

  const maxCount = useMemo(() => {
    let m = 0;
    for (const s of STATUS_ORDER) m = Math.max(m, countsByStatus.get(s) ?? 0);
    return Math.max(m, 1);
  }, [countsByStatus]);

  const latestOrders = useMemo(() => {
    const list = [...orders];
    list.sort((a, b) => {
      const da = new Date(a.createdAt || a.entryDate || 0).getTime();
      const db = new Date(b.createdAt || b.entryDate || 0).getTime();
      return db - da;
    });
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

      {error ? <AlertError className="mb-12">{error}</AlertError> : null}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <div className={styles.grid}>
          {/* KPIs */}
          <div className={styles.kpis}>
            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiLabel}>Total de OS</div>
                <div className={styles.kpiIcon} aria-hidden>📋</div>
              </div>
              <div className={styles.kpiValue}>{total}</div>
              <Muted className={styles.kpiHint}>Todas as ordens cadastradas</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiLabel}>Abertas / em andamento</div>
                <div className={styles.kpiIcon} aria-hidden>⚡</div>
              </div>
              <div className={styles.kpiValue}>{openTotal}</div>
              <Muted className={styles.kpiHint}>ABERTA + EM ANÁLISE + AGUARD. APROV.</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiLabel}>Em manutenção</div>
                <div className={styles.kpiIcon} aria-hidden>🛠️</div>
              </div>
              <div className={styles.kpiValue}>{maintenanceTotal}</div>
              <Muted className={styles.kpiHint}>OS no status EM MANUTENÇÃO</Muted>
            </Card>

            <Card className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <div className={styles.kpiLabel}>Concluídas</div>
                <div className={styles.kpiIcon} aria-hidden>✅</div>
              </div>
              <div className={styles.kpiValue}>{doneTotal}</div>
              <Muted className={styles.kpiHint}>FINALIZADA + ENTREGUE</Muted>
            </Card>
          </div>

          {/* PASSO (2) - Distribuição por status */}
          <Card className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>Distribuição por status</h3>
                <Muted className={styles.panelSubtitle}>Visão rápida do volume por etapa</Muted>
              </div>
              <div className={styles.panelBadge}>{total} OS</div>
            </div>

            <div className={styles.statusBars}>
              {STATUS_ORDER.map((s) => {
                const count = countsByStatus.get(s) ?? 0;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={s} className={styles.statusRow}>
                    <div className={`${styles.chip} ${statusChipClass(s)}`}>{STATUS_LABEL[s]}</div>
                    <div className={styles.barWrap} aria-label={`${STATUS_LABEL[s]}: ${count}`}>
                      <div className={styles.bar} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={styles.count}>{count}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* PASSO (3) - Atalhos + Últimas OS */}
          <div className={styles.twoCols}>
            <Card className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Atalhos rápidos</h3>
                  <Muted className={styles.panelSubtitle}>Acesso direto às telas principais</Muted>
                </div>
              </div>

              <div className={styles.shortcuts}>
                <a className={styles.shortcutCard} href="/clients">
                  <div className={styles.shortcutIcon} aria-hidden>👤</div>
                  <div className={styles.shortcutText}>
                    <div className={styles.shortcutTitle}>Clientes</div>
                    <Muted className={styles.shortcutSub}>Cadastrar e editar clientes</Muted>
                  </div>
                  <div className={styles.shortcutArrow} aria-hidden>→</div>
                </a>

                <a className={styles.shortcutCard} href="/service-orders">
                  <div className={styles.shortcutIcon} aria-hidden>🧾</div>
                  <div className={styles.shortcutText}>
                    <div className={styles.shortcutTitle}>Ordens de Serviço</div>
                    <Muted className={styles.shortcutSub}>Criar, editar, orçamento e status</Muted>
                  </div>
                  <div className={styles.shortcutArrow} aria-hidden>→</div>
                </a>
              </div>

              <div className={styles.tipBox}>
                <div className={styles.tipTitle}>Dica</div>
                <Muted className={styles.tipText}>
                  Queremos deixar o dashboard “vivo”: depois podemos adicionar alertas do tipo
                  “X OS aguardando aprovação há mais de 2 dias”.
                </Muted>
              </div>
            </Card>

            <Card className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>Últimas ordens de serviço</h3>
                  <Muted className={styles.panelSubtitle}>As OS mais recentes cadastradas</Muted>
                </div>
                <a className={styles.link} href="/service-orders">Ver tudo</a>
              </div>

              <Table wrapClassName={styles.tableWrap}>
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>Nº</th>
                    <th style={{ width: 150 }}>Status</th>
                    <th>Equipamento</th>
                    <th style={{ width: 150 }}>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {latestOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <Muted>Nenhuma OS cadastrada ainda.</Muted>
                      </td>
                    </tr>
                  ) : (
                    latestOrders.map((o) => (
                      <tr key={o.id}>
                        <td><strong>{o.osNumber}</strong></td>
                        <td>
                          <span className={`${styles.chip} ${statusChipClass(o.status)}`}>{STATUS_LABEL[o.status]}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{getOrderTitle(o)}</div>
                          <Muted className={styles.oneLine}>{(o.symptoms || "").trim() || "-"}</Muted>
                        </td>
                        <td>{formatDateTimeBR(o.createdAt || o.entryDate)}</td>
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