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
  listServiceOrders,
  updateServiceOrder,
  updateServiceOrderStatus,
  upsertServiceOrderBudget,
  type ServiceOrder,
  type ServiceOrderStatus,
  type ServiceOrderBudget,
  type ServiceOrderBudgetItem,
  type UpsertBudgetInput,
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

function ModalError({ message }: { message: string }) {
  return (
    <div
      style={{
        marginBottom: 12,
        borderRadius: 12,
        border: "1px solid #fecdca",
        background: "#fee4e2",
        color: "#7a271a",
        padding: "12px 12px",
        fontWeight: 900,
        boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
      }}
      role="alert"
      aria-live="polite"
    >
      {message}
    </div>
  );
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

// fluxo “pra frente” (não pode voltar)
const STATUS_FLOW: ServiceOrderStatus[] = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_MANUTENCAO",
  "FINALIZADA",
  "ENTREGUE",
  "CANCELADA", // cancelamento é um “fim”
];


type ServiceOrderWithCreator = ServiceOrder & {
  createdByUser?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
};

function orderResponsibleName(order: ServiceOrder | null | undefined) {
  const creator = (order as ServiceOrderWithCreator | null | undefined)?.createdByUser;
  return creator?.name || "-";
}

type FormState = {
  clientId: string;
  clientCpfCnpj: string;

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
};

type BudgetFormItem = {
  id: string;
  description: string;
  technician: string;
  qty: string;
  unitValue: string;
};

type BudgetForm = {
  travelFee: string;
  thirdPartyFee: string;
  discount: string;
  note: string;
  items: BudgetFormItem[];
};

const initialBudgetForm: BudgetForm = {
  travelFee: "0",
  thirdPartyFee: "0",
  discount: "0",
  note: "",
  items: [],
};

function normalizeText(v: string) {
  const t = v.trim();
  return t.length ? t : "";
}

function normalizeCpfCnpj(v: string) {
  return (v || "").replace(/\D/g, "");
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

  if (status === "CANCELADA") return { ...base, background: "#fee4e2", color: "#b42318", borderColor: "#fecdca" };
  if (status === "ENTREGUE") return { ...base, background: "#d1fadf", color: "#067647", borderColor: "#a6f4c5" };
  if (status === "FINALIZADA") return { ...base, background: "#e0eaff", color: "#175cd3", borderColor: "#c7d7fe" };
  if (status === "EM_MANUTENCAO") return { ...base, background: "#fffaeb", color: "#b54708", borderColor: "#fedf89" };
  if (status === "AGUARDANDO_APROVACAO")
    return { ...base, background: "#fef0c7", color: "#7a2e0e", borderColor: "#fedf89" };
  if (status === "EM_ANALISE") return { ...base, background: "#f0f9ff", color: "#026aa2", borderColor: "#b9e6fe" };
  return base;
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

function toMoneyNumber(v: number | string | null | undefined) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function calcBudgetItemsTotal(items: ServiceOrderBudgetItem[] | undefined) {
  const list = Array.isArray(items) ? items : [];
  return list.reduce((acc, it) => acc + Number(it.qty || 0) * toMoneyNumber(it.unitValue), 0);
}

function calcBudgetTotal(budget: ServiceOrderBudget | null | undefined) {
  if (!budget) return 0;
  const itemsTotal = calcBudgetItemsTotal(budget.items);
  const travel = toMoneyNumber(budget.travelFee);
  const third = toMoneyNumber(budget.thirdPartyFee);
  const discount = toMoneyNumber(budget.discount);
  return itemsTotal + travel + third - discount;
}

// regras de botões
function buttonsMode(status: ServiceOrderStatus) {
  const allEnabled = status === "ABERTA" || status === "EM_ANALISE" || status === "AGUARDANDO_APROVACAO";
  const onlyView = status === "EM_MANUTENCAO" || status === "FINALIZADA" || status === "ENTREGUE" || status === "CANCELADA";
  return { allEnabled, onlyView };
}

// visualização por status
type ViewMode = "ENTRY" | "BUDGET" | "PAYMENT";
function getViewMode(status: ServiceOrderStatus): ViewMode {
  if (status === "ENTREGUE") return "PAYMENT";
  if (status === "AGUARDANDO_APROVACAO" || status === "EM_MANUTENCAO" || status === "FINALIZADA") return "BUDGET";
  return "ENTRY";
}

function nextStatusesAllowed(current: ServiceOrderStatus): ServiceOrderStatus[] {
  if (current === "CANCELADA" || current === "ENTREGUE") return [];
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0) return [];
  const next = STATUS_FLOW[idx + 1];
  const out: ServiceOrderStatus[] = [];
  if (next && next !== "CANCELADA") out.push(next);
  if (current === "ABERTA" || current === "EM_ANALISE" || current === "AGUARDANDO_APROVACAO") out.push("CANCELADA");
  return out;
}

