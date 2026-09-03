// Minimal input validation — no external deps.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:MM" 24h
const GENDERS = ["male", "female", "other"];

/**
 * Registration now captures birth details so we can generate a basic
 * prediction right after signup. (Finer details are collected later.)
 */
export function validateRegister(body = {}) {
  const errors = {};

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const phone = String(body.phone || "").trim();
  const gender = String(body.gender || "").trim().toLowerCase();
  const dateOfBirth = String(body.dateOfBirth || "").trim();
  const timeOfBirth = String(body.timeOfBirth || "").trim();
  const placeOfBirth = String(body.placeOfBirth || "").trim();

  // account basics
  if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.phone = "Enter a valid phone number.";
  }

  // birth basics
  if (!GENDERS.includes(gender)) errors.gender = "Select your gender.";

  let dob = null;
  if (!dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else {
    dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) errors.dateOfBirth = "Enter a valid date of birth.";
    else if (dob > new Date()) errors.dateOfBirth = "Date of birth cannot be in the future.";
    else if (dob.getFullYear() < 1900) errors.dateOfBirth = "Enter a realistic date of birth.";
  }

  // time is optional (many don't know it) but must be valid if given
  if (timeOfBirth && !TIME_RE.test(timeOfBirth)) {
    errors.timeOfBirth = "Use 24-hour format, e.g. 14:30.";
  }

  if (placeOfBirth.length < 2) errors.placeOfBirth = "Enter your place of birth.";

  const data = {
    name,
    email,
    password,
    gender,
    profile: { phone },
    birth: {
      date: dob,
      time: timeOfBirth || null,
      timeKnown: Boolean(timeOfBirth),
      place: { name: placeOfBirth, lat: null, lng: null, timezone: null },
    },
  };

  return { valid: Object.keys(errors).length === 0, errors, data };
}

export function validateLogin(body = {}) {
  const errors = {};
  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";

  return { valid: Object.keys(errors).length === 0, errors, data: { email, password } };
}
