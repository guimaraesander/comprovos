import { NextFunction, Request, Response } from "express";

export type AuthUser = {
  id: string;
  role: "ADMIN" | "TECNICO";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function ensureAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token nao informado",
    });
  }

  // Stub temporario (M2 vai trocar por JWT real)
  req.user = {
    id: "temp-user-id",
    role: "ADMIN",
  };

  return next();
}