import { NextFunction, Request, Response } from "express";
import { ServiceOrdersService } from "./service-orders.service";
import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  updateServiceOrderStatusSchema,
} from "./service-orders.schemas";
import { getRequiredParam } from "../../shared/http/get-required-param";

const serviceOrdersService = new ServiceOrdersService();

type IdParams = {
  id: string;
};

type AuthUser = {
  id: string;
  role: "ADMIN" | "TECNICO";
};

type AuthenticatedRequest = Request & {
  user?: AuthUser;
};

export class ServiceOrdersController {
  async create(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = createServiceOrderSchema.parse(req.body);
      const createdByUserId = req.user?.id;

      const serviceOrder = await serviceOrdersService.create(
        data,
        createdByUserId
      );

      res.status(201).json(serviceOrder);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const serviceOrders = await serviceOrdersService.list();

      res.status(200).json(serviceOrders);
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
        "Id da ordem de servico nao informado"
      );

      const serviceOrder = await serviceOrdersService.getById(id);

      res.status(200).json(serviceOrder);
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
        "Id da ordem de servico nao informado"
      );

      const data = updateServiceOrderSchema.parse(req.body);
      const serviceOrder = await serviceOrdersService.update(id, data);

      res.status(200).json(serviceOrder);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async updateStatus(
    req: Request<IdParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = getRequiredParam(
        req.params,
        "id",
        "Id da ordem de servico nao informado"
      );

      const data = updateServiceOrderStatusSchema.parse(req.body);
      const serviceOrder = await serviceOrdersService.updateStatus(id, data);

      res.status(200).json(serviceOrder);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}