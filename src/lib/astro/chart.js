/**
 * Vedic (sidereal) chart engine — pure JS via astronomy-engine.
 * Computes planetary sidereal longitudes → rashi (sign) + nakshatra, and the
 * Lagna (ascendant) when birth time + coordinates are known.
 *
 * Accuracy note: uses Lahiri ayanamsa (approx formula) and mean lunar node for
 * Rahu/Ketu — good enough for a "basic" prediction; can refine later.
 */
import * as Astronomy from "astronomy-engine";
import { PLANETS, describeLongitude, norm360 } from "./constants.js";

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

// ---- timezone helpers (IANA name → exact UTC instant) ----
function tzOffsetMs(tz, utcDate) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = dtf.formatToParts(utcDate).reduce((a, x) => ((a[x.type] = x.value), a), {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - utcDate.getTime();
}

function zonedToUtc(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  const off1 = tzOffsetMs(tz, new Date(guess));
  let utc = guess - off1;
  const off2 = tzOffsetMs(tz, new Date(utc));
  if (off2 !== off1) utc = guess - off2;
  return new Date(utc);
}

// ---- ayanamsa (Lahiri) & obliquity ----
function julianCenturies(date) {
  // T = centuries from J2000.0 (TT approx = UTC here, fine for our precision)
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525;
}

function lahiriAyanamsa(date) {
  // ~23.8531° at J2000, precessing ~50.2388"/yr.
  const T = julianCenturies(date);
  const years = T * 100;
  return 23.8531 + 0.0139552 * years;
}

function meanObliquity(date) {
  const T = julianCenturies(date);
  return 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T;
}

// ---- ecliptic-of-date longitude for any body ----
function eclipticLonOfDate(body, date) {
  const time = Astronomy.MakeTime(date);
  const rot = Astronomy.Rotation_EQJ_ECT(time);
  const eqj = Astronomy.GeoVector(body, time, true); // aberration-corrected
  const ect = Astronomy.RotateVector(rot, eqj);
  return norm360(Math.atan2(ect.y, ect.x) * DEG);
}

// mean lunar ascending node (Rahu), tropical
function meanRahu(date) {
  const T = julianCenturies(date);
  return norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
}

function ascendant(date, latDeg, lonDeg, ayan) {
  const time = Astronomy.MakeTime(date);
  const gast = Astronomy.SiderealTime(time); // hours
  const lstHours = gast + lonDeg / 15;
  const ramc = norm360(lstHours * 15) * RAD; // right ascension of MC (rad)
  const eps = meanObliquity(date) * RAD;
  const phi = latDeg * RAD;
  // tropical ecliptic longitude of the ascendant
  let asc = Math.atan2(
    Math.cos(ramc),
    -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
  ) * DEG;
  asc = norm360(asc);
  return norm360(asc - ayan); // sidereal
}

/** Sidereal (Lahiri) Sun & Moon longitudes at an instant — used by panchang. */
export function siderealSunMoon(date) {
  const ayan = lahiriAyanamsa(date);
  const sun = norm360(eclipticLonOfDate(Astronomy.Body.Sun, date) - ayan);
  const moon = norm360(eclipticLonOfDate(Astronomy.Body.Moon, date) - ayan);
  return { sun, moon, ayanamsa: ayan };
}

/**
 * @param {{date: Date|string, time: string|null, lat: number, lng: number, timezone: string}} birth
 * @returns chart object
 */
export function computeChart(birth) {
  const d = birth.date instanceof Date ? birth.date : new Date(birth.date);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  const timeKnown = Boolean(birth.time);
  const [hh, mm] = (birth.time || "12:00").split(":").map(Number);

  const hasPlace = Number.isFinite(birth.lat) && Number.isFinite(birth.lng) && birth.timezone;
  // If we have a timezone, resolve the exact UTC instant; else assume the
  // stored components are already UTC-ish (fallback).
  const utc = birth.timezone
    ? zonedToUtc(y, mo, day, hh, mm, birth.timezone)
    : new Date(Date.UTC(y, mo - 1, day, hh, mm));

  const ayan = lahiriAyanamsa(utc);

  const bodyMap = {
    sun: Astronomy.Body.Sun,
    moon: Astronomy.Body.Moon,
    mars: Astronomy.Body.Mars,
    mercury: Astronomy.Body.Mercury,
    jupiter: Astronomy.Body.Jupiter,
    venus: Astronomy.Body.Venus,
    saturn: Astronomy.Body.Saturn,
  };

  const planets = {};
  for (const p of PLANETS) {
    let tropLon;
    if (p.key === "rahu") tropLon = meanRahu(utc);
    else if (p.key === "ketu") tropLon = norm360(meanRahu(utc) + 180);
    else tropLon = eclipticLonOfDate(bodyMap[p.key], utc);
    const sidereal = norm360(tropLon - ayan);
    planets[p.key] = { name: p.en, hi: p.hi, ...describeLongitude(sidereal) };
  }

  let lagna = null;
  if (timeKnown && hasPlace) {
    lagna = describeLongitude(ascendant(utc, birth.lat, birth.lng, ayan));
  }

  return {
    meta: {
      utc: utc.toISOString(),
      timeKnown,
      hasPlace: Boolean(hasPlace),
      ayanamsa: +ayan.toFixed(3),
      system: "Vedic sidereal (Lahiri)",
    },
    lagna, // ascendant (null if time/place unknown)
    moonSign: { sign: planets.moon.sign, hi: planets.moon.signHi, nakshatra: planets.moon.nakshatra },
    sunSign: { sign: planets.sun.sign, hi: planets.sun.signHi },
    planets,
  };
}
