import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["pack", "plan"], required: true },
    itemId: { type: String, required: true }, // packId or planId
    amount: { type: Number, required: true }, // INR
    orderId: { type: String, index: true },
    paymentId: { type: String, default: null },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
