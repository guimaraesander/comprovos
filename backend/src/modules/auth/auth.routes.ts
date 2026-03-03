import { Router } from "express";
import { AuthController } from "./auth.controller";
import { ensureAuth } from "../../middlewares/auth";

const authRouter = Router();
const authController = new AuthController();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Autenticacao e sessao
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Realiza login e retorna token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Credenciais invalidas
 */
authRouter.post("/login", (req, res, next) => {
  void authController.login(req, res, next);
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Retorna dados do usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario autenticado retornado com sucesso
 *       401:
 *         description: Token nao informado ou invalido
 */
authRouter.get("/me", ensureAuth, (req, res, next) => {
  void authController.me(req, res, next);
});

export { authRouter };