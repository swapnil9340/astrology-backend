import Razorpay from "razorpay";
import crypto from "node:crypto";

let instance = null;

export function razorpay() {
  if (instance) return instance;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error("Razorpay keys missing in .env");
  instance = new Razorpay({ key_id, key_secret });
  return instance;
}

/** Verify Razorpay checkout signature (HMAC-SHA256 of order_id|payment_id). */
export function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
