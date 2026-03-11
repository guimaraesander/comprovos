import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { FormGrid, Field } from "../components/Form";
import { AlertError, Muted } from "../components/Alert";

import { listClients, type Client } from "../services/clients";
import {
  createServiceOrder,
  deleteServiceOrder,
  listServiceOrders,
  updateServiceOrder,
  updateServiceOrderStatus,
  type ServiceOrder,
  type ServiceOrderStatus,
} from "../services/serviceOrders";

import styles from "./ServiceOrdersPage.module.css";

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

const STATUS_OPTIONS: ServiceOrderStatus[] = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_MANUTENCAO",
  "FINALIZADA",
  "ENTREGUE",
  "CANCELADA",
];

type FormState = {
  clientId: string;
  clientCpfCnpj: string;

  // “preview” do cliente (somente leitura)
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;

  equipmentType: string;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentSerialNumber: string;
  equipmentPassword: string;

  symptoms: string;
  accessories: string;
  observations: string;

  budgetValue: string;
  finalValue: string;
};

const initialForm: FormState = {
  clientId: "",
  clientCpfCnpj: "",

  clientName: "",
  clientPhone: "",
  clientEmail: "",
  clientAddress: "",

  equipmentType: "",
  equipmentBrand: "",
  equipmentModel: "",
  equipmentSerialNumber: "",
  equipmentPassword: "",

  symptoms: "",
  accessories: "",
  observations: "",

  budgetValue: "",
  finalValue: "",
};

function toNumberOrUndefined(v: string) {
  const t = v.trim();
  if (!t) return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeText(v: string) {
  const t = v.trim();
  return t.length ? t : "";
}

function normalizeCpfCnpj(v: string) {
  return v.replace(/\D/g, "");
}

function formatClientAddress(c: Client) {
  const parts = [
    (c as any).address,
    (c as any).district,
    (c as any).city,
    (c as any).state,
    (c as any).zipCode,
  ].filter((x) => typeof x === "string" && x.trim().length > 0);

  return parts.join(" • ");
}

function truncateOneLine(text: string, max = 70) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return { short: t, truncated: false };
  return { short: t.slice(0, max).trimEnd() + "…", truncated: true };
}

function statusBadgeStyle(status: ServiceOrderStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f2f4f7",
    color: "#344054",
    whiteSpace: "nowrap",
  };

  if (status === "CANCELADA")
    return { ...base, background: "#fee4e2", color: "#b42318", borderColor: "#fecdca" };
  if (status === "ENTREGUE")
    return { ...base, background: "#d1fadf", color: "#067647", borderColor: "#a6f4c5" };
  if (status === "FINALIZADA")
    return { ...base, background: "#e0eaff", color: "#175cd3", borderColor: "#c7d7fe" };
  if (status === "EM_MANUTENCAO")
    return { ...base, background: "#fffaeb", color: "#b54708", borderColor: "#fedf89" };
  if (status === "AGUARDANDO_APROVACAO")
    return { ...base, background: "#fef0c7", color: "#7a2e0e", borderColor: "#fedf89" };
  if (status === "EM_ANALISE")
    return { ...base, background: "#f0f9ff", color: "#026aa2", borderColor: "#b9e6fe" };
  return base;
}

function equipmentLabel(order: ServiceOrder) {
  const parts = [order.equipmentType, order.equipmentBrand, order.equipmentModel].filter(Boolean);
  return parts.join(" ") || "-";
}

