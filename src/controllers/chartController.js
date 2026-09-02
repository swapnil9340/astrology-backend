import { geocodePlace } from "../lib/geocode.js";
import { computeChart } from "../lib/astro/chart.js";

/**
 * POST /api/chart  (public, compute-only — no AI, no DB, no auth)
 * Real-time Vedic chart from birth details. Used by the homepage "Free Kundli"
 * quick preview. The full AI reading stays behind login (/api/predict/basic).
 * body: { dateOfBirth: "YYYY-MM-DD", timeOfBirth?: "HH:MM", placeOfBirth?: "City, Country" }
 */
export async function publicChart(req, res) {
  const { dateOfBirth, timeOfBirth, placeOfBirth } = req.body || {};

  if (!dateOfBirth) {
    return res.status(422).json({ error: "Validation failed", fields: { dateOfBirth: "Date of birth is required." } });
  }
  const d = new Date(String(dateOfBirth));
  if (isNaN(d.getTime())) {
    return res.status(422).json({ error: "Validation failed", fields: { dateOfBirth: "Enter a valid date." } });
  }

  let place = { name: placeOfBirth || "", lat: null, lng: null, timezone: null };
  if (placeOfBirth) {
    const g = geocodePlace(placeOfBirth);
    if (g) place = { name: g.resolvedName, lat: g.lat, lng: g.lng, timezone: g.timezone };
  }

  try {
    const chart = computeChart({
      date: d,
      time: timeOfBirth || null,
      lat: place.lat,
      lng: place.lng,
      timezone: place.timezone,
    });
    return res.json({ chart, place: place.name });
  } catch (e) {
    return res.status(500).json({ error: "Chart computation failed", detail: e.message });
  }
}
