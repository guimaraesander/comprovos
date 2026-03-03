import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { clientsRouter } from "../modules/clients/clients.routes";
import { devicesRouter } from "../modules/devices/devices.routes";

export const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "ComprovOS API - rota base",
  });
});

router.use("/auth", authRouter);
router.use("/clients", clientsRouter);
router.use("/devices", devicesRouter);

// Placeholder de modulos (cada membro vai conectar sua rota aqui)
// router.use("/service-orders", serviceOrdersRouter);