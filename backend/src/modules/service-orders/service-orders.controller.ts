import { NextFunction, Request, Response } from "express";
import { ServiceOrdersService } from "./service-orders.service";
import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  updateServiceOrderStatusSchema,
} from "./service-orders.schemas";
import { getRequiredParam } from "../../utils/get-required-param";

const service = new ServiceOrdersService();

export class ServiceOrdersController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await service.list();
      return res.status(200).json(orders);
    } catch (err) {
      return next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getRequiredParam(req.params, "id");
      const order = await service.getById(id);
      return res.status(200).json(order);
    } catch (err) {
      return next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createServiceOrderSchema.parse(req.body);
      const created = await service.create(input);
      return res.status(201).json(created);
    } catch (err) {
      return next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getRequiredParam(req.params, "id");
      const input = updateServiceOrderSchema.parse(req.body);
      const updated = await service.update(id, input);
      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getRequiredParam(req.params, "id");
      const input = updateServiceOrderStatusSchema.parse(req.body);
      const updated = await service.updateStatus(id, input);
      return res.status(200).json(updated);
    } catch (err) {
      return next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getRequiredParam(req.params, "id");
      await service.delete(id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  }
}