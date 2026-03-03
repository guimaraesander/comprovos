import { NextFunction, Request, Response } from "express";

type Role = "ADMIN" | "TECNICO";

export function ensureRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuario nao autenticado",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Acesso negado",
      });
    }

    return next();
  };
}