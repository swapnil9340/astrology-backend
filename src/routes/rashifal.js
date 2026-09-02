import { Router } from "express";
import { getRashifal } from "../controllers/rashifalController.js";

const router = Router();

// Public — today's AI rashifal for a sign (cached per day).
router.get("/:sign", getRashifal);

export default router;
