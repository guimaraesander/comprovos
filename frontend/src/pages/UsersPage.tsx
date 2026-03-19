import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { createUser, deleteUser, listUsers, type User, type UserRole } from "../services/users";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { FormGrid, Field } from "../components/Form";
import { AlertError, Muted } from "../components/Alert";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const initialForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "TECNICO",
};

function safeErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

function trim(value: string) {
  return (value || "").trim();
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

function roleLabel(role: UserRole) {
  return role === "ADMIN" ? "Administrador" : "Técnico";
}

export function UsersPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadUsers() {
      setPageError(null);
      setLoading(true);

      try {
        const data = await listUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setPageError(safeErrorMessage(err, "Não foi possível carregar os usuários."));
      } finally {
        setLoading(false);
      }
    }

    void loadUsers();
  }, [isAdmin]);

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" }));
    return list;
  }, [users]);

  function openCreate() {
    setModalError(null);
    setForm(initialForm);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setIsFormOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalError(null);

    const name = trim(form.name);
    const email = trim(form.email).toLowerCase();
    const password = form.password;

    if (!name) return setModalError("Informe o nome do usuário.");
    if (!email) return setModalError("Informe o email do usuário.");
    if (!password) return setModalError("Informe a senha do usuário.");
    if (password.length < 6) return setModalError("A senha deve ter pelo menos 6 caracteres.");

    setSaving(true);

    try {
      const created = await createUser({
        name,
        email,
        password,
        role: form.role,
      });

      setUsers((prev) => [created, ...prev]);
      closeForm();
    } catch (err) {
      setModalError(safeErrorMessage(err, "Não foi possível criar o usuário."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: User) {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o usuário "${target.name}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmed) return;

    setPageError(null);
    setDeletingUserId(target.id);

    try {
      await deleteUser(target.id);
      setUsers((prev) => prev.filter((item) => item.id !== target.id));
    } catch (err) {
      setPageError(safeErrorMessage(err, "Não foi possível excluir o usuário."));
    } finally {
      setDeletingUserId(null);
    }
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const modalFooter = (
    <>
      <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
        Cancelar
      </Button>
      <Button type="submit" variant="primary" form="user-form" disabled={saving}>
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </>
  );

  return (
    <section className="content-body">
            <div className="page-head">
        <div>
          <h1 className="page-title">Usuários</h1>
          <p className="page-subtitle">Gerencie os usuários internos do sistema.</p>
        </div>
        <div className="page-actions">
          <Button type="button" variant="primary" onClick={openCreate} disabled={loading}>
            Novo usuário
          </Button>
        </div>
      </div>

      {pageError && <AlertError className="mb-12">{pageError}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th style={{ width: 160 }}>Perfil</th>
                <th style={{ width: 180 }}>Criado em</th>
                <th style={{ width: 180 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Muted>Nenhum usuário encontrado.</Muted>
                  </td>
                </tr>
              ) : (
                sortedUsers.map((item) => {
                  const isDeleting = deletingUserId === item.id;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{item.name}</div>
                      </td>
                      <td>{item.email}</td>
                      <td>{roleLabel(item.role)}</td>
                      <td>{formatDateTimeBR(item.createdAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => void handleDelete(item)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Excluindo..." : "Excluir"}
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

      <Modal
        title="Novo usuário"
        subtitle="Cadastre um novo usuário interno do sistema."
        isOpen={isFormOpen}
        onClose={closeForm}
        disableClose={saving}
        footer={modalFooter}
      >
        <form id="user-form" onSubmit={handleSubmit}>
          {modalError && <AlertError className="mb-12">{modalError}</AlertError>}

          <FormGrid>
            <Field label="Nome *">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value.slice(0, 120) }))}
                placeholder="Ex.: João Técnico"
                required
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="Email *">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value.slice(0, 120) }))}
                placeholder="Ex.: joao@comprovos.com"
                required
                maxLength={120}
                disabled={saving}
              />
            </Field>

            <Field label="Senha *">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value.slice(0, 100) }))}
                placeholder="Mínimo de 6 caracteres"
                required
                minLength={6}
                maxLength={100}
                disabled={saving}
              />
            </Field>

            <Field label="Perfil *">
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    role: e.target.value as UserRole,
                  }))
                }
                disabled={saving}
              >
                <option value="TECNICO">Técnico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Field>
          </FormGrid>

          <div style={{ marginTop: 10 }}>
            <Muted>* Campos obrigatórios</Muted>
          </div>
        </form>
      </Modal>
    </section>
  );
}



