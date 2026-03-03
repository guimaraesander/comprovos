import { prisma } from "../../lib/prisma";
import {
  CreateServiceOrderInput,
  UpdateServiceOrderInput,
  UpdateServiceOrderStatusInput,
} from "./service-orders.schemas";

export class ServiceOrdersService {
  async create(data: CreateServiceOrderInput, createdByUserId?: string) {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error("Cliente nao encontrado para abrir a OS");
    }

    const device = await prisma.device.findUnique({
      where: { id: data.deviceId },
    });

    if (!device) {
      throw new Error("Equipamento nao encontrado para abrir a OS");
    }

    if (device.clientId !== data.clientId) {
      throw new Error("Equipamento nao pertence ao cliente informado");
    }

    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        clientId: data.clientId,
        deviceId: data.deviceId,
        createdByUserId,

        symptoms: data.symptoms,
        accessories: data.accessories,
        observations: data.observations,

        status: data.status ?? "ABERTA",

        budgetValue:
          data.budgetValue !== undefined ? String(data.budgetValue) : undefined,
        finalValue:
          data.finalValue !== undefined ? String(data.finalValue) : undefined,

        webKey: data.webKey,
        trackingPassword: data.trackingPassword,
      },
      include: {
        client: true,
        device: true,
        createdByUser: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Histórico inicial (status de abertura)
    await prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId: serviceOrder.id,
        previousStatus: null,
        newStatus: serviceOrder.status,
        note: "OS criada",
      },
    });

    return prisma.serviceOrder.findUnique({
      where: { id: serviceOrder.id },
      include: {
        client: true,
        device: true,
        createdByUser: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async list() {
    return prisma.serviceOrder.findMany({
      include: {
        client: true,
        device: true,
        createdByUser: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getById(id: string) {
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        device: true,
        createdByUser: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!serviceOrder) {
      throw new Error("Ordem de servico nao encontrada");
    }

    return serviceOrder;
  }

  async update(id: string, data: UpdateServiceOrderInput) {
    const existing = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Ordem de servico nao encontrada");
    }

    if (data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        throw new Error("Cliente nao encontrado");
      }
    }

    if (data.deviceId) {
      const device = await prisma.device.findUnique({
        where: { id: data.deviceId },
      });

      if (!device) {
        throw new Error("Equipamento nao encontrado");
      }

      const targetClientId = data.clientId ?? existing.clientId;
      if (device.clientId !== targetClientId) {
        throw new Error("Equipamento nao pertence ao cliente informado");
      }
    }

    return prisma.serviceOrder.update({
      where: { id },
      data: {
        ...data,
        budgetValue:
          data.budgetValue !== undefined ? String(data.budgetValue) : undefined,
        finalValue:
          data.finalValue !== undefined ? String(data.finalValue) : undefined,
      },
      include: {
        client: true,
        device: true,
        createdByUser: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  async updateStatus(id: string, data: UpdateServiceOrderStatusInput) {
    const existing = await prisma.serviceOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Ordem de servico nao encontrada");
    }

    const previousStatus = existing.status;

    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        client: true,
        device: true,
        createdByUser: true,
      },
    });

    await prisma.serviceOrderHistory.create({
      data: {
        serviceOrderId: id,
        previousStatus,
        newStatus: data.status,
        note: data.note,
      },
    });

    return prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        client: true,
        device: true,
        createdByUser: true,
        history: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }
}