import { z } from "zod";

export const createDeviceSchema = z.object({
  clientId: z.string().min(1, "clientId e obrigatorio"),
  type: z.string().min(1, "Tipo e obrigatorio"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  password: z.string().optional(),
  accessories: z.string().optional(),
  notes: z.string().optional(),
});

export const updateDeviceSchema = createDeviceSchema.partial();

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;