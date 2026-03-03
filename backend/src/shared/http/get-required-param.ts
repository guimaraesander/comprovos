type ParamsValue = string | string[] | undefined;

type ParamsLike = Record<string, ParamsValue>;

export function getRequiredParam(
  params: ParamsLike,
  key: string,
  errorMessage?: string
): string {
  const value = params[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(errorMessage || `Parametro '${key}' nao informado`);
  }

  return value;
}