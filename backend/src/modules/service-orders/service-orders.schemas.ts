import { z } from "zod";

export const serviceOrderStatusSchema = z.enum([
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_MANUTENCAO",
  "FINALIZADA",
  "ENTREGUE",
  "CANCELADA",
]);

export const createServiceOrderSchema = z.object({
  clientId: z.string().min(1, "clientId e obrigatorio"),
  deviceId: z.string().min(1, "deviceId e obrigatorio"),

  symptoms: z.string().min(3, "Sintomas devem ter pelo menos 3 caracteres"),
  accessories: z.string().optional(),
  observations: z.string().optional(),

  status: serviceOrderStatusSchema.optional(),

  budgetValue: z.coerce.number().nonnegative().optional(),
  finalValue: z.coerce.number().nonnegative().optional(),

  webKey: z.string().optional(),
  trackingPassword: z.string().optional(),
});

export const updateServiceOrderSchema = z.object({
  clientId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),

  symptoms: z.string().min(3).optional(),
  accessories: z.string().optional(),
  observations: z.string().optional(),

  budgetValue: z.coerce.number().nonnegative().optional(),
  finalValue: z.coerce.number().nonnegative().optional(),

  webKey: z.string().optional(),
  trackingPassword: z.string().optional(),
});

export const updateServiceOrderStatusSchema = z.object({
  status: serviceOrderStatusSchema,
  note: z.string().optional(),
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
export type UpdateServiceOrderStatusInput = z.infer<
  typeof updateServiceOrderStatusSchema
>;