import { z } from "zod";

const toOptionalString = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t.length === 0 ? undefined : t;
}, z.string().min(1).optional());

const toNumber = z.preprocess((v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return v;
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().finite());

const toNonNegativeMoney = toNumber.refine((n) => n >= 0, { message: "Valor não pode ser negativo." });

export const budgetItemSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória."),
  technician: toOptionalString,
  qty: z
    .number()
    .int("Quantidade deve ser inteira.")
    .min(1, "Quantidade mínima é 1.")
    .default(1),
  unitValue: toNonNegativeMoney,
});

export const upsertBudgetSchema = z.object({
  travelFee: toNonNegativeMoney.optional().default(0),
  thirdPartyFee: toNonNegativeMoney.optional().default(0),
  discount: toNonNegativeMoney.optional().default(0),
  note: toOptionalString,
  items: z.array(budgetItemSchema).optional().default([]),
});

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
export type BudgetItemInput = z.infer<typeof budgetItemSchema>;