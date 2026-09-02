import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import predictRoutes from "./routes/predict.js";
import panchangRoutes from "./routes/panchang.js";
import chartRoutes from "./routes/chart.js";
import paymentRoutes from "./routes/payment.js";
import { PLANS, PACKS } from "./lib/plans.js";
import { generalLimiter, authLimiter } from "./middleware/rateLimit.js";

export function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  app.use(helmet()); // secure HTTP headers
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(generalLimiter); // light global rate cap

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "astroveda-backend", time: new Date().toISOString() });
  });

  // Public — subscription plans + credit packs
  app.get("/api/plans", (_req, res) => res.json({ plans: PLANS, packs: PACKS }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/predict", predictRoutes);
  app.use("/api/panchang", panchangRoutes);
  app.use("/api/chart", chartRoutes);
  app.use("/api/payment", paymentRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
