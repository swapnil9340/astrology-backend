import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import predictRoutes from "./routes/predict.js";
import panchangRoutes from "./routes/panchang.js";
import chartRoutes from "./routes/chart.js";
import paymentRoutes from "./routes/payment.js";
import rashifalRoutes from "./routes/rashifal.js";
import { PLANS, PACKS } from "./lib/plans.js";
import { generalLimiter, authLimiter } from "./middleware/rateLimit.js";

export function createApp() {
  const app = express();

  // Default to allow-all (origin:true reflects the request origin → works with
  // credentials). Set CLIENT_ORIGIN to specific comma-separated origins to lock down.
  const raw = (process.env.CLIENT_ORIGIN || "*").trim();
  const corsOrigin = raw === "*" ? true : raw.split(",").map((o) => o.trim());

  // secure headers; allow cross-origin use since this is an API for other origins
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.options("*", cors({ origin: corsOrigin, credentials: true })); // preflight
  app.use(express.json({ limit: "100kb" }));
  app.use(generalLimiter); // light global rate cap

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      message: "🔮 AstroVeda API is running",
      docs: ["/api/health", "/api/plans", "/api/auth", "/api/predict", "/api/panchang", "/api/chart"],
    });
  });

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
  app.use("/api/rashifal", rashifalRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));

  // Error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
