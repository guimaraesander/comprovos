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
  status: ServiceOrderStatus;

  entryDate?: string;

  // dados “congelados” na OS
  clientCpfCnpj: string;

  // equipamento preenchido na OS
  equipmentType: string;
  equipmentBrand?: string | null;
  equipmentModel?: string | null;
  equipmentSerialNumber?: string | null;
  equipmentPassword?: string | null;

  // dados da OS
  symptoms: string;
  accessories?: string | null;
  observations?: string | null;

  budgetValue?: number | string | null;
  finalValue?: number | string | null;

  createdAt?: string;
  updatedAt?: string;

  // relations (você já está incluindo client no backend)
  client?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;

    cpfCnpj?: string | null;
    address?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  } | null;
};

export type CreateServiceOrderInput = {
  clientId: string;
  clientCpfCnpj: string;

  equipmentType: string;
  equipmentBrand?: string;
  equipmentModel?: string;
  equipmentSerialNumber?: string;
  equipmentPassword?: string;

  symptoms: string;
  accessories?: string;
  observations?: string;

  budgetValue?: number;
  finalValue?: number;
};

export type UpdateServiceOrderInput = {
  clientId?: string;
  clientCpfCnpj?: string;

  equipmentType?: string;
  equipmentBrand?: string | null;
  equipmentModel?: string | null;
  equipmentSerialNumber?: string | null;
  equipmentPassword?: string | null;

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