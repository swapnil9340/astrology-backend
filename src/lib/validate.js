// Minimal input validation — no external deps.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(body = {}) {
  const errors = {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";

  return { valid: Object.keys(errors).length === 0, errors, data: { name, email, password } };
}

export function validateLogin(body = {}) {
  const errors = {};
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";

  return { valid: Object.keys(errors).length === 0, errors, data: { email, password } };
}
