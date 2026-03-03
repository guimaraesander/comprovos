import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { loginSchema } from "./auth.schemas";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);

      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuario nao autenticado",
        });
      }

      const user = await authService.me(req.user.id);

      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }
}