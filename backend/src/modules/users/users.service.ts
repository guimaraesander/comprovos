import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import type { CreateUserInput } from "./users.schemas";

type CurrentUser = {
  id: string;
  role: "ADMIN" | "TECNICO";
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UsersService {
  async list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });
  }

  async create(input: CreateUserInput, currentUser: CurrentUser) {
    if (currentUser.role !== "ADMIN") {
      throw HttpError.forbidden("Apenas administradores podem criar usuários.");
    }

    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw HttpError.conflict("Já existe um usuário com esse email.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return prisma.user.create({
      data: {
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: input.role,
      },
      select: userSelect,
    });
  }

  async delete(id: string, currentUser: CurrentUser) {
    if (currentUser.role !== "ADMIN") {
      throw HttpError.forbidden("Apenas administradores podem excluir usuários.");
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!targetUser) {
      throw HttpError.notFound("Usuário não encontrado.");
    }

    if (targetUser.id === currentUser.id) {
      throw HttpError.badRequest("Você não pode excluir o próprio usuário.");
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        throw HttpError.badRequest("Não é permitido excluir o último administrador.");
      }
    }

    await prisma.user.delete({
      where: { id },
    });
  }
}