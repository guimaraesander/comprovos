import { api } from "./api";

export type ServiceOrderStatus =
  | "ABERTA"
  | "EM_ANALISE"
  | "AGUARDANDO_APROVACAO"
  | "EM_MANUTENCAO"
  | "FINALIZADA"
  | "ENTREGUE"
  | "CANCELADA";

export type ServiceOrder = {
  id: string;
  osNumber: number;

  clientId: string;
  deviceId: string;

  status: ServiceOrderStatus;

  entryDate?: string;

  symptoms: string;
  accessories?: string | null;
  observations?: string | null;

  budgetValue?: number | string | null;
  finalValue?: number | string | null;

  createdAt?: string;
  updatedAt?: string;

  // Se o backend retornar relations (você já está incluindo client/device no backend)
  client?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    cpfCnpj?: string | null;
  } | null;

  device?: {
    id: string;
    clientId: string;
    type: string;
    brand?: string | null;
    model?: string | null;
    serialNumber?: string | null;
  } | null;
};

export type CreateServiceOrderInput = {
  clientId: string;
  deviceId: string;

  symptoms: string;

  accessories?: string;
  observations?: string;

  budgetValue?: number;
  finalValue?: number;
};

export type UpdateServiceOrderInput = {
  clientId?: string;
  deviceId?: string;

  symptoms?: string;

  accessories?: string | null;
  observations?: string | null;

  budgetValue?: number | null;
  finalValue?: number | null;
};

export async function listServiceOrders(): Promise<ServiceOrder[]> {
  const { data } = await api.get<ServiceOrder[]>("/service-orders");
  return data;
}

export async function getServiceOrderById(id: string): Promise<ServiceOrder> {
  const { data } = await api.get<ServiceOrder>(`/service-orders/${id}`);
  return data;
}

export async function createServiceOrder(input: CreateServiceOrderInput): Promise<ServiceOrder> {
  const { data } = await api.post<ServiceOrder>("/service-orders", input);
  return data;
}

export async function updateServiceOrder(id: string, input: UpdateServiceOrderInput): Promise<ServiceOrder> {
  const { data } = await api.put<ServiceOrder>(`/service-orders/${id}`, input);
  return data;
}

export async function updateServiceOrderStatus(
  id: string,
  input: { status: ServiceOrderStatus }
): Promise<ServiceOrder> {
  const { data } = await api.patch<ServiceOrder>(`/service-orders/${id}/status`, input);
  return data;
}

export async function deleteServiceOrder(id: string): Promise<void> {
  await api.delete(`/service-orders/${id}`);
}