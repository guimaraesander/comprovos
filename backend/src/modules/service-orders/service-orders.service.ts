import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import type {
  CreateServiceOrderInput,
  UpdateServiceOrderInput,
  UpdateServiceOrderStatusInput,
} from "./service-orders.schemas";
import { BudgetsService } from "./budgets.service";

const FLOW = ["ABERTA", "EM_ANALISE", "AGUARDANDO_APROVACAO", "EM_MANUTENCAO", "FINALIZADA", "ENTREGUE"] as const;

function indexInFlow(s: string) {
  return FLOW.indexOf(s as any);
}

function isForwardNext(current: string, next: string) {
  const ci = indexInFlow(current);
  const ni = indexInFlow(next);
  if (ci < 0 || ni < 0) return false;
  return ni === ci + 1;
}

const serviceOrderInclude = {
  client: true,
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  budget: {
    include: {
      items: true,
    },
  },
} as const;

export class ServiceOrdersService {
  private budgets = new BudgetsService();

  async create(input: CreateServiceOrderInput, createdByUserId?: string) {
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { id: true },
    });

    if (!client) {
      throw HttpError.notFound("Cliente não encontrado.");
    }

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

        paymentType: input.paymentType ?? null,
        paymentDate: input.paymentDate ?? null,
        pickupDate: input.pickupDate ?? null,
      },
      include: serviceOrderInclude,
    });
  }

  async list() {
    return prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: serviceOrderInclude,
    });
  }

  async getById(id: string) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: serviceOrderInclude,
    });

    if (!order) {
      throw HttpError.notFound("Ordem de serviço não encontrada.");
    }

    return order;
  }

  async update(id: string, input: UpdateServiceOrderInput) {
    await this.getById(id);

    if (input.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: { id: true },
      });

      if (!client) {
        throw HttpError.notFound("Cliente não encontrado.");
      }
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        ...(input.clientId ? { client: { connect: { id: input.clientId } } } : {}),
        ...(typeof input.clientCpfCnpj === "string" ? { clientCpfCnpj: input.clientCpfCnpj } : {}),

        ...(typeof input.equipmentType === "string" ? { equipmentType: input.equipmentType } : {}),
        ...(input.equipmentBrand !== undefined ? { equipmentBrand: input.equipmentBrand ?? null } : {}),
        ...(input.equipmentModel !== undefined ? { equipmentModel: input.equipmentModel ?? null } : {}),
        ...(input.equipmentSerialNumber !== undefined ? { equipmentSerialNumber: input.equipmentSerialNumber ?? null } : {}),
        ...(input.equipmentPassword !== undefined ? { equipmentPassword: input.equipmentPassword ?? null } : {}),

        ...(typeof input.symptoms === "string" ? { symptoms: input.symptoms } : {}),
        ...(input.accessories !== undefined ? { accessories: input.accessories ?? null } : {}),
        ...(input.observations !== undefined ? { observations: input.observations ?? null } : {}),

        ...(input.budgetValue !== undefined ? { budgetValue: input.budgetValue ?? null } : {}),
        ...(input.finalValue !== undefined ? { finalValue: input.finalValue ?? null } : {}),

        ...(input.paymentType !== undefined ? { paymentType: input.paymentType ?? null } : {}),
        ...(input.paymentDate !== undefined ? { paymentDate: input.paymentDate ?? null } : {}),
        ...(input.pickupDate !== undefined ? { pickupDate: input.pickupDate ?? null } : {}),
      },
      include: serviceOrderInclude,
    });
  }

  async updateStatus(id: string, input: UpdateServiceOrderStatusInput) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!order) {
      throw HttpError.notFound("Ordem de serviço não encontrada.");
    }

    const current = order.status as string;
    const next = input.status as string;

    if (current === "CANCELADA") {
      throw HttpError.badRequest("OS cancelada não pode ter status alterado.");
    }

    if (current === "ENTREGUE") {
      throw HttpError.badRequest("OS entregue não pode ter status alterado.");
    }

    if (next === "CANCELADA") {
      const cancelAllowed =
        current === "ABERTA" ||
        current === "EM_ANALISE" ||
        current === "AGUARDANDO_APROVACAO";

      if (!cancelAllowed) {
        throw HttpError.badRequest("Este status não pode ser cancelado.");
      }
    } else {
      if (!isForwardNext(current, next)) {
        throw HttpError.badRequest("Transição de status inválida. Não é permitido voltar ou pular etapas.");
      }
    }

    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: { status: input.status },
      include: serviceOrderInclude,
    });

    if (input.status === "AGUARDANDO_APROVACAO") {
      await this.budgets.ensureExists(id);

      return prisma.serviceOrder.findUnique({
        where: { id },
        include: serviceOrderInclude,
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