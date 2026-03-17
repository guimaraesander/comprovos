import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth";
import { ensureRole } from "../../middlewares/role";
import { UsersController } from "./users.controller";

const usersRouter = Router();
const usersController = new UsersController();

/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Gerenciamento de usuários do sistema
 */

usersRouter.use(ensureAuth);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Lista usuários
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *   post:
 *     tags: [Users]
 *     summary: Cria um novo usuário
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: João Técnico
 *               email:
 *                 type: string
 *                 example: joao@comprovos.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 enum: [ADMIN, TECNICO]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       409:
 *         description: Email já cadastrado
 */
usersRouter.get("/", ensureRole("ADMIN"), (req, res, next) => {
  void usersController.list(req, res, next);
});

usersRouter.post("/", ensureRole("ADMIN"), (req, res, next) => {
  void usersController.create(req, res, next);
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Exclui um usuário
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       204:
 *         description: Usuário excluído com sucesso
 *       400:
 *         description: Operação inválida
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Usuário não encontrado
 */
usersRouter.delete("/:id", ensureRole("ADMIN"), (req, res, next) => {
  void usersController.delete(req, res, next);
});

export { usersRouter };