import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth";
import { ServiceOrdersController } from "./service-orders.controller";

const serviceOrdersRouter = Router();
const serviceOrdersController = new ServiceOrdersController();

/**
 * @openapi
 * tags:
 *   - name: Service Orders
 *     description: Ordens de servico (OS)
 */

serviceOrdersRouter.use(ensureAuth);

/**
 * @openapi
 * /service-orders:
 *   post:
 *     tags: [Service Orders]
 *     summary: Cria uma ordem de servico
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, deviceId, symptoms]
 *             properties:
 *               clientId:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               symptoms:
 *                 type: string
 *                 example: Nao liga e apresenta cheiro de queimado
 *               accessories:
 *                 type: string
 *                 example: Cooler box + memoria RAM + saco
 *               observations:
 *                 type: string
 *                 example: Cliente trouxe para teste de funcionamento
 *               status:
 *                 type: string
 *                 enum:
 *                   - ABERTA
 *                   - EM_ANALISE
 *                   - AGUARDANDO_APROVACAO
 *                   - EM_MANUTENCAO
 *                   - FINALIZADA
 *                   - ENTREGUE
 *                   - CANCELADA
 *               budgetValue:
 *                 type: number
 *                 example: 150
 *               finalValue:
 *                 type: number
 *                 example: 0
 *               webKey:
 *                 type: string
 *               trackingPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordem de servico criada com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Cliente/equipamento nao encontrado
 *   get:
 *     tags: [Service Orders]
 *     summary: Lista ordens de servico
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ordens de servico
 *       401:
 *         description: Nao autenticado
 */
serviceOrdersRouter.post("/", (req, res, next) => {
  void serviceOrdersController.create(req, res, next);
});

serviceOrdersRouter.get("/", (req, res, next) => {
  void serviceOrdersController.list(req, res, next);
});

/**
 * @openapi
 * /service-orders/{id}:
 *   get:
 *     tags: [Service Orders]
 *     summary: Busca ordem de servico por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da ordem de servico
 *     responses:
 *       200:
 *         description: Ordem de servico encontrada
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Ordem de servico nao encontrada
 *   put:
 *     tags: [Service Orders]
 *     summary: Atualiza dados da ordem de servico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da ordem de servico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               symptoms:
 *                 type: string
 *               accessories:
 *                 type: string
 *               observations:
 *                 type: string
 *               budgetValue:
 *                 type: number
 *               finalValue:
 *                 type: number
 *               webKey:
 *                 type: string
 *               trackingPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ordem de servico atualizada com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Ordem de servico nao encontrada
 */
serviceOrdersRouter.get("/:id", (req, res, next) => {
  void serviceOrdersController.getById(req, res, next);
});

serviceOrdersRouter.put("/:id", (req, res, next) => {
  void serviceOrdersController.update(req, res, next);
});

/**
 * @openapi
 * /service-orders/{id}/status:
 *   patch:
 *     tags: [Service Orders]
 *     summary: Atualiza o status da OS e grava historico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da ordem de servico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - ABERTA
 *                   - EM_ANALISE
 *                   - AGUARDANDO_APROVACAO
 *                   - EM_MANUTENCAO
 *                   - FINALIZADA
 *                   - ENTREGUE
 *                   - CANCELADA
 *               note:
 *                 type: string
 *                 example: Equipamento em bancada para reparo
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Ordem de servico nao encontrada
 */
serviceOrdersRouter.patch("/:id/status", (req, res, next) => {
  void serviceOrdersController.updateStatus(req, res, next);
});

export { serviceOrdersRouter };