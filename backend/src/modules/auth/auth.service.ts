import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import type { LoginInput } from "./auth.schemas";

type LoginResult = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw HttpError.internal("JWT_SECRET não configurado.");
  }
  return secret;
}

export class AuthService {
  async login(input: LoginInput): Promise<LoginResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    // ✅ credenciais inválidas => 401
    if (!user) {
      throw HttpError.unauthorized("Credenciais inválidas.");
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw HttpError.unauthorized("Credenciais inválidas.");
    }

    const secret = getJwtSecret();

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, name: user.name },
      secret,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      throw HttpError.notFound("Usuário não encontrado.");
    }

    return user;
  }
}