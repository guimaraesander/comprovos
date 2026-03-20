type NodeEnv = "development" | "test" | "production";

const jwtSecret = process.env.JWT_SECRET?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();
const rawNodeEnv = process.env.NODE_ENV?.trim() || "development";
const port = Number(process.env.PORT?.trim() || "3333");

const envMessage = "Variaveis de ambiente obrigatorias nao configuradas.";
const allowedNodeEnvs: NodeEnv[] = ["development", "test", "production"];

if (!allowedNodeEnvs.includes(rawNodeEnv as NodeEnv)) {
  throw new Error(`${envMessage} NODE_ENV invalido.`);
}

if (!jwtSecret) {
  throw new Error(`${envMessage} JWT_SECRET nao esta definido.`);
}

if ((rawNodeEnv === "production" || rawNodeEnv === "development") && !databaseUrl) {
  throw new Error(`${envMessage} DATABASE_URL nao esta definido.`);
}

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error("PORT deve ser um numero inteiro entre 1 e 65535.");
}

export const env = {
  PORT: String(port),
  JWT_SECRET: jwtSecret,
  NODE_ENV: rawNodeEnv as NodeEnv,
  DATABASE_URL: databaseUrl || "",
};
