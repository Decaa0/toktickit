import express from "express";
import cors from "cors";
import requestersRouter from "./routes/requesters";
import referencesRouter from "./routes/references";
import ticketsRouter from "./routes/tickets";
import attachmentsRouter from "./routes/attachments";

const app = express();

app.use(cors());
app.use(express.json());

// Lab 1 Health & Reference endpoints
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// Lab 2 Routes
app.use("/api/requesters", requestersRouter);
app.use("/api", referencesRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/attachments", attachmentsRouter);

export default app;
export { app };