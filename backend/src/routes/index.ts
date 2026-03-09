import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { clientsRouter } from "../modules/clients/clients.routes";
import { devicesRouter } from "../modules/devices/devices.routes";
import { serviceOrdersRoutes } from "../modules/service-orders/service-orders.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/clients", clientsRouter);
router.use("/devices", devicesRouter);
router.use("/service-orders", serviceOrdersRoutes);