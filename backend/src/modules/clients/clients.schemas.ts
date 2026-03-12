import { z } from "zod";

function onlyDigits(v: unknown) {
  if (typeof v !== "string") return "";
  return v.replace(/\D/g, "");
}

function trimOrEmpty(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

/**
 * String obrigatória (com mensagem customizada)
 * - transforma undefined/null em ""
 * - trim
 * - valida min(1) para disparar a mensagem
 */
function requiredText(message: string) {
  return z.preprocess(
    (v) => trimOrEmpty(v),
    z.string().min(1, message)
  );
}

const nameSchema = requiredText("Nome é obrigatório").refine(
  (v) => v.length >= 2,
  "Nome deve ter pelo menos 2 caracteres"
);

const phoneSchema = z.preprocess(
  (v) => onlyDigits(v),
  z
    .string()
    .min(1, "Telefone é obrigatório")
    .refine((v) => v.length === 10 || v.length === 11, "Telefone deve ter 10 ou 11 dígitos")
);

const cpfCnpjSchema = z.preprocess(
  (v) => onlyDigits(v),
  z
    .string()
    .min(1, "CPF/CNPJ é obrigatório")
    .refine((v) => v.length === 11 || v.length === 14, "CPF deve ter 11 dígitos ou CNPJ 14 dígitos")
);

/**
 * Email opcional:
 * - undefined/null/"" => undefined
 * - se vier preenchido, valida email
 */
const emailSchema = z.preprocess(
  (v) => {
    const t = trimOrEmpty(v);
    return t.length === 0 ? undefined : t;
  },
  z.string().email("Email inválido").optional()
);

// Campos opcionais: sempre trim; "" vira undefined (evita salvar vazio)
const optionalText = z.preprocess(
  (v) => {
    const t = trimOrEmpty(v);
    return t.length === 0 ? undefined : t;
  },
  z.string().optional()
);

export const createClientSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  cpfCnpj: cpfCnpjSchema,

  email: emailSchema,
  rgIe: optionalText,
  address: optionalText,
  district: optionalText,
  city: optionalText,
  state: optionalText,
  zipCode: optionalText,
});

export const updateClientSchema = z.object({
  // no update você pode deixar tudo opcional
  // e manter as mesmas validações quando vier preenchido
  name: z.preprocess((v) => (v === undefined ? undefined : trimOrEmpty(v)), z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional()),
  phone: z.preprocess((v) => (v === undefined ? undefined : onlyDigits(v)), z.string().refine((v) => v.length === 10 || v.length === 11, "Telefone deve ter 10 ou 11 dígitos").optional()),
  cpfCnpj: z.preprocess((v) => (v === undefined ? undefined : onlyDigits(v)), z.string().refine((v) => v.length === 11 || v.length === 14, "CPF deve ter 11 dígitos ou CNPJ 14 dígitos").optional()),

  email: emailSchema,
  rgIe: optionalText,
  address: optionalText,
  district: optionalText,
  city: optionalText,
  state: optionalText,
  zipCode: optionalText,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;