/**
 * User data layer — now backed by MongoDB (Mongoose).
 * The rest of the app only talks to these three functions, so swapping the
 * database only ever means editing this file. Returns plain objects with `id`
 * (not `_id`) so controllers / publicUser() stay unchanged.
 */
import { User } from "../models/User.js";

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
