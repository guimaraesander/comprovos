import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import { CreateDeviceInput, UpdateDeviceInput } from "./devices.schemas";

function toNullIfEmpty(value: unknown) {
  if (value === undefined) return undefined; // não mexe (update parcial)
  if (typeof value !== "string") return value;
  const t = value.trim();
  return t.length ? t : null;
}

export class DevicesService {
  async create(input: CreateDeviceInput) {
    const clientId = input.clientId.trim();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      throw HttpError.notFound("Cliente não encontrado para vincular equipamento.");
    }

    return prisma.device.create({
      data: {
        clientId,
        type: input.type.trim(),
        brand: toNullIfEmpty(input.brand) as any,
        model: toNullIfEmpty(input.model) as any,
        serialNumber: toNullIfEmpty(input.serialNumber) as any,
        password: toNullIfEmpty(input.password) as any,
        accessories: toNullIfEmpty(input.accessories) as any,
        notes: toNullIfEmpty(input.notes) as any,
      },
      include: { client: true },
    });
  }

  async list() {
    return prisma.device.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const device = await prisma.device.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!device) {
      throw HttpError.notFound("Equipamento não encontrado.");
    }

    return device;
  }

  async update(id: string, input: UpdateDeviceInput) {
    await this.getById(id);

    let nextClientId: string | undefined;

    if (typeof input.clientId === "string") {
      nextClientId = input.clientId.trim();

      if (!nextClientId) {
        throw HttpError.badRequest("clientId inválido.");
      }

      const client = await prisma.client.findUnique({
        where: { id: nextClientId },
        select: { id: true },
      });

      if (!client) {
        throw HttpError.notFound("Cliente não encontrado para vincular equipamento.");
      }
    }

    return prisma.device.update({
      where: { id },
      data: {
        ...(nextClientId ? { clientId: nextClientId } : {}),
        ...(typeof input.type === "string" ? { type: input.type.trim() } : {}),
        ...(input.brand !== undefined ? { brand: toNullIfEmpty(input.brand) as any } : {}),
        ...(input.model !== undefined ? { model: toNullIfEmpty(input.model) as any } : {}),
        ...(input.serialNumber !== undefined
          ? { serialNumber: toNullIfEmpty(input.serialNumber) as any }
          : {}),
        ...(input.password !== undefined ? { password: toNullIfEmpty(input.password) as any } : {}),
        ...(input.accessories !== undefined
          ? { accessories: toNullIfEmpty(input.accessories) as any }
          : {}),
        ...(input.notes !== undefined ? { notes: toNullIfEmpty(input.notes) as any } : {}),
      },
      include: { client: true },
    });
  }

  async delete(id: string) {
    await this.getById(id);

    await prisma.device.delete({
      where: { id },
    });
  }
}