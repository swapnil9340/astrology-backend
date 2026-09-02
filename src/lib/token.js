import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/** Strip sensitive fields before sending a user to the client. */
export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}
