import { prisma } from "../../lib/prisma";
import { CreateDeviceInput, UpdateDeviceInput } from "./devices.schemas";

export class DevicesService {
  async create(data: CreateDeviceInput) {
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new Error("Cliente nao encontrado para vincular equipamento");
    }

    return prisma.device.create({
      data,
    });
  }

  async list() {
    return prisma.device.findMany({
      include: {
        client: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!device) {
      throw new Error("Equipamento nao encontrado");
    }

    return device;
  }

  async update(id: string, data: UpdateDeviceInput) {
    const existing = await prisma.device.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Equipamento nao encontrado");
    }

    if (data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!client) {
        throw new Error("Cliente nao encontrado para vincular equipamento");
      }
    }

    return prisma.device.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const existing = await prisma.device.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Equipamento nao encontrado");
    }

    await prisma.device.delete({
      where: { id },
    });
  }
}