import { Router } from "express";
import { basicPrediction, history } from "../controllers/predictController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/basic", requireAuth, basicPrediction);
router.get("/history", requireAuth, history);

export default router;
