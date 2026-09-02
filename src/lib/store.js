/**
 * User data layer — now backed by MongoDB (Mongoose).
 * The rest of the app only talks to these three functions, so swapping the
 * database only ever means editing this file. Returns plain objects with `id`
 * (not `_id`) so controllers / publicUser() stay unchanged.
 */
import { User } from "../models/User.js";
import { Prediction } from "../models/Prediction.js";

/** Map a Mongoose doc/lean object to the app's user shape (`_id` → `id`). */
function toUser(doc) {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export async function getUserByEmail(email) {
  const doc = await User.findOne({ email: String(email).toLowerCase() }).lean();
  return toUser(doc);
}

export async function getUserById(id) {
  try {
    const doc = await User.findById(id).lean();
    return toUser(doc);
  } catch {
    // invalid ObjectId (e.g. stale/old token) → treat as not found
    return null;
  }
}

export async function createUser(data) {
  const doc = await User.create({ ...data, email: String(data.email).toLowerCase() });
  return toUser(doc.toObject());
}

/** Patch a user (dot-notation keys allowed, e.g. "birth.place.lat"). */
export async function updateUser(id, patch) {
  const doc = await User.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  return toUser(doc);
}

// ---- predictions ----
export async function createPrediction(data) {
  const doc = await Prediction.create(data);
  const { _id, __v, ...rest } = doc.toObject();
  return { id: String(_id), ...rest };
}

export async function listPredictions(userId, limit = 20) {
  const docs = await Prediction.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  return docs.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest }));
}
