import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  createClient,
  listClients,
  type Client,
  type CreateClientInput,
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

  const modalFooter = (
    <>
      <Button type="button" variant="secondary" onClick={closeModal} disabled={saving}>
        Cancelar
      </Button>

      <Button
        type="submit"
        variant="primary"
        disabled={saving}
        form="create-client-form"
      >
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
            <Button
              type="button"
              variant="secondary"
              onClick={refresh}
              disabled={loading || refreshing}
            >
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>

            <Button type="button" variant="primary" onClick={openModal} disabled={loading}>
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
                <th style={{ width: 240 }}>Documento</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <Muted>Nenhum cliente cadastrado.</Muted>
                  </td>
                </tr>
              ) : (
                sortedClients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 800 }}>{c.name}</div>
                      <Muted>{formatLocation(c) || "-"}</Muted>
                    </td>
                    <td>
                      <div>{c.email || "-"}</div>
                      <Muted>{c.phone || "-"}</Muted>
                    </td>
                    <td>
                      <div>{c.document || "-"}</div>
                      <Muted>{c.rgIe || "-"}</Muted>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal
        title="Novo cliente"
        subtitle="Preencha os dados abaixo e clique em “Salvar”."
        isOpen={isModalOpen}
        onClose={closeModal}
        disableClose={saving}
        footer={modalFooter}
      >
        <form id="create-client-form" onSubmit={handleCreateClient}>
          {saveError && <AlertError className="mb-12">{saveError}</AlertError>}

          <FormGrid>
            <Field label="Nome *">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex.: Maria"
                required
                disabled={saving}
              />
            </Field>

            <Field label="Telefone">
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Ex.: (85) 99999-9999"
                disabled={saving}
              />
            </Field>

            <Field label="Email">
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Ex.: joao@email.com"
                disabled={saving}
              />
            </Field>

            <Field label="CPF/CNPJ">
              <input
                value={form.document}
                onChange={(e) => setForm((p) => ({ ...p, document: e.target.value }))}
                placeholder="Ex.: 123.456.789-10"
                disabled={saving}
              />
            </Field>

            <Field label="RG/IE">
              <input
                value={form.rgIe}
                onChange={(e) => setForm((p) => ({ ...p, rgIe: e.target.value }))}
                placeholder="Ex.: 1234567"
                disabled={saving}
              />
            </Field>

            <Field label="CEP">
              <input
                value={form.cep}
                onChange={(e) => setForm((p) => ({ ...p, cep: e.target.value }))}
                placeholder="Ex.: 63500000"
                disabled={saving}
              />
            </Field>

            <Field label="Endereço" full>
              <input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Ex.: Avenida Santos Dumont, 455"
                disabled={saving}
              />
            </Field>

            <Field label="Bairro">
              <input
                value={form.neighborhood}
                onChange={(e) =>
                  setForm((p) => ({ ...p, neighborhood: e.target.value }))
                }
                placeholder="Ex.: Centro"
                disabled={saving}
              />
            </Field>

            <Field label="Cidade">
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="Ex.: Fortaleza"
                disabled={saving}
              />
            </Field>

            <Field label="Estado" full>
              <input
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                placeholder="Ex.: CE"
                disabled={saving}
              />
            </Field>
          </FormGrid>
        </form>
      </Modal>
    </section>
  );
}