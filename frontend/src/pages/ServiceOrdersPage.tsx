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

type ServiceOrderStatus =
  | "ABERTA"
  | "EM_ANALISE"
  | "AGUARDANDO_APROVACAO"
  | "EM_MANUTENCAO"
  | "FINALIZADA"
  | "ENTREGUE"
  | "CANCELADA";

type ServiceOrder = {
  id: string;
  osNumber: number;
  clientId: string;
  deviceId: string;
  status: ServiceOrderStatus;
  symptoms: string;
  createdAt?: string;
};

type CreateServiceOrderInput = {
  clientId: string;
  deviceId: string;
  symptoms: string;
  observations?: string;
};

function normalizeText(value: string) {
  return value.trim();
}

function safeErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (
      (err.response.data as any)?.message || "Não foi possível concluir a operação."
    );
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível concluir a operação.";
}

// OBS: Este arquivo já está pronto para a UI.
// Quando você criar o backend/rotas de Service Orders, você só precisa
// implementar esses endpoints no backend:
// - GET /service-orders
// - POST /service-orders
async function listServiceOrders(): Promise<ServiceOrder[]> {
  const res = await fetch("http://localhost:3333/api/service-orders", {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Falha ao carregar ordens de serviço");
  return res.json();
}

async function createServiceOrder(payload: CreateServiceOrderInput): Promise<ServiceOrder> {
  const res = await fetch("http://localhost:3333/api/service-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Falha ao criar ordem de serviço");
  return res.json();
}

export function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientId: "",
    deviceId: "",
    symptoms: "",
    observations: "",
  });

  const clientsById = useMemo(() => {
    const map = new Map<string, Client>();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  const devicesById = useMemo(() => {
    const map = new Map<string, Device>();
    for (const d of devices) map.set(d.id, d);
    return map;
  }, [devices]);

  const devicesForClient = useMemo(() => {
    if (!form.clientId) return devices;
    return devices.filter((d: any) => d.clientId === form.clientId);
  }, [devices, form.clientId]);

  async function loadAll() {
    setError(null);
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
      setError(safeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setError(null);
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
      setError(safeErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function openModal() {
    setError(null);
    const firstClientId = clients[0]?.id || "";
    const devicesFiltered = firstClientId
      ? devices.filter((d: any) => d.clientId === firstClientId)
      : devices;

    setForm({
      clientId: firstClientId,
      deviceId: devicesFiltered[0]?.id || "",
      symptoms: "",
      observations: "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
  }

  async function handleSave() {
    setError(null);

    const clientId = normalizeText(form.clientId);
    const deviceId = normalizeText(form.deviceId);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setError("Selecione um cliente.");
    if (!deviceId) return setError("Selecione um equipamento.");
    if (!symptoms) return setError("Informe os sintomas.");

    setSaving(true);
    try {
      const created = await createServiceOrder({
        clientId,
        deviceId,
        symptoms,
        observations: normalizeText(form.observations) || undefined,
      });

      setOrders((prev) => [created, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      setError(safeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const modalFooter = (
    <>
      <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
        Cancelar
      </Button>
      <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </>
  );

  return (
    <section className="content-body">
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Crie e acompanhe ordens de serviço vinculadas a cliente e equipamento."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={refresh}
              disabled={loading || refreshing}
            >
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>

            <Button type="button" variant="primary" onClick={openModal} disabled={loading}>
              Nova OS
            </Button>
          </>
        }
      />

      {error && <AlertError>{error}</AlertError>}

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
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Muted>Nenhuma OS cadastrada ainda.</Muted>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const client = clientsById.get(o.clientId);
                  const device = devicesById.get(o.deviceId) as any;
                  const deviceLabel = device
                    ? [device.type, device.brand, device.model].filter(Boolean).join(" ")
                    : "-";

                  return (
                    <tr key={o.id}>
                      <td>{o.osNumber}</td>
                      <td>{o.status}</td>
                      <td>{client?.name || "-"}</td>
                      <td>{deviceLabel || "-"}</td>
                      <td>{o.symptoms}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal
        title="Nova OS"
        subtitle="Vincule cliente e equipamento e descreva os sintomas."
        isOpen={isModalOpen}
        onClose={closeModal}
        disableClose={saving}
        footer={modalFooter}
      >
        <FormGrid>
          <Field label="Cliente *">
            <select
              value={form.clientId}
              onChange={(e) => {
                const nextClientId = e.target.value;
                const list = nextClientId
                  ? devices.filter((d: any) => d.clientId === nextClientId)
                  : devices;

                setForm((p) => ({
                  ...p,
                  clientId: nextClientId,
                  deviceId: list[0]?.id || "",
                }));
              }}
              disabled={saving}
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
              disabled={saving}
            >
              {devicesForClient.length === 0 ? (
                <option value="">Nenhum equipamento encontrado</option>
              ) : (
                devicesForClient.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {[d.type, d.brand, d.model].filter(Boolean).join(" ") || d.id}
                  </option>
                ))
              )}
            </select>
          </Field>

          <Field label="Sintomas *" full>
            <textarea
              value={form.symptoms}
              onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
              placeholder="Descreva o problema relatado pelo cliente"
              rows={4}
              disabled={saving}
            />
          </Field>

          <Field label="Observações" full>
            <textarea
              value={form.observations}
              onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
              placeholder="Observações gerais (opcional)"
              rows={3}
              disabled={saving}
            />
          </Field>
        </FormGrid>
      </Modal>
    </section>
  );
}