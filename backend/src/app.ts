import express from "express";
import cors from "cors";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";
import { setupSwagger } from "./config/swagger";

export const app = express();

app.use(cors());
app.use(express.json());

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