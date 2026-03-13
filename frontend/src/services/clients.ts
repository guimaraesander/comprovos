import { api } from "./api";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;

  cpfCnpj: string;
  rgIe?: string | null;

  address?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type CreateClientInput = {
  name: string;
  phone: string;
  cpfCnpj: string;

  email?: string | null;
  rgIe?: string | null;

  address?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type UpdateClientInput = Partial<CreateClientInput>;

export async function listClients(): Promise<Client[]> {
  const res = await api.get<Client[]>("/clients");
  return res.data;
}

export async function createClient(payload: CreateClientInput): Promise<Client> {
  const res = await api.post<Client>("/clients", payload);
  return res.data;
}

export async function getClientById(id: string): Promise<Client> {
  const res = await api.get<Client>(`/clients/${id}`);
  return res.data;
}

export async function updateClient(id: string, payload: UpdateClientInput): Promise<Client> {
  const res = await api.put<Client>(`/clients/${id}`, payload);
  return res.data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}