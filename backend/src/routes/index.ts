import { Router } from "express";

export const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "ComprovOS API - rota base"
  });
});