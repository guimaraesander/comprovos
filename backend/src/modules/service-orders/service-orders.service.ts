import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import type {
  CreateServiceOrderInput,
  UpdateServiceOrderInput,
  UpdateServiceOrderStatusInput,
} from "./service-orders.schemas";

export class ServiceOrdersService {
  async create(input: CreateServiceOrderInput) {
    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { id: true },
    });
    if (!client) throw HttpError.notFound("Cliente não encontrado.");

    const device = await prisma.device.findUnique({
      where: { id: input.deviceId },
      select: { id: true, clientId: true },
    });
    if (!device) throw HttpError.notFound("Equipamento não encontrado.");

    // regra segura: equipamento deve pertencer ao cliente
    if (device.clientId !== input.clientId) {
      throw HttpError.badRequest("O equipamento informado não pertence ao cliente.");
    }

    return prisma.serviceOrder.create({
      data: {
        client: { connect: { id: input.clientId } },
        device: { connect: { id: input.deviceId } },

        status: "ABERTA",
        symptoms: input.symptoms,

        accessories: input.accessories ?? null,
        observations: input.observations ?? null,

        budgetValue: input.budgetValue ?? null,
        finalValue: input.finalValue ?? null,
      },
      include: {
        client: true,
        device: true,
      },
    });
  }

  async list() {
    return prisma.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        device: true,
      },
    });
  }

  async getById(id: string) {
    const order = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        device: true,
      },
    });

    if (!order) throw HttpError.notFound("Ordem de serviço não encontrada.");
    return order;
  }

  async update(id: string, input: UpdateServiceOrderInput) {
    const current = await this.getById(id);

    const nextClientId = input.clientId ?? current.clientId;
    const nextDeviceId = input.deviceId ?? current.deviceId;

    // valida cliente
    if (input.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: { id: true },
      });
      if (!client) throw HttpError.notFound("Cliente não encontrado.");
    }

    // valida device
    if (input.deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: input.deviceId },
        select: { id: true, clientId: true },
      });
      if (!device) throw HttpError.notFound("Equipamento não encontrado.");
    }

    // regra: device pertence ao client (no estado final)
    const deviceCheck = await prisma.device.findUnique({
      where: { id: nextDeviceId },
      select: { clientId: true },
    });
    if (!deviceCheck) throw HttpError.notFound("Equipamento não encontrado.");
    if (deviceCheck.clientId !== nextClientId) {
      throw HttpError.badRequest("O equipamento informado não pertence ao cliente.");
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        // troca vínculos via connect 
        ...(input.clientId ? { client: { connect: { id: input.clientId } } } : {}),
        ...(input.deviceId ? { device: { connect: { id: input.deviceId } } } : {}),

        ...(typeof input.symptoms === "string" ? { symptoms: input.symptoms } : {}),
        ...(input.accessories !== undefined ? { accessories: input.accessories ?? null } : {}),
        ...(input.observations !== undefined ? { observations: input.observations ?? null } : {}),
        ...(input.budgetValue !== undefined ? { budgetValue: input.budgetValue ?? null } : {}),
        ...(input.finalValue !== undefined ? { finalValue: input.finalValue ?? null } : {}),
      },
      include: {
        client: true,
        device: true,
      },
    });
  }

  async updateStatus(id: string, input: UpdateServiceOrderStatusInput) {
    await this.getById(id);

    const deliveredAt = input.status === "ENTREGUE" ? new Date() : undefined;

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        status: input.status,
        ...(deliveredAt ? { deliveredAt } : {}),
      },
      include: {
        client: true,
        device: true,
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);

    await prisma.serviceOrder.delete({
      where: { id },
    });
  }
}