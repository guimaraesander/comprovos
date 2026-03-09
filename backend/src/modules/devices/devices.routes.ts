import { Router } from "express";
import { DevicesController } from "./devices.controller";
import { ensureAuth } from "../../middlewares/auth";

const devicesRouter = Router();
const devicesController = new DevicesController();

/**
 * @openapi
 * tags:
 *   - name: Devices
 *     description: Cadastro e gerenciamento de equipamentos
 */

devicesRouter.use(ensureAuth);

/**
 * @openapi
 * /devices:
 *   post:
 *     tags: [Devices]
 *     summary: Cria um equipamento
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, type]
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: "cmmxxxxxxxxxxxxxxxxxxxx"
 *               type:
 *                 type: string
 *                 example: "Notebook"
 *               brand:
 *                 type: string
 *                 nullable: true
 *                 example: "ASUS"
 *               model:
 *                 type: string
 *                 nullable: true
 *                 example: "H310CM-HG4"
 *               serialNumber:
 *                 type: string
 *                 nullable: true
 *                 example: "SN123456"
 *               password:
 *                 type: string
 *                 nullable: true
 *                 example: "senha123"
 *               accessories:
 *                 type: string
 *                 nullable: true
 *                 example: "Carregador"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: "Sem observações"
 *     responses:
 *       201:
 *         description: Equipamento criado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Cliente não encontrado
 *   get:
 *     tags: [Devices]
 *     summary: Lista equipamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipamentos
 *       401:
 *         description: Não autenticado
 */
devicesRouter.post("/", (req, res, next) => {
  void devicesController.create(req, res, next);
});

devicesRouter.get("/", (req, res, next) => {
  void devicesController.list(req, res, next);
});

/**
 * @openapi
 * /devices/{id}:
 *   get:
 *     tags: [Devices]
 *     summary: Busca equipamento por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do equipamento
 *     responses:
 *       200:
 *         description: Equipamento encontrado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Equipamento não encontrado
 *   put:
 *     tags: [Devices]
 *     summary: Atualiza equipamento por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do equipamento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *               type:
 *                 type: string
 *               brand:
 *                 type: string
 *                 nullable: true
 *               model:
 *                 type: string
 *                 nullable: true
 *               serialNumber:
 *                 type: string
 *                 nullable: true
 *               password:
 *                 type: string
 *                 nullable: true
 *               accessories:
 *                 type: string
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Equipamento atualizado com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Equipamento não encontrado
 *   delete:
 *     tags: [Devices]
 *     summary: Remove equipamento por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do equipamento
 *     responses:
 *       204:
 *         description: Equipamento removido com sucesso
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Equipamento não encontrado
 */
devicesRouter.get("/:id", (req, res, next) => {
  void devicesController.getById(req, res, next);
});

devicesRouter.put("/:id", (req, res, next) => {
  void devicesController.update(req, res, next);
});

devicesRouter.delete("/:id", (req, res, next) => {
  void devicesController.delete(req, res, next);
});

export { devicesRouter };