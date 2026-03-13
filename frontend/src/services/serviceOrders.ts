import { api } from "./api";

export type ServiceOrderStatus =
  | "ABERTA"
  | "EM_ANALISE"
  | "AGUARDANDO_APROVACAO"
  | "EM_MANUTENCAO"
  | "FINALIZADA"
  | "ENTREGUE"
  | "CANCELADA";

export type ServiceOrderBudgetItem = {
  id: string;
  description: string;
  technician?: string | null;
  qty: number;
  unitValue: number | string; // Prisma Decimal costuma vir como string
};

export type ServiceOrderBudget = {
  id: string;
  serviceOrderId: string;

  travelFee: number | string; // deslocamento
  thirdPartyFee: number | string; // terceiros
  discount: number | string;

  note?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;

  items: ServiceOrderBudgetItem[];

  createdAt?: string;
  updatedAt?: string;
};

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

  // (mantidos por compatibilidade / uso futuro)
  budgetValue?: number | string | null;
  finalValue?: number | string | null;

  createdAt?: string;
  updatedAt?: string;

  // relations
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

  budget?: ServiceOrderBudget | null;
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

  // não enviar budgetValue/finalValue no create (orçamento é outro fluxo)
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

  // não enviar budgetValue/finalValue aqui (orçamento é outro fluxo)
};

export type UpsertBudgetItemInput = {
  description: string;
  technician?: string | null;
  qty: number;
  unitValue: number;
};

export type UpsertBudgetInput = {
  travelFee?: number;
  thirdPartyFee?: number;
  discount?: number;
  note?: string | null;
  items?: UpsertBudgetItemInput[];
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

export async function updateServiceOrderStatus(id: string, input: { status: ServiceOrderStatus }): Promise<ServiceOrder> {
  const { data } = await api.patch<ServiceOrder>(`/service-orders/${id}/status`, input);
  return data;
}

export async function getServiceOrderBudget(serviceOrderId: string): Promise<ServiceOrderBudget> {
  const { data } = await api.get<ServiceOrderBudget>(`/service-orders/${serviceOrderId}/budget`);
  return data;
}

export async function upsertServiceOrderBudget(
  serviceOrderId: string,
  input: UpsertBudgetInput
): Promise<ServiceOrderBudget> {
  const { data } = await api.put<ServiceOrderBudget>(`/service-orders/${serviceOrderId}/budget`, input);
  return data;
}