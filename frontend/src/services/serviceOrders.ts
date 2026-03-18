import { api } from "./api";

export type ServiceOrderStatus =
  | "ABERTA"
  | "EM_ANALISE"
  | "AGUARDANDO_APROVACAO"
  | "EM_MANUTENCAO"
  | "FINALIZADA"
  | "PAGO"
  | "ENTREGUE"
  | "CANCELADA";

export type PaymentType =
  | "PIX"
  | "DINHEIRO"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "TRANSFERENCIA"
  | "BOLETO"
  | "OUTRO";

export type ServiceOrderBudgetItem = {
  id: string;
  description: string;
  technician?: string | null;
  qty: number;
  unitValue: number | string;
};

export type ServiceOrderBudget = {
  id: string;
  serviceOrderId: string;
  travelFee: number | string;
  thirdPartyFee: number | string;
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

  clientCpfCnpj: string;

  equipmentType: string;
  equipmentBrand?: string | null;
  equipmentModel?: string | null;
  equipmentSerialNumber?: string | null;
  equipmentPassword?: string | null;

  symptoms: string;
  accessories?: string | null;
  observations?: string | null;

  budgetValue?: number | string | null;
  finalValue?: number | string | null;

  paymentType?: PaymentType | null;
  paymentDate?: string | null;
  pickupDate?: string | null;

  createdAt?: string;
  updatedAt?: string;

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

  createdByUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
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
  paymentType?: PaymentType | null;
  paymentDate?: string | null;
  pickupDate?: string | null;
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