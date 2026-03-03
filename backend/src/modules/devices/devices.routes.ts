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
 *     summary: Cria um equipamento vinculado a um cliente
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
 *                 example: cmma137nz0000tj74c4m42w5f
 *               type:
 *                 type: string
 *                 example: PLACA_MAE
 *               brand:
 *                 type: string
 *                 example: ASUS
 *               model:
 *                 type: string
 *                 example: H310CM-HG4
 *               serialNumber:
 *                 type: string
 *                 example: 0AM0XH012973
 *               password:
 *                 type: string
 *                 example: SEM
 *               accessories:
 *                 type: string
 *                 example: COOLER BOX + MEMORIA RAM + SACO
 *               notes:
 *                 type: string
 *                 example: Sem bateria CMOS
 *     responses:
 *       201:
 *         description: Equipamento criado com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Cliente nao encontrado
 *   get:
 *     tags: [Devices]
 *     summary: Lista equipamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de equipamentos
 *       401:
 *         description: Nao autenticado
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
 *         description: Nao autenticado
 *       404:
 *         description: Equipamento nao encontrado
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
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               accessories:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipamento atualizado com sucesso
 *       400:
 *         description: Erro de validacao
 *       401:
 *         description: Nao autenticado
 *       404:
 *         description: Equipamento nao encontrado
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
 *         description: Nao autenticado
 *       404:
 *         description: Equipamento nao encontrado
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