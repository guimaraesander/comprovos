import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth";
import { ServiceOrdersController } from "./service-orders.controller";

const serviceOrdersRouter = Router();
const serviceOrdersController = new ServiceOrdersController();

serviceOrdersRouter.use(ensureAuth);

serviceOrdersRouter.post("/", (req, res, next) => {
  void serviceOrdersController.create(req, res, next);
});

serviceOrdersRouter.get("/", (req, res, next) => {
  void serviceOrdersController.list(req, res, next);
});

serviceOrdersRouter.get("/:id", (req, res, next) => {
  void serviceOrdersController.getById(req, res, next);
});

serviceOrdersRouter.put("/:id", (req, res, next) => {
  void serviceOrdersController.update(req, res, next);
});

serviceOrdersRouter.patch("/:id/status", (req, res, next) => {
  void serviceOrdersController.updateStatus(req, res, next);
});

export { serviceOrdersRouter };