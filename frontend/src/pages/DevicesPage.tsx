import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { createDevice, listDevices, type Device } from "../services/devices";
import { listClients, type Client } from "../services/clients";

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

  return (
    <section className="content-body">
      <div className="page-header">
        <div>
          <h2 style={{ marginTop: 0 }}>Equipamentos</h2>
          <p style={{ color: "#64748b" }}>Cadastro e gerenciamento de equipamentos.</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={refresh}
            disabled={loading || refreshing}
          >
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>

          <button type="button" className="btn-primary" onClick={openModal} disabled={loading}>
            Novo equipamento
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#64748b" }}>Carregando...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
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
                    <td colSpan={4} style={{ color: "#64748b" }}>
                      Nenhum equipamento cadastrado.
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
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Novo equipamento</h3>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  Preencha os dados e clique em “Salvar”.
                </p>
              </div>

              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <label className="field">
                  Cliente *
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
                </label>

                <label className="field">
                  Tipo *
                  <input
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    placeholder="Ex.: Notebook, Desktop, Placa-mãe"
                    disabled={saving}
                    required
                  />
                </label>

                <label className="field">
                  Marca
                  <input
                    value={form.brand}
                    onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="Ex.: ASUS"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Modelo
                  <input
                    value={form.model}
                    onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                    placeholder="Ex.: H310CM-HG4"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Número de série
                  <input
                    value={form.serialNumber}
                    onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))}
                    placeholder="Ex.: 0A9XH012973"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Senha
                  <input
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Se aplicável"
                    disabled={saving}
                  />
                </label>

                <label className="field field-full">
                  Acessórios
                  <input
                    value={form.accessories}
                    onChange={(e) => setForm((p) => ({ ...p, accessories: e.target.value }))}
                    placeholder="Ex.: carregador, cabo, bag"
                    disabled={saving}
                  />
                </label>

                <label className="field field-full">
                  Observações
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Observações gerais do equipamento"
                    rows={4}
                    disabled={saving}
                  />
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}