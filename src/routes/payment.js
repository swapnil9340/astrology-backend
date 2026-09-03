import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/order", requireAuth, createOrder);
router.post("/verify", requireAuth, verifyPayment);

export default router;
