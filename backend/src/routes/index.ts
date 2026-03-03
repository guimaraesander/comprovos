import { Router } from "express";

export const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "ComprovOS API - rota base",
  });
});

// Placeholder de modulos (cada membro vai conectar sua rota aqui)
// router.use("/auth", authRouter);
// router.use("/clients", clientsRouter);
// router.use("/devices", devicesRouter);
// router.use("/service-orders", serviceOrdersRouter);