import { Router } from "express";
import { DevicesController } from "./devices.controller";
import { ensureAuth } from "../../middlewares/auth";

const devicesRouter = Router();
const devicesController = new DevicesController();

devicesRouter.use(ensureAuth);

devicesRouter.post("/", (req, res, next) => {
  void devicesController.create(req, res, next);
});

devicesRouter.get("/", (req, res, next) => {
  void devicesController.list(req, res, next);
});

devicesRouter.get("/:id", (req, res, next) => {
  void devicesController.getById(req, res, next);
});

devicesRouter.put("/:id", (req, res, next) => {
  void devicesController.update(req, res, next);
});

devicesRouter.delete("/:id", (req, res, next) => {
  void devicesController.delete(req, res, next);
});

export { devicesRouter };