import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

export function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "astroveda-backend", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
