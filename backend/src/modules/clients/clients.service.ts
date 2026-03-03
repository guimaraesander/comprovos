import { prisma } from "../../lib/prisma";
import { CreateClientInput, UpdateClientInput } from "./clients.schemas";

export class ClientsService {
  async create(data: CreateClientInput) {
    return prisma.client.create({
      data: {
        ...data,
        email: data.email || null,
      },
    });
  }

  async list() {
    return prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new Error("Cliente nao encontrado");
    }

    return client;
  }

  async update(id: string, data: UpdateClientInput) {
    await this.getById(id);

    return prisma.client.update({
      where: { id },
      data: {
        ...data,
        email: data.email === "" ? null : data.email,
      },
    });
  }

  async delete(id: string) {
    await this.getById(id);

    await prisma.client.delete({
      where: { id },
    });
  }
}