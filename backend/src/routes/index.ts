import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { clientsRouter } from "../modules/clients/clients.routes";
import { serviceOrdersRoutes } from "../modules/service-orders/service-orders.routes";
import { usersRouter } from "../modules/users/users.routes";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/clients", clientsRouter);
routes.use("/service-orders", serviceOrdersRoutes);
routes.use("/users", usersRouter);