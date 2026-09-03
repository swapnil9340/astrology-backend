import { Router } from "express";
import { publicChart } from "../controllers/chartController.js";

const router = Router();

// Public (no auth) compute-only — global rate limiter applies.
router.post("/", publicChart);

export default router;
