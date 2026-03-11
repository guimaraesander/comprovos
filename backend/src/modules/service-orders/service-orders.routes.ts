import { Router } from "express";
import { ServiceOrdersController } from "./service-orders.controller";
import { ensureAuth } from "../../middlewares/auth";

const controller = new ServiceOrdersController();
export const serviceOrdersRoutes = Router();

/**
 * @openapi
 * tags:
 *   - name: Service Orders
 *     description: Ordens de serviço (OS)
 */

serviceOrdersRoutes.use(ensureAuth);

/**
 * @openapi
 * /service-orders:
 *   post:
 *     tags: [Service Orders]
 *     summary: Cria uma OS (entrada) com dados do equipamento preenchidos na própria OS
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, clientCpfCnpj, equipmentType, symptoms]
 *             properties:
 *               clientId: { type: string }
 *               clientCpfCnpj: { type: string, example: "055.092.733-64" }
 *               equipmentType: { type: string, example: "DESKTOP" }
 *               equipmentBrand: { type: string, nullable: true, example: "GOLDENTEC" }
 *               equipmentModel: { type: string, nullable: true, example: "SEM" }
 *               equipmentSerialNumber: { type: string, nullable: true, example: "0524" }
 *               equipmentPassword: { type: string, nullable: true, example: "NÃO INFORMADO" }
 *               symptoms: { type: string, example: "LIGA E NÃO DÁ VÍDEO" }
 *               accessories: { type: string, nullable: true }
 *               observations: { type: string, nullable: true }
 *               budgetValue: { type: number, nullable: true }
 *               finalValue: { type: number, nullable: true }
 *     responses:
 *       201: { description: OS criada com sucesso }
 *       400: { description: Erro de validação }
 *       401: { description: Não autenticado }
 *       404: { description: Cliente não encontrado }
 *   get:
 *     tags: [Service Orders]
 *     summary: Lista OS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de OS }
 *       401: { description: Não autenticado }
 */
serviceOrdersRoutes.get("/", controller.list.bind(controller));
serviceOrdersRoutes.post("/", controller.create.bind(controller));

/**
 * @openapi
 * /service-orders/{id}:
 *   get:
 *     tags: [Service Orders]
 *     summary: Busca OS por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OS encontrada }
 *       401: { description: Não autenticado }
 *       404: { description: OS não encontrada }
 *   put:
 *     tags: [Service Orders]
 *     summary: Atualiza dados da OS (sem alterar status)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId: { type: string }
 *               clientCpfCnpj: { type: string }
 *               equipmentType: { type: string }
 *               equipmentBrand: { type: string, nullable: true }
 *               equipmentModel: { type: string, nullable: true }
 *               equipmentSerialNumber: { type: string, nullable: true }
 *               equipmentPassword: { type: string, nullable: true }
 *               symptoms: { type: string }
 *               accessories: { type: string, nullable: true }
 *               observations: { type: string, nullable: true }
 *               budgetValue: { type: number, nullable: true }
 *               finalValue: { type: number, nullable: true }
 *     responses:
 *       200: { description: OS atualizada }
 *       400: { description: Erro de validação }
 *       401: { description: Não autenticado }
 *       404: { description: OS não encontrada }
 *   delete:
 *     tags: [Service Orders]
 *     summary: Remove OS por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: OS removida com sucesso }
 *       401: { description: Não autenticado }
 *       404: { description: OS não encontrada }
 */
serviceOrdersRoutes.get("/:id", controller.getById.bind(controller));
serviceOrdersRoutes.put("/:id", controller.update.bind(controller));
serviceOrdersRoutes.delete("/:id", controller.delete.bind(controller));

/**
 * @openapi
 * /service-orders/{id}/status:
 *   patch:
 *     tags: [Service Orders]
 *     summary: Atualiza o status da OS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *                 enum: [ABERTA, EM_ANALISE, AGUARDANDO_APROVACAO, EM_MANUTENCAO, FINALIZADA, ENTREGUE, CANCELADA]
 *     responses:
 *       200: { description: Status atualizado }
 *       400: { description: Erro de validação }
 *       401: { description: Não autenticado }
 *       404: { description: OS não encontrada }
 */
serviceOrdersRoutes.patch("/:id/status", controller.updateStatus.bind(controller));