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
  // cliente existe no sistema
  clientId: z.string().min(1),

  // CPF/CNPJ obrigatório na OS (registro “de entrada”)
  clientCpfCnpj: z.string().min(1),

  // equipamento preenchido na OS (não é entidade separada)
  equipmentType: z.string().min(1),
  equipmentBrand: toOptionalString,
  equipmentModel: toOptionalString,
  equipmentSerialNumber: toOptionalString,
  equipmentPassword: toOptionalString,

  // dados da OS
  symptoms: z.string().min(1),
  accessories: toOptionalString,
  observations: toOptionalString,

  budgetValue: toOptionalNumber,
  finalValue: toOptionalNumber,
});

export const updateServiceOrderSchema = z.object({
  // normalmente NÃO muda clientId depois, mas se quiser permitir, deixa optional
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
});

export const updateServiceOrderStatusSchema = z.object({
  status: serviceOrderStatusSchema,
});

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderInput = z.infer<typeof updateServiceOrderSchema>;
export type UpdateServiceOrderStatusInput = z.infer<typeof updateServiceOrderStatusSchema>;
export type ServiceOrderStatusInput = z.infer<typeof serviceOrderStatusSchema>;