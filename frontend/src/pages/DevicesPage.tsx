import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { createDevice, listDevices, type Device } from "../services/devices";
import { listClients, type Client } from "../services/clients";

import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { FormGrid, Field } from "../components/Form";
import { AlertError, Muted } from "../components/Alert";

type CreateForm = {
  clientId: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  password: string;
  accessories: string;
  notes: string;
};

function normalizeText(value: string) {
  return value.trim();
}

function safeErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || "Não foi possível concluir a operação.";
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível concluir a operação.";
}

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateForm>({
    clientId: "",
    type: "",
    brand: "",
    model: "",
    serialNumber: "",
    password: "",
    accessories: "",
    notes: "",
  });

  const clientsById = useMemo(() => {
    const map = new Map<string, Client>();
    for (const c of clients) map.set(c.id, c);
    return map;
  }, [clients]);

  async function loadAll() {
    setError(null);
    setLoading(true);
    try {
      const [devicesData, clientsData] = await Promise.all([listDevices(), listClients()]);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
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
      const [devicesData, clientsData] = await Promise.all([listDevices(), listClients()]);
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
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
    setForm({
      clientId: clients[0]?.id || "",
      type: "",
      brand: "",
      model: "",
      serialNumber: "",
      password: "",
      accessories: "",
      notes: "",
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
    const type = normalizeText(form.type);

    if (!clientId) {
      setError("Selecione um cliente.");
      return;
    }
    if (!type) {
      setError("Informe o tipo do equipamento (ex.: Notebook, Desktop, Placa-mãe).");
      return;
    }

    setSaving(true);
    try {
      const created = await createDevice({
        clientId,
        type,
        brand: normalizeText(form.brand) || undefined,
        model: normalizeText(form.model) || undefined,
        serialNumber: normalizeText(form.serialNumber) || undefined,
        password: normalizeText(form.password) || undefined,
        accessories: normalizeText(form.accessories) || undefined,
        notes: normalizeText(form.notes) || undefined,
      });

      setDevices((prev) => [created, ...prev]);
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
        title="Equipamentos"
        subtitle="Cadastro e gerenciamento de equipamentos."
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
              Novo equipamento
            </Button>
          </>
        }
      />

      {error && <AlertError className="mb-12">{error}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Modelo</th>
                <th>Cliente</th>
                <th>Serial</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <Muted>Nenhum equipamento cadastrado.</Muted>
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
                  const client = clientsById.get(d.clientId);
                  const modelText = [d.brand, d.model].filter(Boolean).join(" ");
                  return (
                    <tr key={d.id}>
                      <td>{d.type}</td>
                      <td>{modelText || "-"}</td>
                      <td>{client?.name || "-"}</td>
                      <td>{d.serialNumber || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal
        title="Novo equipamento"
        subtitle="Preencha os dados e clique em “Salvar”."
        isOpen={isModalOpen}
        onClose={closeModal}
        disableClose={saving}
        footer={modalFooter}
      >
        <FormGrid>
          <Field label="Cliente *">
            <select
              value={form.clientId}
              onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}
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

          <Field label="Tipo *">
            <input
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              placeholder="Ex.: Notebook, Desktop, Placa-mãe"
              disabled={saving}
              required
            />
          </Field>

          <Field label="Marca">
            <input
              value={form.brand}
              onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
              placeholder="Ex.: ASUS"
              disabled={saving}
            />
          </Field>

          <Field label="Modelo">
            <input
              value={form.model}
              onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
              placeholder="Ex.: H310CM-HG4"
              disabled={saving}
            />
          </Field>

          <Field label="Número de série">
            <input
              value={form.serialNumber}
              onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))}
              placeholder="Ex.: 0A9XH012973"
              disabled={saving}
            />
          </Field>

          <Field label="Senha">
            <input
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Se aplicável"
              disabled={saving}
            />
          </Field>

          <Field label="Acessórios" full>
            <input
              value={form.accessories}
              onChange={(e) => setForm((p) => ({ ...p, accessories: e.target.value }))}
              placeholder="Ex.: carregador, cabo, bag"
              disabled={saving}
            />
          </Field>

          <Field label="Observações" full>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Observações gerais do equipamento"
              rows={4}
              disabled={saving}
            />
          </Field>
        </FormGrid>
      </Modal>
    </section>
  );
}