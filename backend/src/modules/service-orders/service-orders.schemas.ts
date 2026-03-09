import { z } from "zod";

const toOptionalString = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}, z.string().min(1).optional());

const toOptionalNumber = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t.length === 0) return undefined;
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().nonnegative().optional());

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
  clientId: z.string().min(1),
  deviceId: z.string().min(1),

  symptoms: z.string().min(1),

  accessories: toOptionalString,
  observations: toOptionalString,

  // valores (se ainda não tiver, pode mandar vazio e fica undefined)
  budgetValue: toOptionalNumber,
  finalValue: toOptionalNumber,
});

export const updateServiceOrderSchema = z.object({
  // permitir trocar vínculo, se seu sistema permitir
  clientId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),

  symptoms: z.string().min(1).optional(),
  accessories: toOptionalString,
  observations: toOptionalString,

  budgetValue: toOptionalNumber,
  finalValue: toOptionalNumber,
});

export const updateServiceOrderStatusSchema = z.object({
  status: serviceOrderStatusSchema,
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
export type UpdateServiceOrderStatusInput = z.infer<typeof updateServiceOrderStatusSchema>;
export type ServiceOrderStatusInput = z.infer<typeof serviceOrderStatusSchema>;