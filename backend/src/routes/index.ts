import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { clientsRouter } from "../modules/clients/clients.routes";
import { devicesRouter } from "../modules/devices/devices.routes";
import { serviceOrdersRouter } from "../modules/service-orders/service-orders.routes";

export const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "ComprovOS API - rota base",
  });
});

router.use("/auth", authRouter);
router.use("/clients", clientsRouter);
router.use("/devices", devicesRouter);
router.use("/service-orders", serviceOrdersRouter);