import { razorpay, verifySignature } from "../lib/razorpay.js";
import { getPlan, getPack } from "../lib/plans.js";
import {
  getUserById, adjustCredits, activateSubscription,
  createPayment, markPaymentPaid,
} from "../lib/store.js";

// POST /api/payment/order  (protected)
// body: { kind: "pack"|"plan", itemId: "pack10"|"gold"|... }
export async function createOrder(req, res) {
  const { kind, itemId } = req.body || {};
  if (kind !== "pack" && kind !== "plan") {
    return res.status(422).json({ error: "Invalid payment kind." });
  }

  let amount, name;
  if (kind === "pack") {
    const pack = getPack(itemId);
    if (!pack) return res.status(404).json({ error: "Pack not found." });
    amount = pack.price;
    name = pack.name;
  } else {
    const plan = getPlan(itemId);
    if (!plan || plan.price <= 0) return res.status(404).json({ error: "Plan not found." });
    amount = plan.price;
    name = `${plan.name} subscription`;
  }

  try {
    const order = await razorpay().orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: req.userId, kind, itemId },
    });

    await createPayment({ userId: req.userId, kind, itemId, amount, orderId: order.id });

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public — safe for frontend
      name,
    });
  } catch (e) {
    return res.status(502).json({ error: "Payment order failed", detail: e?.error?.description || e.message });
  }
}

// POST /api/payment/verify  (protected)
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, kind, itemId }
export async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, kind, itemId } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(422).json({ error: "Missing payment fields." });
  }
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ error: "Payment verification failed." });
  }

  try {
    await markPaymentPaid(razorpay_order_id, razorpay_payment_id);
  } catch { /* non-fatal */ }

  // Grant the purchase
  let result = {};
  if (kind === "pack") {
    const pack = getPack(itemId);
    if (!pack) return res.status(404).json({ error: "Pack not found." });
    const u = await adjustCredits(req.userId, pack.credits);
    result = { credits: u?.credits };
  } else if (kind === "plan") {
    const plan = getPlan(itemId);
    if (!plan) return res.status(404).json({ error: "Plan not found." });
    const u = await activateSubscription(req.userId, plan.id, 30);
    result = { subscription: u?.subscription };
  }

  const user = await getUserById(req.userId);
  return res.json({ ok: true, ...result, user });
}
