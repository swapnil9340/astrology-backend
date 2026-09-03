import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const json429 = (message) => (req, res) => res.status(429).json({ error: message });

const base = { standardHeaders: true, legacyHeaders: false };

// Light global cap per IP — blunts abusive bursts.
export const generalLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 300,
  handler: json429("Too many requests. Please slow down and try again shortly."),
});

// Stricter on auth to slow brute-force / signup spam.
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 40,
  handler: json429("Too many attempts. Please try again in a few minutes."),
});

// Protects the AI (each prediction costs money). Keyed PER USER (runs after auth).
export const predictLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  keyGenerator: (req) => req.userId || ipKeyGenerator(req.ip),
  handler: json429("Free prediction limit reached for now. Please try again later."),
});
