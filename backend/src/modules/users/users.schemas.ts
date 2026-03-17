import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "TECNICO"]);

export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres.")
    .max(120, "Nome deve ter no máximo 120 caracteres."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um email válido.")
    .max(120, "Email deve ter no máximo 120 caracteres."),

  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres.")
    .max(100, "Senha deve ter no máximo 100 caracteres."),

  role: userRoleSchema,
});

export const userIdParamsSchema = z.object({
  id: z.string().trim().min(1, "ID do usuário é obrigatório."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;