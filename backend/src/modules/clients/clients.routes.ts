import { Router } from "express";
import { ClientsController } from "./clients.controller";
import { ensureAuth } from "../../middlewares/auth";

const clientsRouter = Router();
const clientsController = new ClientsController();

/**
 * @openapi
 * tags:
 *   - name: Clients
 *     description: Cadastro e gerenciamento de clientes
 */

clientsRouter.use(ensureAuth);

/**
 * @openapi
 * /clients:
 *   post:
 *     tags: [Clients]
 *     summary: Cria um cliente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Joao Alves
 *               phone:
 *                 type: string
 *                 example: "88998034589"
 *               email:
 *                 type: string
 *                 example: joaoalves@email.com
 *               cpfCnpj:
 *                 type: string
 *                 example: "12345678910"
 *               rgIe:
 *                 type: string
 *                 nullable: true
 *               address:
 *                 type: string
 *                 example: Avenida Santos Dumont, 455
 *               district:
 *                 type: string
 *                 example: Centro
 *               city:
 *                 type: string
 *                 example: Fortaleza
 *               state:
 *                 type: string
 *                 example: CE
 *               zipCode:
 *                 type: string
 *                 example: "63500000"
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *   get:
 *     tags: [Clients]
 *     summary: Lista clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       401:
 *         description: Nao autenticado
 */
clientsRouter.post("/", (req, res, next) => {
  void clientsController.create(req, res, next);
});

clientsRouter.get("/", (req, res, next) => {
  void clientsController.list(req, res, next);
});

/**
 * @openapi
 * /clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Busca cliente por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Cliente nao encontrado
 *   put:
 *     tags: [Clients]
 *     summary: Atualiza cliente por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               cpfCnpj:
 *                 type: string
 *               rgIe:
 *                 type: string
 *               address:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Cliente nao encontrado
 *   delete:
 *     tags: [Clients]
 *     summary: Remove cliente por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       204:
 *         description: Cliente removido com sucesso
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Cliente nao encontrado
 */
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