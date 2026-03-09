import { NextFunction, Request, Response } from "express";
import { DevicesService } from "./devices.service";
import { createDeviceSchema, updateDeviceSchema } from "./devices.schemas";
import { getRequiredParam } from "../../shared/http/get-required-param";

const devicesService = new DevicesService();

type IdParams = {
  id: string;
};

export class DevicesController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createDeviceSchema.parse(req.body);
      const device = await devicesService.create(data);
      res.status(201).json(device);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const devices = await devicesService.list();
      res.status(200).json(devices);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async getById(req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getRequiredParam(req.params, "id", "Id do equipamento não informado");
      const device = await devicesService.getById(id);
      res.status(200).json(device);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async update(req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getRequiredParam(req.params, "id", "Id do equipamento não informado");
      const data = updateDeviceSchema.parse(req.body);
      const device = await devicesService.update(id, data);
      res.status(200).json(device);
      return;
    } catch (error) {
      next(error);
      return;
    }
  }

  async delete(req: Request<IdParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getRequiredParam(req.params, "id", "Id do equipamento não informado");
      await devicesService.delete(id);
      res.status(204).send();
      return;
    } catch (error) {
      next(error);
      return;
    }
  }
}