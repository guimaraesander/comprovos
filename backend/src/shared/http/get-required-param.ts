import { HttpError } from "../../utils/http-error";

type ParamsValue = string | string[] | undefined;

type ParamsLike = Record<string, ParamsValue>;

export function getRequiredParam(
  params: ParamsLike,
  key: string,
  errorMessage?: string
): string {
  const value = params[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw HttpError.badRequest(errorMessage || `Parametro "${key}" e obrigatorio.`);
  }

  return value.trim();
}
