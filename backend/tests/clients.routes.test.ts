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

type PrismaClientMock = {
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

type PrismaMock = {
  client: PrismaClientMock;
};

const prismaMock = prisma as unknown as PrismaMock;

let app: Express;

function makeToken(role: "ADMIN" | "TECNICO") {
  return jwt.sign(
    {
      sub: "user-1",
      role,
      email: role === "ADMIN" ? "admin@comprovos.com" : "tecnico@comprovos.com",
      name: role === "ADMIN" ? "Administrador" : "Tecnico",
    },
    "test-jwt-secret",
    { expiresIn: "7d" }
  );
}

beforeAll(async () => {
  const imported = await import("../src/app");
  app = imported.app;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Clients routes", () => {
  it("deve retornar 401 ao listar clientes sem token", async () => {
    const response = await request(app).get("/api/clients");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Token nao informado");
  });

  it("deve retornar 403 quando TECNICO tentar excluir cliente", async () => {
    const tecnicoToken = makeToken("TECNICO");

    const response = await request(app)
      .delete("/api/clients/client-1")
      .set("Authorization", `Bearer ${tecnicoToken}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Acesso negado");
  });

  it("deve permitir que ADMIN crie cliente com dados válidos", async () => {
    const adminToken = makeToken("ADMIN");

    prismaMock.client.create.mockResolvedValue({
      id: "client-1",
      name: "Maria Silva",
      phone: "88998034589",
      cpfCnpj: "12345678910",
      email: "maria@email.com",
      rgIe: null,
      address: null,
      district: null,
      city: null,
      state: null,
      zipCode: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const response = await request(app)
      .post("/api/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Maria Silva",
        phone: "(88) 99803-4589",
        cpfCnpj: "123.456.789-10",
        email: "maria@email.com",
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe("client-1");

    expect(prismaMock.client.create).toHaveBeenCalledWith({
      data: {
        name: "Maria Silva",
        phone: "88998034589",
        cpfCnpj: "12345678910",
        email: "maria@email.com",
      },
    });
  });

  it("deve listar clientes para usuário autenticado com perfil permitido", async () => {
    const tecnicoToken = makeToken("TECNICO");

    prismaMock.client.findMany.mockResolvedValue([
      {
        id: "client-1",
        name: "Maria Silva",
        phone: "88998034589",
        cpfCnpj: "12345678910",
        email: "maria@email.com",
        rgIe: null,
        address: null,
        district: null,
        city: null,
        state: null,
        zipCode: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const response = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${tecnicoToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe("client-1");
  });
});