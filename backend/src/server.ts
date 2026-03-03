import { app } from "./app";

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`ComprovOS API rodando na porta ${PORT}`);
});