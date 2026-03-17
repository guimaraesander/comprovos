import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import { CreateClientInput, UpdateClientInput } from "./clients.schemas";

function normalizeEmail(email?: string | null) {
  const v = (email ?? "").trim();
  return v.length ? v : null;
}

export class ClientsService {
  async create(data: CreateClientInput) {
    try {
      return await prisma.client.create({
        data: {
          ...data,
          email: normalizeEmail(data.email),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw HttpError.conflict("Já existe um cliente com esse CPF/CNPJ.");
      }
      throw err;
    }
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
      throw HttpError.notFound("Cliente não encontrado.");
    }

    return client;
  }

  async update(id: string, data: UpdateClientInput) {
    await this.getById(id);

    try {
      return await prisma.client.update({
        where: { id },
        data: {
          ...data,
          ...(data.email !== undefined ? { email: normalizeEmail(data.email) } : {}),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw HttpError.conflict("Já existe um cliente com esse CPF/CNPJ.");
      }
      throw err;
    }
  }

  async delete(id: string) {
    await this.getById(id);

    const linkedServiceOrdersCount = await prisma.serviceOrder.count({
      where: { clientId: id },
    });

    if (linkedServiceOrdersCount > 0) {
      throw HttpError.conflict(
        "Cliente possui ordens de serviço vinculadas e não pode ser excluído."
      );
    }

    await prisma.client.delete({
      where: { id },
    });
  }
}