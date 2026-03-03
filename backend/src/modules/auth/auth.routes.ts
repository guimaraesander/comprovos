import { Router } from "express";
import { AuthController } from "./auth.controller";
import { ensureAuth } from "../../middlewares/auth";

const authRouter = Router();
const authController = new AuthController();

authRouter.post("/login", (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.get("/me", ensureAuth, (req, res, next) =>
  authController.me(req, res, next)
);

export { authRouter };