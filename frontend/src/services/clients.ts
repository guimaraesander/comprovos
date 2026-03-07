import { api } from "./api";

export type Client = {
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

export type CreateClientInput = {
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

export type UpdateClientInput = Partial<CreateClientInput>;

export async function listClients(): Promise<Client[]> {
  const res = await api.get<Client[]>("/clients");
  return res.data;
}

export async function getClientById(id: string): Promise<Client> {
  const res = await api.get<Client>(`/clients/${id}`);
  return res.data;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const res = await api.post<Client>("/clients", input);
  return res.data;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const res = await api.put<Client>(`/clients/${id}`, input);
  return res.data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}