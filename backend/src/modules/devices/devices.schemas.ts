import { z } from "zod";

// helper: aceita string vazia (ex: swagger / form) e transforma em undefined
const optionalText = () =>
  z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => {
      if (typeof v !== "string") return undefined;
      const t = v.trim();
      return t.length ? t : undefined;
    });

export const createDeviceSchema = z.object({
  clientId: z.string().min(1, "clientId é obrigatório").transform((v) => v.trim()),
  type: z.string().min(1, "Tipo é obrigatório").transform((v) => v.trim()),
  brand: optionalText(),
  model: optionalText(),
  serialNumber: optionalText(),
  password: optionalText(),
  accessories: optionalText(),
  notes: optionalText(),
});

export const updateDeviceSchema = createDeviceSchema.partial();

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;