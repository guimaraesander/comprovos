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
  return z.preprocess((v) => trimOrEmpty(v), z.string().min(1, message));
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
 * Email opcional (CREATE):
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

/**
 * Texto opcional (CREATE):
 * - trim
 * - "" => undefined
 */
const optionalText = z.preprocess(
  (v) => {
    const t = trimOrEmpty(v);
    return t.length === 0 ? undefined : t;
  },
  z.string().optional()
);

/**
 * Texto "clearable" (UPDATE):
 * - undefined => não altera
 * - null => limpa (null)
 * - "" (string vazia) => limpa (null)
 * - "abc" => "abc"
 */
function clearableText() {
  return z.preprocess((v) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (typeof v !== "string") return undefined;

    const t = v.trim();
    return t.length === 0 ? null : t;
  }, z.union([z.string(), z.null()]).optional());
}

/**
 * Email "clearable" (UPDATE):
 * - undefined => não altera
 * - null => limpa
 * - "" => limpa
 * - string => valida email
 */
const clearableEmailSchema = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return undefined;

  const t = v.trim();
  return t.length === 0 ? null : t;
}, z.union([z.string().email("Email inválido"), z.null()]).optional());

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
  name: z.preprocess(
    (v) => (v === undefined ? undefined : trimOrEmpty(v)),
    z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional()
  ),

  phone: z.preprocess(
    (v) => (v === undefined ? undefined : onlyDigits(v)),
    z.string().refine((v) => v.length === 10 || v.length === 11, "Telefone deve ter 10 ou 11 dígitos").optional()
  ),

  cpfCnpj: z.preprocess(
    (v) => (v === undefined ? undefined : onlyDigits(v)),
    z.string().refine((v) => v.length === 11 || v.length === 14, "CPF deve ter 11 dígitos ou CNPJ 14 dígitos").optional()
  ),

  
  email: clearableEmailSchema,
  rgIe: clearableText(),

  address: clearableText(),
  district: clearableText(),
  city: clearableText(),
  state: clearableText(),
  zipCode: clearableText(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;