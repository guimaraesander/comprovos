import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { Express } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config/swagger", () => {
  return {
    setupSwagger: vi.fn(),
  };
});

vi.mock("../src/config/env", () => {
  return {
    env: {
      JWT_SECRET: "test-jwt-secret",
      PORT: "3333",
    },
  };
});

vi.mock("../src/lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      client: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

import { prisma } from "../src/lib/prisma";

type PrismaUserMock = {
  findUnique: ReturnType<typeof vi.fn>;
};

type PrismaMock = {
  user: PrismaUserMock;
};

const prismaMock = prisma as unknown as PrismaMock;

let app: Express;

beforeAll(async () => {
  const imported = await import("../src/app");
  app = imported.app;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth routes", () => {
  it("deve realizar login com credenciais válidas", async () => {
    const password = "123456";
    const passwordHash = await bcrypt.hash(password, 8);

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Administrador",
      email: "admin@comprovos.com",
      role: "ADMIN",
      passwordHash,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "admin@comprovos.com",
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toEqual({
      id: "user-1",
      name: "Administrador",
      email: "admin@comprovos.com",
      role: "ADMIN",
    });
  });

  it("deve retornar 401 quando as credenciais forem inválidas", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(app).post("/api/auth/login").send({
      email: "naoexiste@comprovos.com",
      password: "123456",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Credenciais inválidas.");
  });

  it("deve retornar 401 no /auth/me sem token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token nao informado");
  });

  it("deve retornar o usuário autenticado no /auth/me com token válido", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Administrador",
      email: "admin@comprovos.com",
      role: "ADMIN",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const token = jwt.sign(
      {
        sub: "user-1",
        role: "ADMIN",
        email: "admin@comprovos.com",
        name: "Administrador",
      },
      "test-jwt-secret",
      { expiresIn: "7d" }
    );

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe("user-1");
    expect(response.body.email).toBe("admin@comprovos.com");
    expect(response.body.role).toBe("ADMIN");
  });
});