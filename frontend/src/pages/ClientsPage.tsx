import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { api } from "../services/api";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cpfCnpj?: string | null;
  rgIe?: string | null;
  address?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type CreateClientInput = {
  name: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  rgIe?: string;
  address?: string;
  district?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

function normalizeOptionalText(value: string): string | undefined {
  const v = value.trim();
  return v.length > 0 ? v : undefined;
}

function parseApiMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message =
      (err.response?.data as { message?: string } | undefined)?.message ||
      (typeof err.message === "string" ? err.message : "");
    return message || "Não foi possível completar a ação.";
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível completar a ação.";
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [rgIe, setRgIe] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [clients]);

  async function fetchClients(signal?: AbortSignal) {
    setLoading(true);
    setLoadError(null);

    try {
      const { data } = await api.get<Client[]>("/clients", { signal });
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      // Se a requisição foi abortada, não mostra erro
      if (axios.isCancel(err)) return;
      // Alguns browsers/axios usam "CanceledError"
      if ((err as any)?.name === "CanceledError") return;

      setLoadError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetchClients(controller.signal);
    return () => controller.abort();
  }, []);

  function openModal() {
    setSaveError(null);
    setName("");
    setPhone("");
    setEmail("");
    setCpfCnpj("");
    setRgIe("");
    setAddress("");
    setDistrict("");
    setCity("");
    setState("");
    setZipCode("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) return; // evita fechar no meio do submit
    setIsModalOpen(false);
  }

  async function handleCreateClient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setSaveError("Informe um nome válido (mínimo 2 caracteres).");
      return;
    }

    const payload: CreateClientInput = {
      name: trimmedName,
      phone: normalizeOptionalText(phone),
      email: normalizeOptionalText(email),
      cpfCnpj: normalizeOptionalText(cpfCnpj),
      rgIe: normalizeOptionalText(rgIe),
      address: normalizeOptionalText(address),
      district: normalizeOptionalText(district),
      city: normalizeOptionalText(city),
      state: normalizeOptionalText(state),
      zipCode: normalizeOptionalText(zipCode),
    };

    setIsSaving(true);
    try {
      const { data } = await api.post<Client>("/clients", payload);
      // Otimista: adiciona no topo e fecha modal
      setClients((prev) => [data, ...prev]);
      setIsModalOpen(false);
    } catch (err) {
      // Mensagem amigável para usuário (sem “backend”)
      const msg = parseApiMessage(err);

      // Se o servidor estiver offline / sem resposta:
      if (axios.isAxiosError(err) && !err.response) {
        setSaveError("Não foi possível conectar ao servidor.");
        return;
      }

      // Mensagem padrão vinda da API (ex.: validação)
      setSaveError(msg || "Não foi possível cadastrar o cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>Clientes</h2>
          <p style={{ color: "#64748b", marginTop: 0, marginBottom: 0 }}>
            Cadastro e consulta de clientes.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => fetchClients()}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Carregando..." : "Atualizar"}
          </button>

          <button
            type="button"
            onClick={openModal}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Novo cliente
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {loadError && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            {loadError}
          </div>
        )}

        {loading ? (
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 14,
              background: "white",
              color: "#64748b",
            }}
          >
            Carregando lista de clientes...
          </div>
        ) : sortedClients.length === 0 ? (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 12,
              padding: 16,
              background: "white",
              color: "#64748b",
            }}
          >
            <strong>Nenhum cliente cadastrado.</strong>
            <div style={{ marginTop: 6 }}>
              Clique em <b>Novo cliente</b> para adicionar o primeiro.
            </div>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              background: "white",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 12,
                      fontSize: 12,
                      color: "#334155",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    Nome
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 12,
                      fontSize: 12,
                      color: "#334155",
                      borderBottom: "1px solid #e2e8f0",
                      width: 220,
                    }}
                  >
                    Contato
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 12,
                      fontSize: 12,
                      color: "#334155",
                      borderBottom: "1px solid #e2e8f0",
                      width: 220,
                    }}
                  >
                    Documento
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((c) => (
                  <tr key={c.id}>
                    <td
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #f1f5f9",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {c.name}
                      <div style={{ fontWeight: 500, color: "#64748b" }}>
                        {c.city || c.district || c.address
                          ? `${c.city ?? ""}${c.city && c.district ? " - " : ""}${
                              c.district ?? ""
                            }`
                          : ""}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #f1f5f9",
                        color: "#334155",
                      }}
                    >
                      <div>{c.email || "-"}</div>
                      <div style={{ color: "#64748b" }}>{c.phone || "-"}</div>
                    </td>
                    <td
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #f1f5f9",
                        color: "#334155",
                      }}
                    >
                      <div>{c.cpfCnpj || "-"}</div>
                      <div style={{ color: "#64748b" }}>{c.rgIe || "-"}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(720px, 100%)",
              background: "white",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>
                  Novo cliente
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Preencha os dados abaixo e clique em “Salvar”.
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                style={{
                  border: "1px solid #e2e8f0",
                  background: "white",
                  borderRadius: 10,
                  padding: "8px 10px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div style={{ padding: 16 }}>
                {saveError && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      color: "#991b1b",
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 12,
                      fontWeight: 600,
                    }}
                  >
                    {saveError}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Nome *
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: João Alves"
                      required
                      autoFocus
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Telefone
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex.: (85) 99999-9999"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Email
                    </span>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex.: joao@email.com"
                      type="email"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      CPF/CNPJ
                    </span>
                    <input
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      placeholder="Ex.: 123.456.789-10"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      RG/IE
                    </span>
                    <input
                      value={rgIe}
                      onChange={(e) => setRgIe(e.target.value)}
                      placeholder="Ex.: 1234567"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      CEP
                    </span>
                    <input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="Ex.: 63500000"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Endereço
                    </span>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex.: Avenida Santos Dumont, 455"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Bairro
                    </span>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Ex.: Centro"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Cidade
                    </span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex.: Fortaleza"
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>
                      Estado
                    </span>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Ex.: CE"
                      maxLength={2}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: "1px solid #cbd5e1",
                        outline: "none",
                        textTransform: "uppercase",
                      }}
                    />
                  </label>
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #2563eb",
                    background: "#2563eb",
                    color: "white",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontWeight: 800,
                    minWidth: 120,
                  }}
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