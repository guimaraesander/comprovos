import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error";

function isDev() {
  return (process.env.NODE_ENV || "").toLowerCase() === "development";
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Log (em dev sempre; em prod apenas o necessário)
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.error({
      method: req.method,
      url: req.originalUrl,
      err,
    });
  }

  // Zod -> 400
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dados inválidos.",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  // HttpError -> status correto
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(isDev() && err.details ? { details: err.details } : {}),
    });
  }

  // Fallback -> 500
  return res.status(500).json({
    message: "Erro interno do servidor.",
  });
}