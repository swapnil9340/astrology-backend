import mongoose from "mongoose";

// One AI rashifal per sign per day (cache — avoids repeat Gemini calls).
const rashifalCacheSchema = new mongoose.Schema(
  {
    sign: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (IST)
    data: { type: Object, required: true },
  },
  { timestamps: true }
);

rashifalCacheSchema.index({ sign: 1, date: 1 }, { unique: true });

export const RashifalCache =
  mongoose.models.RashifalCache || mongoose.model("RashifalCache", rashifalCacheSchema);
