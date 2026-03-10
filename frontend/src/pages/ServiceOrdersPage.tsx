import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { FormGrid, Field } from "../components/Form";
import { AlertError, Muted } from "../components/Alert";

import { listClients, type Client } from "../services/clients";
import { listDevices, type Device } from "../services/devices";
import {
  createServiceOrder,
  deleteServiceOrder,
  listServiceOrders,
  updateServiceOrder,
  updateServiceOrderStatus,
  type ServiceOrder,
  type ServiceOrderStatus,
} from "../services/serviceOrders";

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
  deviceId: string;
  symptoms: string;
  accessories: string;
  observations: string;
  budgetValue: string;
  finalValue: string;
};

const initialForm: FormState = {
  clientId: "",
  deviceId: "",
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

export function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // erro “global” (carregar/listar)
  const [pageError, setPageError] = useState<string | null>(null);

  // busy e erro por OS (não trava a tela inteira)
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // busy do modal (criar/editar/status/excluir)
  const [modalSaving, setModalSaving] = useState(false);

  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus>("EM_ANALISE");

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const devicesById = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);

  const sortedOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    list.sort((a, b) => (b.osNumber ?? 0) - (a.osNumber ?? 0));
    return list;
  }, [orders]);

  const devicesForClient = useMemo(() => {
    if (!form.clientId) return devices;
    return devices.filter((d: any) => d.clientId === form.clientId);
  }, [devices, form.clientId, devices]);

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
      const [ordersData, clientsData, devicesData] = await Promise.all([
        listServiceOrders(),
        listClients(),
        listDevices(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
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
      const [ordersData, clientsData, devicesData] = await Promise.all([
        listServiceOrders(),
        listClients(),
        listDevices(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function deviceLabel(d: Device | any) {
    const parts = [d.type, d.brand, d.model].filter(Boolean);
    return parts.join(" ") || d.id;
  }

  function resolveClientAndDevice(order: ServiceOrder) {
    const client = order.client ?? clientsById.get(order.clientId) ?? null;
    const device = order.device ?? devicesById.get(order.deviceId) ?? null;
    const deviceText = device ? deviceLabel(device as any) : "-";
    return { client, device, deviceText };
  }

  function openCreate() {
    setPageError(null);
    const firstClientId = clients[0]?.id || "";
    const list = firstClientId ? devices.filter((d: any) => d.clientId === firstClientId) : devices;

    setSelected(null);
    setForm({
      ...initialForm,
      clientId: firstClientId,
      deviceId: list[0]?.id || "",
    });
    setIsCreateOpen(true);
  }

  function closeAllModals() {
    if (modalSaving) return;
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsStatusOpen(false);
    setIsDeleteOpen(false);
    setIsDetailsOpen(false);
  }

  async function handleCreate() {
    setPageError(null);

    const clientId = normalizeText(form.clientId);
    const deviceId = normalizeText(form.deviceId);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setPageError("Selecione um cliente.");
    if (!deviceId) return setPageError("Selecione um equipamento.");
    if (!symptoms) return setPageError("Informe os sintomas.");

    setModalSaving(true);
    try {
      const created = await createServiceOrder({
        clientId,
        deviceId,
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

    setForm({
      clientId: order.clientId,
      deviceId: order.deviceId,
      symptoms: order.symptoms || "",
      accessories: order.accessories ?? "",
      observations: order.observations ?? "",
      budgetValue: order.budgetValue != null ? String(order.budgetValue) : "",
      finalValue: order.finalValue != null ? String(order.finalValue) : "",
    });

    setIsEditOpen(true);
  }

  async function handleEdit() {
    if (!selected) return;
    setPageError(null);

    const clientId = normalizeText(form.clientId);
    const deviceId = normalizeText(form.deviceId);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setPageError("Selecione um cliente.");
    if (!deviceId) return setPageError("Selecione um equipamento.");
    if (!symptoms) return setPageError("Informe os sintomas.");

    setModalSaving(true);
    clearRowError(selected.id);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrder(selected.id, {
        clientId,
        deviceId,
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
        subtitle="Crie e acompanhe ordens de serviço vinculadas a cliente e equipamento."
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
                <th>Equipamento</th>
                <th>Sintomas</th>
                <th style={{ width: 240 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Muted>Nenhuma OS cadastrada ainda.</Muted>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((o) => {
                  const { client, deviceText } = resolveClientAndDevice(o);
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
                      <td>{deviceText}</td>

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
        title="Nova OS"
        subtitle="Vincule cliente + equipamento e descreva os sintomas."
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
        <FormGrid>
          <Field label="Cliente *">
            <select
              value={form.clientId}
              onChange={(e) => {
                const nextClientId = e.target.value;
                const list = nextClientId ? devices.filter((d: any) => d.clientId === nextClientId) : devices;

                setForm((p) => ({
                  ...p,
                  clientId: nextClientId,
                  deviceId: list[0]?.id || "",
                }));
              }}
              disabled={modalSaving}
            >
              {clients.length === 0 ? (
                <option value="">Nenhum cliente encontrado</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Equipamento *">
            <select
              value={form.deviceId}
              onChange={(e) => setForm((p) => ({ ...p, deviceId: e.target.value }))}
              disabled={modalSaving}
            >
              {devicesForClient.length === 0 ? (
                <option value="">Nenhum equipamento encontrado</option>
              ) : (
                devicesForClient.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {deviceLabel(d)}
                  </option>
                ))
              )}
            </select>
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
      </Modal>

      {/* EDIT */}
      <Modal
        title="Editar OS"
        subtitle="Atualize dados da OS (status é separado)."
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
        <FormGrid>
          <Field label="Cliente *">
            <select
              value={form.clientId}
              onChange={(e) => {
                const nextClientId = e.target.value;
                const list = nextClientId ? devices.filter((d: any) => d.clientId === nextClientId) : devices;

                setForm((p) => ({
                  ...p,
                  clientId: nextClientId,
                  deviceId: list[0]?.id || "",
                }));
              }}
              disabled={modalSaving}
            >
              {clients.length === 0 ? (
                <option value="">Nenhum cliente encontrado</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Equipamento *">
            <select
              value={form.deviceId}
              onChange={(e) => setForm((p) => ({ ...p, deviceId: e.target.value }))}
              disabled={modalSaving}
            >
              {devicesForClient.length === 0 ? (
                <option value="">Nenhum equipamento encontrado</option>
              ) : (
                devicesForClient.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {deviceLabel(d)}
                  </option>
                ))
              )}
            </select>
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
      </Modal>

      {/* STATUS CONFIRM */}
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

      {/* DELETE CONFIRM */}
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
        {selected ? (
          (() => {
            const { client, deviceText } = resolveClientAndDevice(selected);
            return (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>
                    <strong>Cliente:</strong> {client?.name || "-"}
                  </div>
                  <div>
                    <strong>Equipamento:</strong> {deviceText}
                  </div>
                  <div>
                    <strong>Status:</strong> {STATUS_LABEL[selected.status]}
                  </div>
                </div>
                <Muted>Essa ação não pode ser desfeita.</Muted>
              </div>
            );
          })()
        ) : (
          <Muted>Essa ação não pode ser desfeita.</Muted>
        )}
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
          (() => {
            const { client, deviceText } = resolveClientAndDevice(selected);
            return (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div>
                    <strong>Cliente:</strong> {client?.name || "-"}
                  </div>
                  <div>
                    <strong>Equipamento:</strong> {deviceText}
                  </div>
                  <div>
                    <strong>Status:</strong> {STATUS_LABEL[selected.status]}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <strong>Sintomas</strong>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{selected.symptoms || "-"}</div>
                </div>

                {(selected.observations || selected.accessories) && (
                  <div style={{ display: "grid", gap: 6 }}>
                    {selected.accessories && (
                      <div>
                        <strong>Acessórios:</strong> {selected.accessories}
                      </div>
                    )}
                    {selected.observations && (
                      <div>
                        <strong>Observações:</strong> {selected.observations}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <Muted>Sem dados.</Muted>
        )}
      </Modal>
    </section>
  );
}