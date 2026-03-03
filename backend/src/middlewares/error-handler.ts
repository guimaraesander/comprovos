import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[ERROR]", error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Erro de validacao",
      issues: error.issues,
    });
  }

  if (error instanceof Error) {
    const status = error.message === "Credenciais invalidas" ? 401 : 400;

    return res.status(status).json({
      message: error.message,
    });
  }

  return res.status(500).json({
    message: "Erro interno do servidor",
  });
}