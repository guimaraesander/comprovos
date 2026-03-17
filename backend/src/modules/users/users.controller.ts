import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../../utils/http-error";
import { UsersService } from "./users.service";
import { createUserSchema, userIdParamsSchema } from "./users.schemas";

const usersService = new UsersService();

export class UsersController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await usersService.list();
      return res.status(200).json(users);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw HttpError.unauthorized("Usuário não autenticado.");
      }

      const data = createUserSchema.parse(req.body);

      const created = await usersService.create(data, {
        id: req.user.id,
        role: req.user.role,
      });

      return res.status(201).json(created);
    } catch (error) {
      return next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw HttpError.unauthorized("Usuário não autenticado.");
      }

      const { id } = userIdParamsSchema.parse(req.params);

      await usersService.delete(id, {
        id: req.user.id,
        role: req.user.role,
      });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}