export function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);

  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [modalSaving, setModalSaving] = useState(false);

  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus>("EM_ANALISE");

  // dropdown CPF
  const [cpfQuery, setCpfQuery] = useState("");
  const [cpfOpen, setCpfOpen] = useState(false);
  const cpfBoxRef = useRef<HTMLDivElement | null>(null);

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const sortedOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    list.sort((a, b) => (b.osNumber ?? 0) - (a.osNumber ?? 0));
    return list;
  }, [orders]);

  const cpfMatches = useMemo(() => {
    const q = normalizeCpfCnpj(cpfQuery);
    if (!q) return [];
    // busca por cpf/cnpj (cpfCnpj do cliente)
    const hits = clients
      .filter((c: any) => normalizeCpfCnpj(String(c.cpfCnpj || "")).startsWith(q))
      .slice(0, 8);
    return hits;
  }, [cpfQuery, clients]);

  function setBusy(id: string, value: boolean) {
    setBusyById((prev) => {
      const next = { ...prev };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  function clearRowError(id: string) {
    setRowErrorById((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function setRowError(id: string, message: string) {
    setRowErrorById((prev) => ({ ...prev, [id]: message }));
  }

  async function loadAll() {
    setPageError(null);
    setLoading(true);
    try {
      const [ordersData, clientsData] = await Promise.all([listServiceOrders(), listClients()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
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
      const [ordersData, clientsData] = await Promise.all([listServiceOrders(), listClients()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  // fecha dropdown clicando fora
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const el = cpfBoxRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setCpfOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function openCreate() {
    setPageError(null);
    setSelected(null);

    // ✅ tudo zerado
    setForm(initialForm);
    setCpfQuery("");
    setCpfOpen(false);

    setIsCreateOpen(true);
  }

  function closeAllModals() {
    if (modalSaving) return;
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsStatusOpen(false);
    setIsDeleteOpen(false);
    setIsDetailsOpen(false);
    setCpfOpen(false);
  }

  function applyClientSelection(c: Client) {
    const cpf = String((c as any).cpfCnpj || "");
    setForm((p) => ({
      ...p,
      clientId: c.id,
      clientCpfCnpj: cpf,

      clientName: c.name || "",
      clientPhone: String((c as any).phone || ""),
      clientEmail: String((c as any).email || ""),
      clientAddress: formatClientAddress(c),
    }));

    setCpfQuery(cpf);
    setCpfOpen(false);
  }

  function clearClientSelection() {
    setForm((p) => ({
      ...p,
      clientId: "",
      clientCpfCnpj: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientAddress: "",
    }));
  }

  async function handleCreate() {
    setPageError(null);

    const clientId = normalizeText(form.clientId);
    const clientCpfCnpj = normalizeText(form.clientCpfCnpj);

    const equipmentType = normalizeText(form.equipmentType);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setPageError("Informe o CPF/CNPJ e selecione um cliente encontrado.");
    if (!clientCpfCnpj) return setPageError("Informe o CPF/CNPJ na OS.");
    if (!equipmentType) return setPageError("Informe o tipo do equipamento.");
    if (!symptoms) return setPageError("Informe os sintomas.");

    setModalSaving(true);
    try {
      const created = await createServiceOrder({
        clientId,
        clientCpfCnpj,

        equipmentType,
        equipmentBrand: normalizeText(form.equipmentBrand) || undefined,
        equipmentModel: normalizeText(form.equipmentModel) || undefined,
        equipmentSerialNumber: normalizeText(form.equipmentSerialNumber) || undefined,
        equipmentPassword: normalizeText(form.equipmentPassword) || undefined,

        symptoms,
        accessories: normalizeText(form.accessories) || undefined,
        observations: normalizeText(form.observations) || undefined,
        budgetValue: toNumberOrUndefined(form.budgetValue),
        finalValue: toNumberOrUndefined(form.finalValue),
      });

      setOrders((prev) => [created, ...prev]);
      closeAllModals();
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setModalSaving(false);
    }
  }

  function openEdit(order: ServiceOrder) {
    setPageError(null);
    setSelected(order);

    const c = order.client ?? clientsById.get(order.clientId) ?? null;

    setForm({
      clientId: order.clientId,
      clientCpfCnpj: order.clientCpfCnpj || "",

      clientName: c?.name || "",
      clientPhone: String(c?.phone || ""),
      clientEmail: String(c?.email || ""),
      clientAddress: c ? formatClientAddress(c as any) : "",

      equipmentType: order.equipmentType || "",
      equipmentBrand: order.equipmentBrand ?? "",
      equipmentModel: order.equipmentModel ?? "",
      equipmentSerialNumber: order.equipmentSerialNumber ?? "",
      equipmentPassword: order.equipmentPassword ?? "",

      symptoms: order.symptoms || "",
      accessories: order.accessories ?? "",
      observations: order.observations ?? "",

      budgetValue: order.budgetValue != null ? String(order.budgetValue) : "",
      finalValue: order.finalValue != null ? String(order.finalValue) : "",
    });

    setCpfQuery(order.clientCpfCnpj || "");
    setCpfOpen(false);

    setIsEditOpen(true);
  }

  async function handleEdit() {
    if (!selected) return;
    setPageError(null);

    const clientId = normalizeText(form.clientId);
    const clientCpfCnpj = normalizeText(form.clientCpfCnpj);

    const equipmentType = normalizeText(form.equipmentType);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setPageError("Informe o CPF/CNPJ e selecione um cliente encontrado.");
    if (!clientCpfCnpj) return setPageError("Informe o CPF/CNPJ na OS.");
    if (!equipmentType) return setPageError("Informe o tipo do equipamento.");
    if (!symptoms) return setPageError("Informe os sintomas.");

    setModalSaving(true);
    clearRowError(selected.id);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrder(selected.id, {
        clientId,
        clientCpfCnpj,

        equipmentType,
        equipmentBrand: normalizeText(form.equipmentBrand) || null,
        equipmentModel: normalizeText(form.equipmentModel) || null,
        equipmentSerialNumber: normalizeText(form.equipmentSerialNumber) || null,
        equipmentPassword: normalizeText(form.equipmentPassword) || null,

        symptoms,
        accessories: normalizeText(form.accessories) || null,
        observations: normalizeText(form.observations) || null,
        budgetValue: toNumberOrUndefined(form.budgetValue) ?? null,
        finalValue: toNumberOrUndefined(form.finalValue) ?? null,
      });

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setRowError(selected.id, safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function suggestNextStatus(order: ServiceOrder): ServiceOrderStatus {
    return order.status === "ABERTA"
      ? "EM_ANALISE"
      : order.status === "EM_ANALISE"
      ? "AGUARDANDO_APROVACAO"
      : order.status === "AGUARDANDO_APROVACAO"
      ? "EM_MANUTENCAO"
      : order.status === "EM_MANUTENCAO"
      ? "FINALIZADA"
      : order.status === "FINALIZADA"
      ? "ENTREGUE"
      : order.status;
  }

  function openStatus(order: ServiceOrder) {
    setPageError(null);
    setSelected(order);
    setNextStatus(suggestNextStatus(order));
    setIsStatusOpen(true);
  }

  async function handleStatus() {
    if (!selected) return;
    setPageError(null);

    setModalSaving(true);
    clearRowError(selected.id);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrderStatus(selected.id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setRowError(selected.id, safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openDelete(order: ServiceOrder) {
    setPageError(null);
    setSelected(order);
    setIsDeleteOpen(true);
  }

  async function handleDelete() {
    if (!selected) return;
    setPageError(null);

    setModalSaving(true);
    clearRowError(selected.id);
    setBusy(selected.id, true);

    try {
      await deleteServiceOrder(selected.id);
      setOrders((prev) => prev.filter((o) => o.id !== selected.id));
      closeAllModals();
    } catch (err) {
      setRowError(selected.id, safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openDetails(order: ServiceOrder) {
    setSelected(order);
    setIsDetailsOpen(true);
  }

  return (
    <section className="content-body">
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Registro de entrada com dados do equipamento preenchidos na OS."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={refresh} disabled={loading || refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
            <Button type="button" variant="primary" onClick={openCreate} disabled={loading}>
              Nova OS
            </Button>
          </>
        }
      />

      {pageError && <AlertError>{pageError}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Status</th>
                <th>Cliente</th>
                <th>CPF/CNPJ</th>
                <th>Equipamento</th>
                <th>Sintomas</th>
                <th style={{ width: 240 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Muted>Nenhuma OS cadastrada ainda.</Muted>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((o) => {
                  const client = o.client ?? clientsById.get(o.clientId) ?? null;
                  const { short, truncated } = truncateOneLine(o.symptoms, 70);

                  const rowBusy = !!busyById[o.id];
                  const rowError = rowErrorById[o.id];

                  return (
                    <tr key={o.id}>
                      <td>{o.osNumber}</td>

                      <td>
                        <button
                          type="button"
                          onClick={() => openStatus(o)}
                          disabled={rowBusy}
                          title={rowBusy ? "Aguarde..." : "Clique para alterar o status"}
                          style={{
                            ...statusBadgeStyle(o.status),
                            cursor: rowBusy ? "not-allowed" : "pointer",
                            opacity: rowBusy ? 0.7 : 1,
                          }}
                        >
                          {rowBusy ? "..." : STATUS_LABEL[o.status]}
                        </button>
                      </td>

                      <td>{client?.name || "-"}</td>
                      <td>{o.clientCpfCnpj || "-"}</td>
                      <td>{equipmentLabel(o)}</td>

                      <td>
                        <span title={o.symptoms}>{short || "-"}</span>
                        {truncated && (
                          <>
                            {" "}
                            <button
                              type="button"
                              onClick={() => openDetails(o)}
                              disabled={rowBusy}
                              style={{
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                marginLeft: 6,
                                color: "#175cd3",
                                fontWeight: 700,
                                cursor: rowBusy ? "not-allowed" : "pointer",
                                opacity: rowBusy ? 0.7 : 1,
                              }}
                            >
                              ver mais
                            </button>
                          </>
                        )}

                        {rowError && (
                          <div style={{ marginTop: 6, color: "#b42318", fontSize: 12, fontWeight: 600 }}>
                            {rowError}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button type="button" variant="secondary" onClick={() => openEdit(o)} disabled={rowBusy}>
                            Editar
                          </Button>
                          <Button type="button" variant="danger" onClick={() => openDelete(o)} disabled={rowBusy}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* CREATE */}
      <Modal
        title="Nova OS (Entrada)"
        subtitle="Digite o CPF/CNPJ para localizar o cliente e preencher os dados do equipamento."
        isOpen={isCreateOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleCreate} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do cliente</div>

          <FormGrid>
            <Field label="Buscar por CPF/CNPJ *" full>
              <div className={styles.cpfBox} ref={cpfBoxRef}>
                <input
                  value={cpfQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCpfQuery(v);
                    setCpfOpen(true);

                    // enquanto digita, limpa seleção (evita “cliente preso”)
                    clearClientSelection();

                    // se usuário colar um cpf/cnpj exato e existir, auto-seleciona
                    const q = normalizeCpfCnpj(v);
                    const exact = clients.find((c: any) => normalizeCpfCnpj(String(c.cpfCnpj || "")) === q);
                    if (exact) applyClientSelection(exact);
                  }}
                  onFocus={() => setCpfOpen(true)}
                  placeholder="Digite o CPF/CNPJ do cliente…"
                  disabled={modalSaving}
                />

                {cpfOpen && cpfQuery.trim().length > 0 && (
                  <div className={styles.dropdown}>
                    {cpfMatches.length === 0 ? (
                      <div className={styles.noResults}>
                        Nenhum cliente encontrado com esse CPF/CNPJ.
                      </div>
                    ) : (
                      cpfMatches.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          className={styles.option}
                          onClick={() => applyClientSelection(c)}
                        >
                          <span className={styles.optionCpf}>{String(c.cpfCnpj || "").trim() || "—"}</span>
                          <span className={styles.optionName}>{c.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Nome" full>
              <input value={form.clientName} disabled readOnly placeholder="Preenche ao localizar CPF/CNPJ" />
            </Field>

            <Field label="Celular">
              <input value={form.clientPhone} disabled readOnly placeholder="—" />
            </Field>

            <Field label="Email">
              <input value={form.clientEmail} disabled readOnly placeholder="—" />
            </Field>

            <Field label="Endereço" full>
              <input value={form.clientAddress} disabled readOnly placeholder="—" />
            </Field>

            <Field label="CPF/CNPJ na OS *" full>
              <input
                value={form.clientCpfCnpj}
                onChange={(e) => setForm((p) => ({ ...p, clientCpfCnpj: e.target.value }))}
                placeholder="Digite o CPF/CNPJ (obrigatório na OS)"
                disabled={modalSaving}
              />
            </Field>
          </FormGrid>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do computador</div>

          <FormGrid>
            <Field label="Tipo do equipamento *">
              <input
                value={form.equipmentType}
                onChange={(e) => setForm((p) => ({ ...p, equipmentType: e.target.value }))}
                placeholder="Ex.: Desktop, Notebook"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Marca">
              <input
                value={form.equipmentBrand}
                onChange={(e) => setForm((p) => ({ ...p, equipmentBrand: e.target.value }))}
                placeholder="Ex.: ASUS"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Modelo">
              <input
                value={form.equipmentModel}
                onChange={(e) => setForm((p) => ({ ...p, equipmentModel: e.target.value }))}
                placeholder="Ex.: H310CM-HG4"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Nº de série">
              <input
                value={form.equipmentSerialNumber}
                onChange={(e) => setForm((p) => ({ ...p, equipmentSerialNumber: e.target.value }))}
                placeholder="Opcional"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Senha do equipamento">
              <input
                value={form.equipmentPassword}
                onChange={(e) => setForm((p) => ({ ...p, equipmentPassword: e.target.value }))}
                placeholder="Opcional"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Sintomas *" full>
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
                rows={4}
                placeholder="Descreva o problema relatado pelo cliente"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Acessórios" full>
              <input
                value={form.accessories}
                onChange={(e) => setForm((p) => ({ ...p, accessories: e.target.value }))}
                placeholder="Ex.: carregador, cabo"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Observações" full>
              <textarea
                value={form.observations}
                onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
                rows={3}
                placeholder="Observações gerais (opcional)"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Orçamento (R$)">
              <input
                value={form.budgetValue}
                onChange={(e) => setForm((p) => ({ ...p, budgetValue: e.target.value }))}
                placeholder="Ex.: 150"
                disabled={modalSaving}
              />
            </Field>

            <Field label="Valor final (R$)">
              <input
                value={form.finalValue}
                onChange={(e) => setForm((p) => ({ ...p, finalValue: e.target.value }))}
                placeholder="Ex.: 180"
                disabled={modalSaving}
              />
            </Field>
          </FormGrid>
        </div>
      </Modal>

      {/* EDIT */}
      <Modal
        title="Editar OS"
        subtitle="Atualize os dados da OS (status é separado)."
        isOpen={isEditOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleEdit} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        {/* Edit reaproveita o mesmo layout do Create (sem dropdown obrigatório) */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do cliente</div>

          <FormGrid>
            <Field label="CPF/CNPJ na OS *" full>
              <input
                value={form.clientCpfCnpj}
                onChange={(e) => setForm((p) => ({ ...p, clientCpfCnpj: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Nome" full>
              <input value={form.clientName} disabled readOnly />
            </Field>

            <Field label="Celular">
              <input value={form.clientPhone} disabled readOnly />
            </Field>

            <Field label="Email">
              <input value={form.clientEmail} disabled readOnly />
            </Field>

            <Field label="Endereço" full>
              <input value={form.clientAddress} disabled readOnly />
            </Field>
          </FormGrid>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do computador</div>

          <FormGrid>
            <Field label="Tipo do equipamento *">
              <input
                value={form.equipmentType}
                onChange={(e) => setForm((p) => ({ ...p, equipmentType: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Marca">
              <input
                value={form.equipmentBrand}
                onChange={(e) => setForm((p) => ({ ...p, equipmentBrand: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Modelo">
              <input
                value={form.equipmentModel}
                onChange={(e) => setForm((p) => ({ ...p, equipmentModel: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Nº de série">
              <input
                value={form.equipmentSerialNumber}
                onChange={(e) => setForm((p) => ({ ...p, equipmentSerialNumber: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Senha do equipamento">
              <input
                value={form.equipmentPassword}
                onChange={(e) => setForm((p) => ({ ...p, equipmentPassword: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Sintomas *" full>
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
                rows={4}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Acessórios" full>
              <input
                value={form.accessories}
                onChange={(e) => setForm((p) => ({ ...p, accessories: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Observações" full>
              <textarea
                value={form.observations}
                onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
                rows={3}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Orçamento (R$)">
              <input
                value={form.budgetValue}
                onChange={(e) => setForm((p) => ({ ...p, budgetValue: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>

            <Field label="Valor final (R$)">
              <input
                value={form.finalValue}
                onChange={(e) => setForm((p) => ({ ...p, finalValue: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>
          </FormGrid>
        </div>
      </Modal>

      {/* STATUS */}
      <Modal
        title="Alterar status"
        subtitle={selected ? `OS #${selected.osNumber} — status atual: ${STATUS_LABEL[selected.status]}` : ""}
        isOpen={isStatusOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleStatus} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        <FormGrid>
          <Field label="Novo status *" full>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as ServiceOrderStatus)}
              disabled={modalSaving}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </FormGrid>
      </Modal>

      {/* DELETE */}
      <Modal
        title="Excluir OS"
        subtitle={selected ? `Confirme a exclusão da OS #${selected.osNumber}.` : ""}
        isOpen={isDeleteOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} disabled={modalSaving}>
              {modalSaving ? "Excluindo..." : "Excluir"}
            </Button>
          </>
        }
      >
        <Muted>Essa ação não pode ser desfeita.</Muted>
      </Modal>

      {/* DETAILS */}
      <Modal
        title="Detalhes da OS"
        subtitle={selected ? `OS #${selected.osNumber}` : ""}
        isOpen={isDetailsOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
            Fechar
          </Button>
        }
      >
        {selected ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>Cliente:</strong> {selected.client?.name || "-"} • <strong>CPF/CNPJ:</strong>{" "}
              {selected.clientCpfCnpj || "-"}
            </div>
            <div>
              <strong>Equipamento:</strong> {equipmentLabel(selected)}
            </div>
            <div>
              <strong>Status:</strong> {STATUS_LABEL[selected.status]}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              <strong>Sintomas:</strong> {selected.symptoms || "-"}
            </div>
          </div>
        ) : (
          <Muted>Sem dados.</Muted>
        )}
      </Modal>
    </section>
  );
}