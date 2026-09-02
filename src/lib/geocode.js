/**
 * Offline geocoding: place name → { lat, lng, timezone }.
 * Uses the bundled `city-timezones` dataset (no API key, works offline).
 * Good enough for a basic chart; can upgrade to a precise geocoder later.
 */
import cityTimezones from "city-timezones";

export function geocodePlace(place) {
  if (!place) return null;
  // "Jaipur, India" → try the city part first
  const city = String(place).split(",")[0].trim();
  if (!city) return null;

  let matches = cityTimezones.lookupViaCity(city);

  // Fallback: fuzzy search over the whole string
  if ((!matches || matches.length === 0) && typeof cityTimezones.findFromCityStateProvince === "function") {
    try { matches = cityTimezones.findFromCityStateProvince(String(place)); } catch { matches = []; }
  }
  if (!matches || matches.length === 0) return null;

  // If the input names a country, prefer a match in it; else the most populous.
  const rest = String(place).toLowerCase();
  const inCountry = matches.filter(
    (m) => m.country && rest.includes(m.country.toLowerCase())
  );
  const pool = inCountry.length ? inCountry : matches;
  pool.sort((a, b) => (b.pop || 0) - (a.pop || 0));
  const best = pool[0];

  return {
    lat: best.lat,
    lng: best.lng,
    timezone: best.timezone,
    resolvedName: [best.city, best.province, best.country].filter(Boolean).join(", "),
  };
}
