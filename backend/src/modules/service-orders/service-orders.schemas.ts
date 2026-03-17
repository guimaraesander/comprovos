import { z } from "zod";

const toOptionalString = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
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

const toOptionalDate = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
  }
  return v;
}, z.date().optional());

export const serviceOrderStatusSchema = z.enum([
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_MANUTENCAO",
  "FINALIZADA",
  "ENTREGUE",
  "CANCELADA",
]);

export const paymentTypeSchema = z.enum([
  "PIX",
  "DINHEIRO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "BOLETO",
  "OUTRO",
]);

export const createServiceOrderSchema = z.object({
  clientId: z.string().min(1),
  clientCpfCnpj: z.string().min(1),

  equipmentType: z.string().min(1),
  equipmentBrand: toOptionalString,
  equipmentModel: toOptionalString,
  equipmentSerialNumber: toOptionalString,
  equipmentPassword: toOptionalString,

  symptoms: z.string().min(1),
  accessories: toOptionalString,
  observations: toOptionalString,

  budgetValue: toOptionalNumber,
  finalValue: toOptionalNumber,

  paymentType: paymentTypeSchema.optional(),
  paymentDate: toOptionalDate,
  pickupDate: toOptionalDate,
});

export const updateServiceOrderSchema = z.object({
  clientId: z.string().min(1).optional(),
  clientCpfCnpj: z.string().min(1).optional(),

  equipmentType: z.string().min(1).optional(),
  equipmentBrand: toOptionalString,
  equipmentModel: toOptionalString,
  equipmentSerialNumber: toOptionalString,
  equipmentPassword: toOptionalString,

  symptoms: z.string().min(1).optional(),
  accessories: toOptionalString,
  observations: toOptionalString,

  budgetValue: toOptionalNumber,
  finalValue: toOptionalNumber,

  paymentType: paymentTypeSchema.nullable().optional(),
  paymentDate: toOptionalDate.nullable().optional(),
  pickupDate: toOptionalDate.nullable().optional(),
});

export const updateServiceOrderStatusSchema = z.object({
  status: serviceOrderStatusSchema,
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
export type UpdateServiceOrderStatusInput = z.infer<typeof updateServiceOrderStatusSchema>;
export type ServiceOrderStatusInput = z.infer<typeof serviceOrderStatusSchema>;
export type PaymentTypeInput = z.infer<typeof paymentTypeSchema>;