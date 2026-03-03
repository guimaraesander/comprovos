import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";

const PORT = Number(env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`ComprovOS API rodando na porta ${PORT}`);
});