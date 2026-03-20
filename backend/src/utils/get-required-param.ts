import { HttpError } from "./http-error";

export function getRequiredParam(
  params: Record<string, unknown>,
  key: string
): string {
  const value = params?.[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw HttpError.badRequest(`Parametro "${key}" e obrigatorio.`);
  }

  return value.trim();
}
