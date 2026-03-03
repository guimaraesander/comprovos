import express from "express";
import cors from "cors";
import { router } from "./routes";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ComprovOS API",
  });
});

app.use("/api", router);

app.use(errorHandler);