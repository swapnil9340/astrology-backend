import mongoose from "mongoose";

/**
 * Place of birth — name now, coordinates + timezone get filled by geocoding
 * later (needed for an accurate chart / Lagna).
 */
const placeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true }, // "City, Country"
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    timezone: { type: String, default: null }, // e.g. "Asia/Kolkata"
  },
  { _id: false }
);

/** Birth details — the core input for every astrology prediction. */
const birthSchema = new mongoose.Schema(
  {
    date: { type: Date }, // date of birth
    time: { type: String, default: null }, // "HH:MM" (24h); null if unknown
    timeKnown: { type: Boolean, default: false },
    place: { type: placeSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },

    gender: { type: String, enum: ["male", "female", "other"], default: null },
    birth: { type: birthSchema, default: () => ({}) },

    // Extra profile info — collected later, kept optional here.
    profile: {
      phone: { type: String, default: null },
      avatarUrl: { type: String, default: null },
    },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
