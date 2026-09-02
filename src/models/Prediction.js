import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, default: "basic" }, // basic | love | career | ...
    input: { type: Object },   // birth snapshot used
    chart: { type: Object },   // computed chart
    prediction: { type: Object }, // AI output
  },
  { timestamps: true }
);

export const Prediction =
  mongoose.models.Prediction || mongoose.model("Prediction", predictionSchema);
