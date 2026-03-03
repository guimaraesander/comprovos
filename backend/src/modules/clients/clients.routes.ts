import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { ensureAuth } from "../../middlewares/auth";

const clientsRouter = Router();
const clientsController = new ClientsController();

clientsRouter.use(ensureAuth);

clientsRouter.post("/", (req, res, next) => {
  void clientsController.create(req, res, next);
});

clientsRouter.get("/", (req, res, next) => {
  void clientsController.list(req, res, next);
});

clientsRouter.get("/:id", (req, res, next) => {
  void clientsController.getById(req, res, next);
});

clientsRouter.put("/:id", (req, res, next) => {
  void clientsController.update(req, res, next);
});

clientsRouter.delete("/:id", (req, res, next) => {
  void clientsController.delete(req, res, next);
});

export { clientsRouter };