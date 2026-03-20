const missingEnvVarMessage = "A variavel de ambiente JWT_SECRET nao esta definida.";

const jwtSecret = process.env.JWT_SECRET?.trim();

if (!jwtSecret) {
  throw new Error(missingEnvVarMessage);
}

export const env = {
  PORT: process.env.PORT || "3333",
  JWT_SECRET: jwtSecret,
  NODE_ENV: process.env.NODE_ENV || "development",
};
