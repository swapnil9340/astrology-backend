import { Router } from "express";
import { getPanchang } from "../controllers/panchangController.js";

const router = Router();

// Public (no auth) — global rate limiter applies.
router.get("/", getPanchang);

export default router;
