import { api } from "./api";

export type Device = {
  id: string;
  clientId: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  password?: string | null;
  accessories?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateDeviceInput = {
  clientId: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  password?: string;
  accessories?: string;
  notes?: string;
};

export async function listDevices() {
  const { data } = await api.get<Device[]>("/devices");
  return data;
}

export async function createDevice(input: CreateDeviceInput) {
  const { data } = await api.post<Device>("/devices", input);
  return data;
}