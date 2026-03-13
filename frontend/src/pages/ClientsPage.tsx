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

function normalizeCreatePayload(form: FormState): CreateClientInput {
  const name = trim(form.name);
  const phone = trim(form.phone);
  const cpfCnpj = onlyDigits(form.cpfCnpj);

  const payload: CreateClientInput = {
    name,
    phone,
    cpfCnpj,
    email: trim(form.email) || null,
    rgIe: trim(form.rgIe) || null,
    zipCode: onlyDigits(form.zipCode) || null,
    address: trim(form.address) || null,
    district: trim(form.district) || null,
    city: trim(form.city) || null,
    state: trim(form.state).toUpperCase() || null,
  };

  return payload;
}

function normalizeUpdatePayload(form: FormState): UpdateClientInput {
  // mesma normalização (mas sem obrigar preenchimento)
  const payload: UpdateClientInput = {
    name: trim(form.name) || undefined,
    phone: trim(form.phone) || undefined,
    cpfCnpj: onlyDigits(form.cpfCnpj) || undefined,

    email: trim(form.email) ? trim(form.email) : null,
    rgIe: trim(form.rgIe) ? trim(form.rgIe) : null,

    zipCode: onlyDigits(form.zipCode) ? onlyDigits(form.zipCode) : null,
    address: trim(form.address) ? trim(form.address) : null,
    district: trim(form.district) ? trim(form.district) : null,
    city: trim(form.city) ? trim(form.city) : null,
    state: trim(form.state) ? trim(form.state).toUpperCase() : null,
  };

  // remove undefined (pra não “zerar” sem querer)
  Object.keys(payload).forEach((k) => {
    const key = k as keyof UpdateClientInput;
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
}

function formatContact(c: Client) {
  const email = c.email ? String(c.email) : "";
  const phone = c.phone ? String(c.phone) : "";
  return { email, phone };
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" }));
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

  function openCreate() {
    setSaveError(null);
    setSelected(null);
    setForm(initialForm);
    setIsCreateOpen(true);
  }

  function openEdit(c: Client) {
    setSaveError(null);
    setSelected(c);

    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email ? String(c.email) : "",

      cpfCnpj: c.cpfCnpj || "",
      rgIe: c.rgIe ? String(c.rgIe) : "",

      zipCode: c.zipCode ? String(c.zipCode) : "",
      address: c.address ? String(c.address) : "",
      district: c.district ? String(c.district) : "",
      city: c.city ? String(c.city) : "",
      state: c.state ? String(c.state) : "",
    });

    setIsEditOpen(true);
  }

  function closeModals() {
    if (saving) return;
    setIsCreateOpen(false);
    setIsEditOpen(false);
  }

  function validateRequired() {
    const name = trim(form.name);
    const phone = trim(form.phone);
    const cpf = onlyDigits(form.cpfCnpj);

    if (!name) return "Informe o nome do cliente.";
    if (!phone) return "Informe o telefone.";
    if (!cpf) return "Informe o CPF/CNPJ.";
    if (!(cpf.length === 11 || cpf.length === 14)) return "CPF deve ter 11 dígitos ou CNPJ 14 dígitos.";

    return null;
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);

    const msg = validateRequired();
    if (msg) return setSaveError(msg);

    setSaving(true);
    try {
      const payload = normalizeCreatePayload(form);
      await createClient(payload);
      await refresh();
      setIsCreateOpen(false);
    } catch (err) {
      setSaveError(safeErrorMessage(err, "Não foi possível cadastrar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;

    setSaveError(null);

    const msg = validateRequired();
    if (msg) return setSaveError(msg);

    setSaving(true);
    try {
      const payload = normalizeUpdatePayload(form);
      await updateClient(selected.id, payload);
      await refresh();
      setIsEditOpen(false);
    } catch (err) {
      setSaveError(safeErrorMessage(err, "Não foi possível atualizar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  const modalFooterCreate = (
    <>
      <Button type="button" variant="secondary" onClick={closeModals} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving} form="create-client-form">
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </>
  );

  const modalFooterEdit = (
    <>
      <Button type="button" variant="secondary" onClick={closeModals} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" disabled={saving} form="edit-client-form">
        {saving ? "Salvando..." : "Salvar alterações"}
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
            <Button type="button" variant="secondary" onClick={refresh} disabled={loading || refreshing}>
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>

            <Button type="button" variant="primary" onClick={openCreate} disabled={loading}>
              Novo cliente
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
                <th>Nome</th>
                <th style={{ width: 260 }}>Contato</th>
                <th style={{ width: 240 }}>CPF/CNPJ</th>
                <th style={{ width: 180 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <Muted>Nenhum cliente cadastrado.</Muted>
                  </td>
                </tr>
              ) : (
                sortedClients.map((c) => {
                  const { email, phone } = formatContact(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{c.name}</div>
                        <Muted>
                          {c.city || c.district || c.address ? [c.city, c.district, c.address].filter(Boolean).join(" • ") : "-"}
                        </Muted>
                      </td>

                      <td>
                        <div>{email || "-"}</div>
                        <Muted>{phone || "-"}</Muted>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700 }}>{c.cpfCnpj || "-"}</div>
                      </td>

                      <td>
                        <Button type="button" variant="secondary" onClick={() => openEdit(c)}>
                          Editar
                        </Button>
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
        title="Novo cliente"
        subtitle="Preencha os dados abaixo e clique em “Salvar”."
        isOpen={isCreateOpen}
        onClose={closeModals}
        disableClose={saving}
        footer={modalFooterCreate}
      >
        <form id="create-client-form" onSubmit={handleCreate}>
          {saveError && <AlertError className="mb-12">{saveError}</AlertError>}

          <FormGrid>
            <Field label="Nome *">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex.: Maria"
                required
                maxLength={80}
                disabled={saving}
              />
            </Field>

            <Field label="Telefone *">
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Ex.: (85) 99999-9999"
                required
                maxLength={20}
                disabled={saving}
              />
            </Field>

            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Ex.: joao@email.com"
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="CPF/CNPJ *">
              <input
                value={form.cpfCnpj}
                onChange={(e) => setForm((p) => ({ ...p, cpfCnpj: e.target.value }))}
                placeholder="Ex.: 123.456.789-10"
                required
                maxLength={18}
                disabled={saving}
              />
            </Field>

            <Field label="RG/IE">
              <input
                value={form.rgIe}
                onChange={(e) => setForm((p) => ({ ...p, rgIe: e.target.value }))}
                placeholder="Ex.: 1234567"
                maxLength={20}
                disabled={saving}
              />
            </Field>

            <Field label="CEP">
              <input
                value={form.zipCode}
                onChange={(e) => setForm((p) => ({ ...p, zipCode: e.target.value }))}
                placeholder="Ex.: 63500000"
                maxLength={9}
                disabled={saving}
              />
            </Field>

            <Field label="Endereço" full>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Ex.: Avenida Santos Dumont, 455"
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="Bairro">
              <input
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                placeholder="Ex.: Centro"
                maxLength={60}
                disabled={saving}
              />
            </Field>

            <Field label="Cidade">
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="Ex.: Fortaleza"
                maxLength={60}
                disabled={saving}
              />
            </Field>

            <Field label="Estado" full>
              <input
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                placeholder="Ex.: CE"
                maxLength={2}
                disabled={saving}
              />
            </Field>
          </FormGrid>

          <Muted style={{ marginTop: 10 }}>* Campos obrigatórios</Muted>
        </form>
      </Modal>

      {/* EDIT */}
      <Modal
        title="Editar cliente"
        subtitle={selected ? `Editando: ${selected.name}` : ""}
        isOpen={isEditOpen}
        onClose={closeModals}
        disableClose={saving}
        footer={modalFooterEdit}
      >
        <form id="edit-client-form" onSubmit={handleUpdate}>
          {saveError && <AlertError className="mb-12">{saveError}</AlertError>}

          <FormGrid>
            <Field label="Nome *">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                maxLength={80}
                disabled={saving}
              />
            </Field>

            <Field label="Telefone *">
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
                maxLength={20}
                disabled={saving}
              />
            </Field>

            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="CPF/CNPJ *">
              <input
                value={form.cpfCnpj}
                onChange={(e) => setForm((p) => ({ ...p, cpfCnpj: e.target.value }))}
                required
                maxLength={18}
                disabled={saving}
              />
            </Field>

            <Field label="RG/IE">
              <input
                value={form.rgIe}
                onChange={(e) => setForm((p) => ({ ...p, rgIe: e.target.value }))}
                maxLength={20}
                disabled={saving}
              />
            </Field>

            <Field label="CEP">
              <input
                value={form.zipCode}
                onChange={(e) => setForm((p) => ({ ...p, zipCode: e.target.value }))}
                maxLength={9}
                disabled={saving}
              />
            </Field>

            <Field label="Endereço" full>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="Bairro">
              <input
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                maxLength={60}
                disabled={saving}
              />
            </Field>

            <Field label="Cidade">
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                maxLength={60}
                disabled={saving}
              />
            </Field>

            <Field label="Estado" full>
              <input
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                maxLength={2}
                disabled={saving}
              />
            </Field>
          </FormGrid>

          <Muted style={{ marginTop: 10 }}>* Campos obrigatórios</Muted>
        </form>
      </Modal>
    </section>
  );
}