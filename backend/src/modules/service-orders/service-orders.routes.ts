import { Router } from "express";
import { ensureAuth } from "../../middlewares/auth";
import { ensureRole } from "../../middlewares/role";
import { ServiceOrdersController } from "./service-orders.controller";
import { BudgetsController } from "./budgets.controller";

const controller = new ServiceOrdersController();
const budgetsController = new BudgetsController();

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
 *     summary: Cria uma OS (entrada)
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
 *               clientCpfCnpj: { type: string, example: "12345678910" }
 *               equipmentType: { type: string, example: "DESKTOP" }
 *               equipmentBrand: { type: string, nullable: true, example: "GOLDENTEC" }
 *               equipmentModel: { type: string, nullable: true, example: "SEM" }
 *               equipmentSerialNumber: { type: string, nullable: true, example: "0524" }
 *               equipmentPassword: { type: string, nullable: true, example: "NAO INFORMADO" }
 *               symptoms: { type: string, example: "LIGA E NAO DA VIDEO" }
 *               accessories: { type: string, nullable: true, example: "CARREGADOR" }
 *               observations: { type: string, nullable: true, example: "Cliente deixou sem a tampa" }
 *               budgetValue: { type: number, nullable: true, example: 380 }
 *               finalValue: { type: number, nullable: true, example: 300 }
 *     responses:
 *       201: { description: OS criada com sucesso }
 *       400: { description: Erro de validação }
 *       401: { description: Não autenticado }
 *       403: { description: Sem permissao }
 *       404: { description: Cliente não encontrado }
 *   get:
 *     tags: [Service Orders]
 *     summary: Lista OS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Lista de OS }
 *       401: { description: Não autenticado }
 *       403: { description: Sem permissao }
 */
serviceOrdersRoutes.get("/", ensureRole("ADMIN", "TECNICO"), controller.list.bind(controller));
serviceOrdersRoutes.post("/", ensureRole("ADMIN", "TECNICO"), controller.create.bind(controller));

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
 *       403: { description: Sem permissao }
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
 *       403: { description: Sem permissao }
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
 *       403: { description: Sem permissao }
 *       404: { description: OS não encontrada }
 */
serviceOrdersRoutes.get("/:id", ensureRole("ADMIN", "TECNICO"), controller.getById.bind(controller));
serviceOrdersRoutes.put("/:id", ensureRole("ADMIN", "TECNICO"), controller.update.bind(controller));
serviceOrdersRoutes.delete("/:id", ensureRole("ADMIN"), controller.delete.bind(controller));

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
 *       403: { description: Sem permissao }
 *       404: { description: OS não encontrada }
 */
serviceOrdersRoutes.patch("/:id/status", ensureRole("ADMIN", "TECNICO"), controller.updateStatus.bind(controller));

/**
 * @openapi
 * /service-orders/{id}/budget:
 *   get:
 *     tags: [Service Orders]
 *     summary: Busca orçamento da OS
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Orçamento encontrado }
 *       401: { description: Não autenticado }
 *       403: { description: Sem permissao }
 *       404: { description: Orçamento não encontrado }
 *   put:
 *     tags: [Service Orders]
 *     summary: Cria/atualiza (upsert) o orçamento da OS (1 por OS)
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
 *               travelFee: { type: number, example: 0 }
 *               thirdPartyFee: { type: number, example: 0 }
 *               discount: { type: number, example: 0 }
 *               note: { type: string, nullable: true }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [description, qty, unitValue]
 *                   properties:
 *                     description: { type: string, example: "LIMPEZA/MANUTENCAO GERAL" }
 *                     technician: { type: string, nullable: true, example: "Jorge Alexandre" }
 *                     qty: { type: number, example: 1 }
 *                     unitValue: { type: number, example: 100 }
 *     responses:
 *       200: { description: Orçamento salvo }
 *       400: { description: Erro de validação }
 *       401: { description: Não autenticado }
 *       403: { description: Sem permissao }
 *       404: { description: OS não encontrada }
 */
serviceOrdersRoutes.get("/:id/budget", ensureRole("ADMIN", "TECNICO"), budgetsController.get.bind(budgetsController));
serviceOrdersRoutes.put("/:id/budget", ensureRole("ADMIN", "TECNICO"), budgetsController.upsert.bind(budgetsController));