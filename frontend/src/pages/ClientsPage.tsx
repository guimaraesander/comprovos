import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Client,
  CreateClientInput,
  createClient,
  listClients,
} from "../services/clients";

type FormState = {
  name: string;
  phone: string;
  email: string;
  document: string; // CPF/CNPJ
  rgIe: string;
  cep: string;
  address: string;
  neighborhood: string; // bairro
  city: string;
  state: string;
};

function trim(v: string) {
  return v.trim();
}

function normalizeCreatePayload(form: FormState): CreateClientInput {
  const payload: CreateClientInput = { name: trim(form.name) };

  const maybeSet = (
    key: keyof Omit<CreateClientInput, "name">,
    value: string
  ) => {
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

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
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
  });

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" })
    );
  }, [clients]);

  async function fetchClients() {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await listClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (axios.isAxiosError(err) && !err.response) {
        setLoadError("Não foi possível conectar ao servidor.");
      } else {
        const msg =
          (axios.isAxiosError(err) ? (err.response?.data as any)?.message : null) ||
          "Não foi possível carregar a lista de clientes.";
        setLoadError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setSaveError(null);
    setForm({
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
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return;
    setIsModalOpen(false);
  }

  async function handleCreateClient(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = normalizeCreatePayload(form);
      await createClient(payload);

      await fetchClients();
      setIsModalOpen(false);
    } catch (err: any) {
      if (axios.isAxiosError(err) && !err.response) {
        setSaveError("Não foi possível conectar ao servidor.");
      } else {
        const msg =
          (axios.isAxiosError(err) ? (err.response?.data as any)?.message : null) ||
          "Não foi possível cadastrar o cliente.";
        setSaveError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h2 className="page-title">Clientes</h2>
          <p className="page-subtitle">Cadastro e consulta de clientes.</p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            onClick={fetchClients}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? "Carregando..." : "Atualizar"}
          </button>

          <button
            type="button"
            onClick={openModal}
            className="btn btn-primary"
          >
            Novo cliente
          </button>
        </div>
      </div>

      {loadError && (
        <div className="alert-error" role="alert" style={{ marginBottom: 12 }}>
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="muted">Carregando lista de clientes...</div>
      ) : sortedClients.length === 0 ? (
        <div className="muted">
          <strong>Nenhum cliente cadastrado.</strong> Clique em <b>Novo cliente</b> para adicionar o primeiro.
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Documento</th>
                </tr>
              </thead>

              <tbody>
                {sortedClients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{c.name}</div>
                      <div className="muted">{formatLocation(c) || "-"}</div>
                    </td>

                    <td>
                      <div>{c.email || "-"}</div>
                      <div className="muted">{c.phone || "-"}</div>
                    </td>

                    <td>
                      <div>{c.document || "-"}</div>
                      <div className="muted">{c.rgIe || "-"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Novo cliente</h3>
                <p>Preencha os dados abaixo e clique em “Salvar”.</p>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={closeModal}
                aria-label="Fechar"
                disabled={isSaving}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div className="modal-body">
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
                      onChange={(e) =>
                        setForm((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="Ex.: Maria"
                      required
                      autoFocus
                    />
                  </label>

                  <label className="field">
                    Telefone
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, phone: e.target.value }))
                      }
                      placeholder="Ex.: (85) 99999-9999"
                    />
                  </label>

                  <label className="field">
                    Email
                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, email: e.target.value }))
                      }
                      placeholder="Ex.: joao@email.com"
                    />
                  </label>

                  <label className="field">
                    CPF/CNPJ
                    <input
                      value={form.document}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, document: e.target.value }))
                      }
                      placeholder="Ex.: 123.456.789-10"
                    />
                  </label>

                  <label className="field">
                    RG/IE
                    <input
                      value={form.rgIe}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, rgIe: e.target.value }))
                      }
                      placeholder="Ex.: 1234567"
                    />
                  </label>

                  <label className="field">
                    CEP
                    <input
                      value={form.cep}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, cep: e.target.value }))
                      }
                      placeholder="Ex.: 63500000"
                    />
                  </label>

                  <label className="field field-full">
                    Endereço
                    <input
                      value={form.address}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, address: e.target.value }))
                      }
                      placeholder="Ex.: Avenida Santos Dumont, 455"
                    />
                  </label>

                  <label className="field">
                    Bairro
                    <input
                      value={form.neighborhood}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, neighborhood: e.target.value }))
                      }
                      placeholder="Ex.: Centro"
                    />
                  </label>

                  <label className="field">
                    Cidade
                    <input
                      value={form.city}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, city: e.target.value }))
                      }
                      placeholder="Ex.: Fortaleza"
                    />
                  </label>

                  <label className="field field-full">
                    Estado
                    <input
                      value={form.state}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, state: e.target.value }))
                      }
                      placeholder="Ex.: CE"
                      maxLength={2}
                      style={{ textTransform: "uppercase" }}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}