function parseMoneyInput(v: string) {
  const t = v.trim();
  if (!t) return 0;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function newLocalId() {
  return `tmp_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // erro “da página” (somente listagem / load / refresh)
  const [pageError, setPageError] = useState<string | null>(null);

  const [busyById, setBusyById] = useState<Record<string, boolean>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>(initialBudgetForm);

  const [modalSaving, setModalSaving] = useState(false);

  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus>("EM_ANALISE");
  const [statusOptions, setStatusOptions] = useState<ServiceOrderStatus[]>([]);

  // ERROS DENTRO DOS MODAIS
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [statusModalError, setStatusModalError] = useState<string | null>(null);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [budgetModalError, setBudgetModalError] = useState<string | null>(null);

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
    return clients.filter((c: any) => normalizeCpfCnpj(String(c.cpfCnpj || "")).startsWith(q)).slice(0, 8);
  }, [cpfQuery, clients]);

  function setBusy(id: string, value: boolean) {
    setBusyById((prev) => {
      const next = { ...prev };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
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
    setSelected(null);
    setForm(initialForm);
    setCpfQuery("");
    setCpfOpen(false);

    setCreateModalError(null);
    setIsCreateOpen(true);
  }

  function closeAllModals() {
    if (modalSaving) return;

    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsStatusOpen(false);
    setIsDetailsOpen(false);
    setIsCancelOpen(false);
    setIsViewOpen(false);
    setIsBudgetOpen(false);
    setCpfOpen(false);

    
    setCreateModalError(null);
    setEditModalError(null);
    setStatusModalError(null);
    setCancelModalError(null);
    setBudgetModalError(null);
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
    setCreateModalError(null);

    const clientId = normalizeText(form.clientId);
    const clientCpfCnpj = normalizeText(form.clientCpfCnpj);

    const equipmentType = normalizeText(form.equipmentType);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId || !clientCpfCnpj) {
      return setCreateModalError("Digite o CPF/CNPJ e selecione o cliente encontrado na lista.");
    }
    if (!equipmentType) return setCreateModalError("Informe o tipo do equipamento.");
    if (!symptoms) return setCreateModalError("Informe os sintomas.");

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
      });

      setOrders((prev) => [created, ...prev]);
      closeAllModals();
    } catch (err) {
      setCreateModalError(safeErrorMessage(err));
    } finally {
      setModalSaving(false);
    }
  }

  function openEdit(order: ServiceOrder) {
    setSelected(order);
    setEditModalError(null);

    const c = order.client ?? clientsById.get(order.clientId) ?? null;

    setForm({
      clientId: order.clientId,
      clientCpfCnpj: order.clientCpfCnpj || "",

      clientName: c?.name || "",
      clientPhone: String((c as any)?.phone || ""),
      clientEmail: String((c as any)?.email || ""),
      clientAddress: c ? formatClientAddress(c as any) : "",

      equipmentType: order.equipmentType || "",
      equipmentBrand: order.equipmentBrand ?? "",
      equipmentModel: order.equipmentModel ?? "",
      equipmentSerialNumber: order.equipmentSerialNumber ?? "",
      equipmentPassword: order.equipmentPassword ?? "",

      symptoms: order.symptoms || "",
      accessories: order.accessories ?? "",
      observations: order.observations ?? "",
    });

    setCpfQuery(order.clientCpfCnpj || "");
    setCpfOpen(false);

    setIsEditOpen(true);
  }

  async function handleEdit() {
    if (!selected) return;

    setEditModalError(null);

    const clientId = normalizeText(form.clientId);
    const clientCpfCnpj = normalizeText(form.clientCpfCnpj);

    const equipmentType = normalizeText(form.equipmentType);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setEditModalError("Cliente inválido na OS.");
    if (!clientCpfCnpj) return setEditModalError("CPF/CNPJ inválido na OS.");
    if (!equipmentType) return setEditModalError("Informe o tipo do equipamento.");
    if (!symptoms) return setEditModalError("Informe os sintomas.");

    setModalSaving(true);
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
      });

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setEditModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openStatus(order: ServiceOrder) {
    setSelected(order);
    setStatusModalError(null);

    const opts = nextStatusesAllowed(order.status);
    setStatusOptions(opts);
    setNextStatus(opts[0] ?? order.status);

    setIsStatusOpen(true);
  }

  async function handleStatus() {
    if (!selected) return;

    setStatusModalError(null);

    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrderStatus(selected.id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setStatusModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openDetails(order: ServiceOrder) {
    setSelected(order);
    setIsDetailsOpen(true);
  }

  function openView(order: ServiceOrder) {
    setSelected(order);
    setIsViewOpen(true);
  }

  function openCancel(order: ServiceOrder) {
    setSelected(order);
    setCancelModalError(null);
    setIsCancelOpen(true);
  }

  async function handleCancel() {
    if (!selected) return;

    setCancelModalError(null);

    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrderStatus(selected.id, { status: "CANCELADA" });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setCancelModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openBudget(order: ServiceOrder) {
    setSelected(order);
    setBudgetModalError(null);

    const b = order.budget;
    setBudgetForm({
      travelFee: String(toMoneyNumber(b?.travelFee ?? 0)),
      thirdPartyFee: String(toMoneyNumber(b?.thirdPartyFee ?? 0)),
      discount: String(toMoneyNumber(b?.discount ?? 0)),
      note: b?.note ? String(b.note) : "",
      items: (b?.items || []).map((it) => ({
        id: it.id,
        description: it.description || "",
        technician: it.technician ? String(it.technician) : "",
        qty: String(it.qty ?? 1),
        unitValue: String(toMoneyNumber(it.unitValue)),
      })),
    });

    setIsBudgetOpen(true);
  }

  function addBudgetItem() {
    setBudgetForm((p) => ({
      ...p,
      items: [
        ...p.items,
        { id: newLocalId(), description: "", technician: "", qty: "1", unitValue: "0" },
      ],
    }));
  }

  function removeBudgetItem(id: string) {
    setBudgetForm((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) }));
  }

  async function handleSaveBudget() {
    if (!selected) return;

    setBudgetModalError(null);

    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const payload: UpsertBudgetInput = {
        travelFee: parseMoneyInput(budgetForm.travelFee),
        thirdPartyFee: parseMoneyInput(budgetForm.thirdPartyFee),
        discount: parseMoneyInput(budgetForm.discount),
        note: normalizeText(budgetForm.note) || null,
        items: budgetForm.items
          .map((it) => ({
            description: normalizeText(it.description),
            technician: normalizeText(it.technician) || null,
            qty: Math.max(1, Number(it.qty || 1)),
            unitValue: parseMoneyInput(it.unitValue),
          }))
          .filter((it) => it.description.length > 0),
      };

      const saved = await upsertServiceOrderBudget(selected.id, payload);
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? ({ ...o, budget: saved } as any) : o)));

      closeAllModals();
    } catch (err) {
      setBudgetModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  const viewMode: ViewMode = selected ? getViewMode(selected.status) : "ENTRY";

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
                <th style={{ width: 300 }}>Ações</th>
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
                  const { allEnabled, onlyView } = buttonsMode(o.status);
                  const editIsBudget = o.status === "AGUARDANDO_APROVACAO";

                  return (
                    <tr key={o.id}>
                      <td>{o.osNumber}</td>

                      <td>
                        <button
                          type="button"
                          onClick={() => openStatus(o)}
                          disabled={rowBusy || o.status === "CANCELADA" || o.status === "ENTREGUE"}
                          title={
                            rowBusy
                              ? "Aguarde..."
                              : o.status === "CANCELADA" || o.status === "ENTREGUE"
                              ? "Não é possível alterar o status."
                              : "Clique para alterar o status"
                          }
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
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button type="button" variant="secondary" onClick={() => openView(o)} disabled={rowBusy}>
                            Visualizar
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => (editIsBudget ? openBudget(o) : openEdit(o))}
                            disabled={rowBusy || onlyView}
                            title={onlyView ? "Neste status não é possível editar." : editIsBudget ? "Editar orçamento" : "Editar entrada"}
                          >
                            {editIsBudget ? "Orçamento" : "Editar"}
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => openCancel(o)}
                            disabled={rowBusy || !(allEnabled && (o.status === "ABERTA" || o.status === "EM_ANALISE" || o.status === "AGUARDANDO_APROVACAO"))}
                            title={allEnabled ? "Cancelar OS" : "Este status não pode ser cancelado."}
                          >
                            Cancelar
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
        {createModalError ? <ModalError message={createModalError} /> : null}

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

                    clearClientSelection();

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
                      <div className={styles.noResults}>Nenhum cliente encontrado com esse CPF/CNPJ.</div>
                    ) : (
                      cpfMatches.map((c: any) => (
                        <button key={c.id} type="button" className={styles.option} onClick={() => applyClientSelection(c)}>
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
          </FormGrid>
        </div>
      </Modal>

      {/* EDIT (entrada) */}
      <Modal
        title="Editar Ordem de Serviço"
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
        {editModalError ? <ModalError message={editModalError} /> : null}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do cliente</div>

          <FormGrid>
            <Field label="CPF/CNPJ na OS" full>
              <input value={form.clientCpfCnpj} disabled readOnly />
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
          </FormGrid>
        </div>
      </Modal>

      {/* STATUS (somente próximos) */}
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
            <Button type="button" variant="primary" onClick={handleStatus} disabled={modalSaving || statusOptions.length === 0}>
              {modalSaving ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
      >
        {statusModalError ? <ModalError message={statusModalError} /> : null}

        {statusOptions.length === 0 ? (
          <Muted>Nenhuma transição de status disponível.</Muted>
        ) : (
          <FormGrid>
            <Field label="Novo status *" full>
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ServiceOrderStatus)} disabled={modalSaving}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </FormGrid>
        )}
      </Modal>

      {/* CANCEL */}
      <Modal
        title="Cancelar OS"
        subtitle={selected ? `Confirme o cancelamento da OS #${selected.osNumber}.` : ""}
        isOpen={isCancelOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Voltar
            </Button>
            <Button type="button" variant="danger" onClick={handleCancel} disabled={modalSaving}>
              {modalSaving ? "Cancelando..." : "Cancelar OS"}
            </Button>
          </>
        }
      >
        {cancelModalError ? <ModalError message={cancelModalError} /> : null}
        <Muted>Você quer mesmo cancelar a OS #{selected?.osNumber}? </Muted>
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
              <strong>Cliente:</strong> {selected.client?.name || "-"} • <strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}
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

      {/* BUDGET EDITOR */}
      <Modal
        title="Orçamento"
        subtitle={selected ? `OS #${selected.osNumber} — ${STATUS_LABEL[selected.status]}` : ""}
        isOpen={isBudgetOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSaveBudget} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Salvar orçamento"}
            </Button>
          </>
        }
      >
        {budgetModalError ? <ModalError message={budgetModalError} /> : null}

        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Serviços e valores</div>

            <div style={{ display: "grid", gap: 10 }}>
              {budgetForm.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 90px 140px auto",
                    gap: 8,
                    alignItems: "center",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    paddingBottom: 10,
                  }}
                >
                  <input
                    value={it.description}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, description: e.target.value } : x)),
                      }))
                    }
                    placeholder="Descrição do serviço"
                    disabled={modalSaving}
                  />
                  <input
                    value={it.technician}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, technician: e.target.value } : x)),
                      }))
                    }
                    placeholder="Técnico"
                    disabled={modalSaving}
                  />
                  <input
                    value={it.qty}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, qty: e.target.value } : x)),
                      }))
                    }
                    placeholder="Qtd"
                    disabled={modalSaving}
                  />
                  <input
                    value={it.unitValue}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, unitValue: e.target.value } : x)),
                      }))
                    }
                    placeholder="Valor unit. (R$)"
                    disabled={modalSaving}
                  />
                  <Button type="button" variant="danger" onClick={() => removeBudgetItem(it.id)} disabled={modalSaving}>
                    Remover
                  </Button>
                </div>
              ))}

              <Button type="button" variant="secondary" onClick={addBudgetItem} disabled={modalSaving}>
                + Adicionar serviço
              </Button>

              <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "8px 0" }} />

              <FormGrid>
                <Field label="Deslocamento (R$)">
                  <input
                    value={budgetForm.travelFee}
                    onChange={(e) => setBudgetForm((p) => ({ ...p, travelFee: e.target.value }))}
                    disabled={modalSaving}
                  />
                </Field>

                <Field label="Serviço de terceiros (R$)">
                  <input
                    value={budgetForm.thirdPartyFee}
                    onChange={(e) => setBudgetForm((p) => ({ ...p, thirdPartyFee: e.target.value }))}
                    disabled={modalSaving}
                  />
                </Field>

                <Field label="Desconto (R$)">
                  <input
                    value={budgetForm.discount}
                    onChange={(e) => setBudgetForm((p) => ({ ...p, discount: e.target.value }))}
                    disabled={modalSaving}
                  />
                </Field>

                <Field label="Observações" full>
                  <textarea
                    value={budgetForm.note}
                    onChange={(e) => setBudgetForm((p) => ({ ...p, note: e.target.value }))}
                    rows={3}
                    disabled={modalSaving}
                  />
                </Field>
              </FormGrid>
            </div>
          </div>
        )}
      </Modal>

      {/* VIEW */}
      <Modal
        title="Visualizar"
        subtitle={
          selected
            ? `OS #${selected.osNumber} • ${STATUS_LABEL[selected.status]} • Entrada: ${formatDateTimeBR(
                selected.entryDate || selected.createdAt
              )}`
            : ""
        }
        isOpen={isViewOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
            Fechar
          </Button>
        }
      >
        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : viewMode === "ENTRY" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Comprovante de Entrada</div>
              <div>
                <strong>Nº OS:</strong> {selected.osNumber} • <strong>Data de entrada:</strong>{" "}
                {formatDateTimeBR(selected.entryDate || selected.createdAt)}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Cliente</div>
              <div>
                <strong>Nome:</strong> {selected.client?.name || "-"}
              </div>
              <div>
                <strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}
              </div>
              <div>
                <strong>Telefone:</strong> {selected.client?.phone || "-"}
              </div>
              <div>
                <strong>Email:</strong> {selected.client?.email || "-"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Responsável pela OS</div>
              <div>
                <strong>Nome:</strong> {orderResponsibleName(selected)}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Computador</div>
              <div>
                <strong>Equipamento:</strong> {equipmentLabel(selected)}
              </div>
              <div>
                <strong>Nº de série:</strong> {selected.equipmentSerialNumber || "-"}
              </div>
              <div>
                <strong>Senha:</strong> {selected.equipmentPassword || "-"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                <strong>Sintomas:</strong> {selected.symptoms || "-"}
              </div>
              <div>
                <strong>Acessórios:</strong> {selected.accessories || "-"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                <strong>Observações:</strong> {selected.observations || "-"}
              </div>
            </div>
          </div>
        ) : viewMode === "BUDGET" ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Orçamento da Ordem de Serviço</div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Cliente</div>
              <div>
                <strong>Nome:</strong> {selected.client?.name || "-"}
              </div>
              <div>
                <strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}
              </div>
              <div>
                <strong>Telefone:</strong> {selected.client?.phone || "-"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Responsável pela OS</div>
              <div>
                <strong>Nome:</strong> {orderResponsibleName(selected)}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Computador</div>
              <div>
                <strong>Equipamento:</strong> {equipmentLabel(selected)}
              </div>
              <div>
                <strong>Nº de série:</strong> {selected.equipmentSerialNumber || "-"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>
                <strong>Sintomas:</strong> {selected.symptoms || "-"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 800 }}>Valores do Orçamento</div>

              {!selected.budget ? (
                <Muted>Nenhum orçamento encontrado para esta OS.</Muted>
              ) : (
                <>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 700 }}>Serviços</div>

                    {selected.budget.items?.length ? (
                      <div style={{ display: "grid", gap: 6 }}>
                        {selected.budget.items.map((it) => {
                          const lineTotal = Number(it.qty || 0) * toMoneyNumber(it.unitValue);
                          return (
                            <div
                              key={it.id}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: 10,
                                borderBottom: "1px solid rgba(0,0,0,0.06)",
                                paddingBottom: 6,
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700 }}>{it.description}</div>
                                <div style={{ fontSize: 12, color: "#667085" }}>
                                  Técnico: {it.technician || "-"} • Qtd: {it.qty}
                                </div>
                              </div>
                              <div style={{ fontWeight: 800 }}>R$ {lineTotal.toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Muted>Nenhum serviço adicionado ainda.</Muted>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Subtotal (serviços)</span>
                      <strong>R$ {calcBudgetItemsTotal(selected.budget.items).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Deslocamento</span>
                      <strong>R$ {toMoneyNumber(selected.budget.travelFee).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Serviço de terceiros</span>
                      <strong>R$ {toMoneyNumber(selected.budget.thirdPartyFee).toFixed(2)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Desconto</span>
                      <strong>- R$ {toMoneyNumber(selected.budget.discount).toFixed(2)}</strong>
                    </div>
                    <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "6px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
                      <span style={{ fontWeight: 800 }}>Total</span>
                      <span style={{ fontWeight: 900 }}>R$ {calcBudgetTotal(selected.budget).toFixed(2)}</span>
                    </div>
                  </div>

                  {selected.budget.note && (
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                      <strong>Observações do orçamento:</strong> {selected.budget.note}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Comprovante de Pagamento</div>

            <div>
              <strong>Nº OS:</strong> {selected.osNumber} • <strong>Data de entrada:</strong>{" "}
              {formatDateTimeBR(selected.entryDate || selected.createdAt)}
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Cliente</div>
              <div>
                <strong>Nome:</strong> {selected.client?.name || "-"}
              </div>
              <div>
                <strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}
              </div>
              <div>
                <strong>Telefone:</strong> {selected.client?.phone || "-"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Responsável pela OS</div>
              <div>
                <strong>Nome:</strong> {orderResponsibleName(selected)}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Resumo</div>
              <div>
                <strong>Equipamento:</strong> {equipmentLabel(selected)}
              </div>

              <div>
                <strong>Total (baseado no orçamento):</strong>{" "}
                {selected.budget ? `R$ ${calcBudgetTotal(selected.budget).toFixed(2)}` : "—"}
              </div>

              <Muted>
                Observação: ainda não existe módulo de “pagamento” no backend. Aqui estamos apenas exibindo um comprovante com base no orçamento salvo.
              </Muted>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}