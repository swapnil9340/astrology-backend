import { computePanchang } from "../lib/astro/panchang.js";
import { geocodePlace } from "../lib/geocode.js";

// GET /api/panchang?place=Jaipur,India  (or ?lat=&lng=&tz=)  (optional ?date=YYYY-MM-DD)
// Public — panchang is public info; global rate limiter still applies.
export async function getPanchang(req, res) {
  const { place, lat, lng, tz, date } = req.query;

  let opts = {};
  if (place) {
    const geo = geocodePlace(String(place));
    if (geo) opts = { lat: geo.lat, lng: geo.lng, timezone: geo.timezone, place: geo.resolvedName };
    else opts = { place: String(place) }; // falls back to default coords
  } else if (lat && lng) {
    opts = { lat: Number(lat), lng: Number(lng), timezone: tz || "Asia/Kolkata" };
  }

  if (date) {
    const d = new Date(String(date));
    if (!isNaN(d.getTime())) opts.date = d;
  }

  try {
    const panchang = computePanchang(opts);
    return res.json({ panchang });
  } catch (e) {
    return res.status(500).json({ error: "Panchang computation failed", detail: e.message });
  }
}
