import { Router } from "express";
import { basicPrediction, history } from "../controllers/predictController.js";
import { requireAuth } from "../middleware/auth.js";
import { predictLimiter } from "../middleware/rateLimit.js";

const router = Router();

// requireAuth first (sets req.userId), then per-user rate limit on the costly AI call
router.post("/basic", requireAuth, predictLimiter, basicPrediction);
router.get("/history", requireAuth, history);

export default router;
