import bcrypt from "bcryptjs";
import { getUserByEmail, getUserById, createUser } from "../lib/store.js";
import { signToken, publicUser } from "../lib/token.js";
import { validateRegister, validateLogin } from "../lib/validate.js";

// POST /api/auth/register
export async function register(req, res) {
  const { valid, errors, data } = validateRegister(req.body);
  if (!valid) return res.status(422).json({ error: "Validation failed", fields: errors });

  const existing = await getUserByEmail(data.email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await createUser({ name: data.name, email: data.email, passwordHash });
  const token = signToken(user);

  return res.status(201).json({ token, user: publicUser(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  const { valid, errors, data } = validateLogin(req.body);
  if (!valid) return res.status(422).json({ error: "Validation failed", fields: errors });

  const user = await getUserByEmail(data.email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);
  return res.json({ token, user: publicUser(user) });
}

// GET /api/auth/me  (protected)
export async function me(req, res) {
  const user = await getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  return res.json({ user: publicUser(user) });
}
