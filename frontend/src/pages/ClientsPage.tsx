import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createClient,
  listClients,
  type Client,
  type CreateClientInput,
} from "../services/clients";

type FormState = {
  name: string;
  phone: string;
  email: string;
  document: string;
  rgIe: string;
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  document: "",
  rgIe: "",
  cep: "",
  address: "",
  neighborhood: "",
  city: "",
  state: "",
};

function trim(v: string) {
  return v.trim();
}

function normalizeCreatePayload(form: FormState): CreateClientInput {
  const payload: CreateClientInput = { name: trim(form.name) };

  const maybeSet = (key: keyof Omit<CreateClientInput, "name">, value: string) => {
    const v = trim(value);
    if (v.length > 0) (payload as any)[key] = v;
  };

  maybeSet("phone", form.phone);
  maybeSet("email", form.email);
  maybeSet("document", form.document);
  maybeSet("rgIe", form.rgIe);
  maybeSet("cep", form.cep);
  maybeSet("address", form.address);
  maybeSet("neighborhood", form.neighborhood);
  maybeSet("city", form.city);
  maybeSet("state", form.state);

  return payload;
}

function formatLocation(client: Client) {
  const parts: string[] = [];
  if (client.city) parts.push(client.city);
  if (client.neighborhood) parts.push(client.neighborhood);
  if (parts.length === 0 && client.address) parts.push(client.address);
  return parts.join(" - ");
}

function safeErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" })
    );
  }, [clients]);

  async function loadClients() {
    setError(null);
    setLoading(true);
    try {
      const data = await listClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(safeErrorMessage(err, "Não foi possível carregar a lista de clientes."));
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setError(null);
    setRefreshing(true);
    try {
      const data = await listClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(safeErrorMessage(err, "Não foi possível carregar a lista de clientes."));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  function openModal() {
    setSaveError(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setIsModalOpen(false);
  }

  async function handleCreateClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);

    if (!form.name.trim()) {
      setSaveError("Informe o nome do cliente.");
      return;
    }

    setSaving(true);
    try {
      const payload = normalizeCreatePayload(form);
      await createClient(payload);
      await refresh();
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(safeErrorMessage(err, "Não foi possível cadastrar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="content-body">
      <div className="page-header">
        <div>
          <h2 style={{ marginTop: 0 }}>Clientes</h2>
          <p style={{ color: "#64748b" }}>Cadastro e consulta de clientes.</p>
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
            Novo cliente
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
                  <th>Nome</th>
                  <th style={{ width: 260 }}>Contato</th>
                  <th style={{ width: 240 }}>Documento</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ color: "#64748b" }}>
                      Nenhum cliente cadastrado.
                    </td>
                  </tr>
                ) : (
                  sortedClients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{c.name}</div>
                        <div style={{ color: "#64748b" }}>{formatLocation(c) || "-"}</div>
                      </td>
                      <td>
                        <div>{c.email || "-"}</div>
                        <div style={{ color: "#64748b" }}>{c.phone || "-"}</div>
                      </td>
                      <td>
                        <div>{c.document || "-"}</div>
                        <div style={{ color: "#64748b" }}>{c.rgIe || "-"}</div>
                      </td>
                    </tr>
                  ))
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
                <h3 style={{ margin: 0 }}>Novo cliente</h3>
                <p style={{ margin: "4px 0 0", color: "#64748b" }}>
                  Preencha os dados abaixo e clique em “Salvar”.
                </p>
              </div>

              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Fechar">
                ✕
              </button>
            </div>

            <form className="modal-body" onSubmit={handleCreateClient}>
              {saveError && (
                <div className="alert-error" role="alert" style={{ marginBottom: 12 }}>
                  {saveError}
                </div>
              )}

              <div className="form-grid">
                <label className="field">
                  Nome *
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex.: Maria"
                    required
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Telefone
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Ex.: (85) 99999-9999"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Email
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Ex.: joao@email.com"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  CPF/CNPJ
                  <input
                    value={form.document}
                    onChange={(e) => setForm((p) => ({ ...p, document: e.target.value }))}
                    placeholder="Ex.: 123.456.789-10"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  RG/IE
                  <input
                    value={form.rgIe}
                    onChange={(e) => setForm((p) => ({ ...p, rgIe: e.target.value }))}
                    placeholder="Ex.: 1234567"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  CEP
                  <input
                    value={form.cep}
                    onChange={(e) => setForm((p) => ({ ...p, cep: e.target.value }))}
                    placeholder="Ex.: 63500000"
                    disabled={saving}
                  />
                </label>

                <label className="field field-full">
                  Endereço
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Ex.: Avenida Santos Dumont, 455"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Bairro
                  <input
                    value={form.neighborhood}
                    onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                    placeholder="Ex.: Centro"
                    disabled={saving}
                  />
                </label>

                <label className="field">
                  Cidade
                  <input
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Ex.: Fortaleza"
                    disabled={saving}
                  />
                </label>

                <label className="field field-full">
                  Estado
                  <input
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="Ex.: CE"
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
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}