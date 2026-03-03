import { NextFunction, Request, Response } from "express";
import { ClientsService } from "./clients.service";
import {
  createClientSchema,
  updateClientSchema,
} from "./clients.schemas";
import { getRequiredParam } from "../../shared/http/get-required-param";

const clientsService = new ClientsService();

type IdParams = {
  id: string;
};

export class ClientsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createClientSchema.parse(req.body);
      const client = await clientsService.create(data);

      res.status(201).json(client);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clients = await clientsService.list();

      res.status(200).json(clients);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getById(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRequiredParam(
        req.params,
        "id",
        "Id do cliente nao informado"
      );

      const client = await clientsService.getById(id);

      res.status(200).json(client);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async update(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRequiredParam(
        req.params,
        "id",
        "Id do cliente nao informado"
      );

      const data = updateClientSchema.parse(req.body);
      const client = await clientsService.update(id, data);

      res.status(200).json(client);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async delete(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRequiredParam(
        req.params,
        "id",
        "Id do cliente nao informado"
      );

      await clientsService.delete(id);

      res.status(204).send();
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}