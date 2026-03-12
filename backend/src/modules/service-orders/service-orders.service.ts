import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import type {
  CreateServiceOrderInput,
  UpdateServiceOrderInput,
  UpdateServiceOrderStatusInput,
} from "./service-orders.schemas";
import { BudgetsService } from "./budgets.service";

export class ServiceOrdersService {
  private budgets = new BudgetsService();

  async create(input: CreateServiceOrderInput, createdByUserId?: string) {
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { id: true },
    });
    if (!client) throw HttpError.notFound("Cliente não encontrado.");

    return prisma.serviceOrder.create({
      data: {
        client: { connect: { id: input.clientId } },

        ...(createdByUserId ? { createdByUser: { connect: { id: createdByUserId } } } : {}),

        status: "ABERTA",

        clientCpfCnpj: input.clientCpfCnpj,

        equipmentType: input.equipmentType,
        equipmentBrand: input.equipmentBrand ?? null,
        equipmentModel: input.equipmentModel ?? null,
        equipmentSerialNumber: input.equipmentSerialNumber ?? null,
        equipmentPassword: input.equipmentPassword ?? null,

        symptoms: input.symptoms,
        accessories: input.accessories ?? null,
        observations: input.observations ?? null,

        budgetValue: input.budgetValue ?? null,
        finalValue: input.finalValue ?? null,
      },
      include: {
        client: true,
        budget: { include: { items: true } },
      },
    });
  }

  async list() {
    return prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        budget: { include: { items: true } },
      },
    });
  }

  async getById(id: string) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        budget: { include: { items: true } },
      },
    });

    if (!order) throw HttpError.notFound("Ordem de serviço não encontrada.");
    return order;
  }

  async update(id: string, input: UpdateServiceOrderInput) {
    await this.getById(id);

    if (input.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: { id: true },
      });
      if (!client) throw HttpError.notFound("Cliente não encontrado.");
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        ...(input.clientId ? { client: { connect: { id: input.clientId } } } : {}),

        ...(typeof input.clientCpfCnpj === "string" ? { clientCpfCnpj: input.clientCpfCnpj } : {}),

        ...(typeof input.equipmentType === "string" ? { equipmentType: input.equipmentType } : {}),
        ...(input.equipmentBrand !== undefined ? { equipmentBrand: input.equipmentBrand ?? null } : {}),
        ...(input.equipmentModel !== undefined ? { equipmentModel: input.equipmentModel ?? null } : {}),
        ...(input.equipmentSerialNumber !== undefined
          ? { equipmentSerialNumber: input.equipmentSerialNumber ?? null }
          : {}),
        ...(input.equipmentPassword !== undefined ? { equipmentPassword: input.equipmentPassword ?? null } : {}),

        ...(typeof input.symptoms === "string" ? { symptoms: input.symptoms } : {}),
        ...(input.accessories !== undefined ? { accessories: input.accessories ?? null } : {}),
        ...(input.observations !== undefined ? { observations: input.observations ?? null } : {}),

        ...(input.budgetValue !== undefined ? { budgetValue: input.budgetValue ?? null } : {}),
        ...(input.finalValue !== undefined ? { finalValue: input.finalValue ?? null } : {}),
      },
      include: {
        client: true,
        budget: { include: { items: true } },
      },
    });
  }

  async updateStatus(id: string, input: UpdateServiceOrderStatusInput) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!order) throw HttpError.notFound("Ordem de serviço não encontrada.");

    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: {
        status: input.status,
      },
      include: {
        client: true,
        budget: { include: { items: true } },
      },
    });

    // ✅ regra: ao entrar em AGUARDANDO_APROVACAO, garante orçamento criado
    if (input.status === "AGUARDANDO_APROVACAO") {
      await this.budgets.ensureExists(id);
      // re-leitura para devolver com budget
      return prisma.serviceOrder.findUnique({
        where: { id },
        include: { client: true, budget: { include: { items: true } } },
      });
    }

    return updated;
  }

  async delete(id: string) {
    await this.getById(id);

    await prisma.serviceOrder.delete({
      where: { id },
    });
  }
}