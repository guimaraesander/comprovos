import express from "express";
import cors from "cors";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";
import { setupSwagger } from "./config/swagger";

export const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} em ${req.url}`);
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ComprovOS API",
  });
});

app.use("/api", routes);

// Swagger
setupSwagger(app);

// Handler de erros (deixar por último)
app.use(errorHandler);