import swaggerJSDoc from "swagger-jsdoc";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./env";

function normalizeSwaggerUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function getSwaggerServerUrl() {
  const envUrl = process.env.SWAGGER_SERVER_URL?.trim();

  if (envUrl && envUrl.length > 0) {
    return normalizeSwaggerUrl(envUrl);
  }

  return normalizeSwaggerUrl(`http://localhost:${env.PORT}`);
}

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "ComprovOS API",
    version: "1.0.0",
    description: "API do sistema ComprovOS (Ordens de Serviço e acompanhamento em nuvem)",
  },
  servers: [
    {
      url: "http://localhost:3333/api",
      description: "Servidor local",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@comprovos.com" },
          password: { type: "string", example: "123456" },
        },
      },

      Client: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          cpfCnpj: { type: "string", nullable: true },
          rgIe: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          district: { type: "string", nullable: true },
          city: { type: "string", nullable: true },
          state: { type: "string", nullable: true },
          zipCode: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      ServiceOrder: {
        type: "object",
        properties: {
          id: { type: "string" },
          osNumber: { type: "integer" },

          clientId: { type: "string" },
          clientCpfCnpj: { type: "string" },

          equipmentType: { type: "string" },
          equipmentBrand: { type: "string", nullable: true },
          equipmentModel: { type: "string", nullable: true },
          equipmentSerialNumber: { type: "string", nullable: true },
          equipmentPassword: { type: "string", nullable: true },

          entryDate: { type: "string", format: "date-time" },
          symptoms: { type: "string" },
          accessories: { type: "string", nullable: true },
          observations: { type: "string", nullable: true },

          status: {
            type: "string",
            enum: [
              "ABERTA",
              "EM_ANALISE",
              "AGUARDANDO_APROVACAO",
              "EM_MANUTENCAO",
              "FINALIZADA",
              "ENTREGUE",
              "CANCELADA",
            ],
          },

          budgetValue: { type: "string", nullable: true, example: "150.00" },
          finalValue: { type: "string", nullable: true, example: "180.00" },

          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  definition: {
    ...swaggerDefinition,
    servers: [
      {
        url: getSwaggerServerUrl(),
        description: "Servidor da API",
      },
    ],
  },
  apis: ["src/modules/**/*.routes.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
