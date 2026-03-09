import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error";

function isHttpError(err: unknown): err is HttpError {
  return (
    err instanceof HttpError ||
    (typeof err === "object" && err !== null && "statusCode" in err)
  );
}

function isDev() {
  return (process.env.NODE_ENV || "").toLowerCase() === "development";
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // ✅ Loga SEMPRE em dev (pra nunca ficar cego em 500)
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", {
      method: req.method,
      url: req.originalUrl,
      // @ts-expect-error - nem sempre existe
      userId: req.user?.id,
      err,
    });

    // se for Error padrão, imprime stack bonitinho
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    }
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos.",
      issues: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      })),
    });
  }

  // Nosso HttpError
  if (isHttpError(err)) {
    const statusCode = (err as any).statusCode ?? 500;
    const message = (err as any).message ?? "Erro interno do servidor.";
    const details = (err as any).details;

    return res.status(statusCode).json({
      message,
      ...(details ? { details } : {}),
    });
  }

  // Erro genérico
  return res.status(500).json({
    message: "Erro interno do servidor.",
  });
}