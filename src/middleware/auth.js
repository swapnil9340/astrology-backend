import { verifyToken } from "../lib/token.js";

/** Requires a valid `Authorization: Bearer <token>` header. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}
