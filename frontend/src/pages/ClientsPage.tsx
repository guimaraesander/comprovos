import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createClient,
  listClients,
  updateClient,
  type Client,
  type CreateClientInput,
  type UpdateClientInput,
} from "../services/clients";

import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { FormGrid, Field } from "../components/Form";
import { AlertError, Muted } from "../components/Alert";

type FormState = {
  name: string;
  phone: string;
  email: string;
  cpfCnpj: string;
  rgIe: string;
  zipCode: string;
  address: string;
  district: string;
  city: string;
  state: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  email: "",
  cpfCnpj: "",
  rgIe: "",
  zipCode: "",
  address: "",
  district: "",
  city: "",
  state: "",
};

function safeErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function trim(v: string) {
  return (v || "").trim();
}

function normalizeCpfCnpjDigits(v: string) {
  return onlyDigits(v).slice(0, 14);
}

function normalizePhoneDigits(v: string) {
  return onlyDigits(v).slice(0, 11);
}

function normalizeZipDigits(v: string) {
  return onlyDigits(v).slice(0, 8);
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

function validateCpfCnpjDigits(digits: string) {
  return digits.length === 11 || digits.length === 14;
}

function toCreatePayload(form: FormState): CreateClientInput {
  return {
    name: trim(form.name),
    phone: normalizePhoneDigits(form.phone),
    cpfCnpj: normalizeCpfCnpjDigits(form.cpfCnpj),

    email: trim(form.email) || null,
    rgIe: trim(form.rgIe) || null,

    zipCode: normalizeZipDigits(form.zipCode) || null,
    address: trim(form.address) || null,
    district: trim(form.district) || null,
    city: trim(form.city) || null,
    state: trim(form.state).toUpperCase().slice(0, 2) || null,
  };
}

function toUpdatePayload(form: FormState): UpdateClientInput {
  
  const payload = toCreatePayload(form);
  return payload;
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // busca
  const [searchCpfCnpj, setSearchCpfCnpj] = useState("");
  const [appliedCpfCnpj, setAppliedCpfCnpj] = useState("");

  // modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Client | null>(null);
  const [mode, setMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [form, setForm] = useState<FormState>(initialForm);

  async function loadClients() {
    setPageError(null);
    setLoading(true);
    try {
      const data = await listClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setPageError(safeErrorMessage(err, "Não foi possível carregar a lista de clientes."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, []);

  const sortedClients = useMemo(() => {
    const list = Array.isArray(clients) ? [...clients] : [];
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" }));
    return list;
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = normalizeCpfCnpjDigits(appliedCpfCnpj);

    if (!q) return sortedClients;

    // Busca CPF/CNPJ:
    // - se tiver 11/14 dígitos, busca EXATA
    // - senão, mantém busca por "contém"
    const isExact = q.length === 11 || q.length === 14;

    return sortedClients.filter((c) => {
      const digits = onlyDigits(String(c.cpfCnpj || ""));
      return isExact ? digits === q : digits.includes(q);
    });
  }, [sortedClients, appliedCpfCnpj]);

  function openCreate() {
    setMode("CREATE");
    setSelected(null);
    setModalError(null);
    setForm(initialForm);
    setIsFormOpen(true);
  }

  function openEdit(c: Client) {
    setMode("EDIT");
    setSelected(c);
    setModalError(null);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      cpfCnpj: c.cpfCnpj || "",
      rgIe: c.rgIe || "",
      zipCode: c.zipCode || "",
      address: c.address || "",
      district: c.district || "",
      city: c.city || "",
      state: c.state || "",
    });
    setIsFormOpen(true);
  }

  function openView(c: Client) {
    setSelected(c);
    setIsViewOpen(true);
  }

  function closeAllModals() {
    if (saving) return;
    setIsFormOpen(false);
    setIsViewOpen(false);
  }

  function applySearch() {
    setAppliedCpfCnpj(searchCpfCnpj);
  }

  function clearSearch() {
    setSearchCpfCnpj("");
    setAppliedCpfCnpj("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setModalError(null);

    const name = trim(form.name);
    const phoneDigits = normalizePhoneDigits(form.phone);
    const cpfCnpjDigits = normalizeCpfCnpjDigits(form.cpfCnpj);

    if (!name) return setModalError("Informe o nome do cliente.");
    if (!phoneDigits) return setModalError("Informe o telefone do cliente.");
    if (!cpfCnpjDigits) return setModalError("Informe o CPF/CNPJ do cliente.");
    if (!validateCpfCnpjDigits(cpfCnpjDigits)) {
      return setModalError("CPF deve ter 11 dígitos ou CNPJ 14 dígitos.");
    }

    setSaving(true);
    try {
      if (mode === "CREATE") {
        const payload = toCreatePayload(form);
        const created = await createClient(payload);
        setClients((prev) => [...prev, created]);
      } else {
        if (!selected) throw new Error("Cliente não selecionado para edição.");
        const payload = toUpdatePayload(form);
        const updated = await updateClient(selected.id, payload);
        setClients((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      }

      closeAllModals();
    } catch (err) {
      setModalError(safeErrorMessage(err, "Não foi possível salvar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  const modalFooter = (
    <>
      <Button type="button" variant="secondary" onClick={closeAllModals} disabled={saving}>
        Cancelar
      </Button>

      <Button type="submit" variant="primary" disabled={saving} form="client-form">
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </>
  );

  return (
    <section className="content-body">
      <PageHeader
        title="Clientes"
        subtitle="Cadastro e consulta de clientes."
        actions={
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                value={searchCpfCnpj}
                onChange={(e) => setSearchCpfCnpj(normalizeCpfCnpjDigits(e.target.value))}
                placeholder="Buscar por CPF/CNPJ…"
                inputMode="numeric"
                maxLength={14}
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.12)",
                  outline: "none",
                  minWidth: 240,
                }}
                disabled={loading}
              />

              <Button type="button" variant="secondary" onClick={applySearch} disabled={loading}>
                Buscar
              </Button>

              <Button type="button" variant="secondary" onClick={clearSearch} disabled={loading}>
                Limpar
              </Button>

              <Button type="button" variant="primary" onClick={openCreate} disabled={loading}>
                Novo cliente
              </Button>
            </div>
          </>
        }
      />

      {pageError && <AlertError className="mb-12">{pageError}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: 280 }}>Contato</th>
                <th style={{ width: 220 }}>CPF/CNPJ</th>
                <th style={{ width: 260 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <Muted>Nenhum cliente encontrado.</Muted>
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{c.name}</div>
                      <Muted>
                        {(c.city || c.district)
                          ? `${c.city || ""}${c.city && c.district ? " • " : ""}${c.district || ""}`
                          : "-"}
                      </Muted>
                    </td>

                    <td>
                      <div>{c.email || "-"}</div>
                      <Muted>{c.phone || "-"}</Muted>
                    </td>

                    <td>{c.cpfCnpj || "-"}</td>

                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button type="button" variant="secondary" onClick={() => openView(c)}>
                          Visualizar
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* MODAL CREATE/EDIT */}
      <Modal
        title={mode === "CREATE" ? "Novo cliente" : "Editar cliente"}
        subtitle={
          mode === "CREATE"
            ? "Preencha os dados abaixo e clique em “Salvar”."
            : "Atualize os dados do cliente e clique em “Salvar”."
        }
        isOpen={isFormOpen}
        onClose={closeAllModals}
        disableClose={saving}
        footer={modalFooter}
      >
        <form id="client-form" onSubmit={handleSubmit}>
          {modalError && <AlertError className="mb-12">{modalError}</AlertError>}

          <FormGrid>
            <Field label="Nome *">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value.slice(0, 120) }))}
                placeholder="Ex.: Maria"
                required
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="Telefone *">
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: normalizePhoneDigits(e.target.value) }))}
                placeholder="Somente números (11 dígitos)"
                required
                inputMode="numeric"
                maxLength={11}
                disabled={saving}
              />
            </Field>

            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value.slice(0, 120) }))}
                placeholder="Ex.: joao@email.com"
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="CPF/CNPJ *">
              <input
                value={form.cpfCnpj}
                onChange={(e) => setForm((p) => ({ ...p, cpfCnpj: normalizeCpfCnpjDigits(e.target.value) }))}
                placeholder="Somente números (11 ou 14 dígitos)"
                required
                inputMode="numeric"
                maxLength={14}
                disabled={saving}
              />
            </Field>

            <Field label="RG/IE">
              <input
                value={form.rgIe}
                onChange={(e) => setForm((p) => ({ ...p, rgIe: e.target.value.slice(0, 30) }))}
                placeholder="Opcional"
                maxLength={30}
                disabled={saving}
              />
            </Field>

            <Field label="CEP">
              <input
                value={form.zipCode}
                onChange={(e) => setForm((p) => ({ ...p, zipCode: normalizeZipDigits(e.target.value) }))}
                placeholder="Somente números (8 dígitos)"
                inputMode="numeric"
                maxLength={8}
                disabled={saving}
              />
            </Field>

            <Field label="Endereço" full>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value.slice(0, 160) }))}
                placeholder="Ex.: Avenida Santos Dumont, 455"
                maxLength={160}
                disabled={saving}
              />
            </Field>

            <Field label="Bairro">
              <input
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value.slice(0, 80) }))}
                placeholder="Ex.: Centro"
                maxLength={80}
                disabled={saving}
              />
            </Field>

            <Field label="Cidade">
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value.slice(0, 80) }))}
                placeholder="Ex.: Fortaleza"
                maxLength={80}
                disabled={saving}
              />
            </Field>

            <Field label="Estado" full>
              <input
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value.toUpperCase().slice(0, 2) }))}
                placeholder="Ex.: CE"
                maxLength={2}
                disabled={saving}
              />
            </Field>
          </FormGrid>

          <div style={{ marginTop: 10 }}>
            <Muted>* Campos obrigatórios</Muted>
          </div>
        </form>
      </Modal>

      {/* MODAL VIEW */}
      <Modal
        title="Visualizar cliente"
        subtitle={selected ? `ID: ${selected.id} • Cadastrado em: ${formatDateTimeBR(selected.createdAt)}` : ""}
        isOpen={isViewOpen}
        onClose={closeAllModals}
        disableClose={saving}
        footer={
          <Button type="button" variant="secondary" onClick={closeAllModals} disabled={saving}>
            Fechar
          </Button>
        }
      >
        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados principais</div>
              <div><strong>Nome:</strong> {selected.name}</div>
              <div><strong>Telefone:</strong> {selected.phone}</div>
              <div><strong>Email:</strong> {selected.email || "-"}</div>
              <div><strong>CPF/CNPJ:</strong> {selected.cpfCnpj}</div>
              <div><strong>RG/IE:</strong> {selected.rgIe || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Endereço</div>
              <div><strong>CEP:</strong> {selected.zipCode || "-"}</div>
              <div><strong>Endereço:</strong> {selected.address || "-"}</div>
              <div><strong>Bairro:</strong> {selected.district || "-"}</div>
              <div><strong>Cidade:</strong> {selected.city || "-"}</div>
              <div><strong>Estado:</strong> {selected.state || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Sistema</div>
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Criado em:</strong> {formatDateTimeBR(selected.createdAt)}</div>
              <div><strong>Atualizado em:</strong> {formatDateTimeBR(selected.updatedAt)}</div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}