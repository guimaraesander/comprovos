import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

type HttpError = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown;
  issues?: unknown;
};

function getSafeStatusCode(error: HttpError) {
  if (error instanceof ZodError) {
    return 400;
  }

  if (
    typeof error.statusCode === "number" &&
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
  ) {
    return error.statusCode;
  }

  return 500;
}

function getErrorResponseMessage(statusCode: number, error: HttpError, isDev: boolean) {
  if (error instanceof ZodError) {
    return "Erro de validação dos dados enviados.";
  }

  if (statusCode >= 500 && !isDev) {
    return "Erro interno do servidor.";
  }

  return error.message || "Erro interno do servidor.";
}

function getValidationDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
  }));
}

export function errorHandler(
  error: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = getSafeStatusCode(error);
  const isDev = process.env.NODE_ENV !== "production";
  const requestId =
    typeof res.locals.requestId === "string" ? res.locals.requestId : null;

  const logEntry = {
    level: "error",
    type: "http_error",
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
    code: error.code ?? null,
    details: error.details ?? null,
    stack: isDev ? (error.stack ?? null) : null,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(logEntry));

  const responseBody: Record<string, unknown> = {
    message: getErrorResponseMessage(statusCode, error, isDev),
  };

  if (requestId) {
    responseBody.requestId = requestId;
  }

  if (error.code) {
    responseBody.code = error.code;
  }

  if (statusCode < 500 && typeof error.details !== "undefined") {
    responseBody.details = error.details;
  }

  if (error instanceof ZodError) {
    responseBody.details = getValidationDetails(error);
  }

  if (isDev && error.stack) {
    responseBody.stack = error.stack;
  }

  return res.status(statusCode).json(responseBody);
}
