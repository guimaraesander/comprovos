import { api } from "./api";

export type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;

  document?: string | null; // CPF/CNPJ
  rgIe?: string | null;

  cep?: string | null;
  address?: string | null;
  neighborhood?: string | null; // BAIRRO
  city?: string | null;
  state?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type CreateClientInput = {
  name: string;
  email?: string;
  phone?: string;

  document?: string;
  rgIe?: string;

  cep?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export async function listClients(): Promise<Client[]> {
  const res = await api.get("/clients");
  return res.data;
}

export async function createClient(payload: CreateClientInput): Promise<Client> {
  const res = await api.post("/clients", payload);
  return res.data;
}

export async function getClientById(id: string): Promise<Client> {
  const res = await api.get(`/clients/${id}`);
  return res.data;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}