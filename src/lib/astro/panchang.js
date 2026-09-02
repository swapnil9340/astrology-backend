/**
 * Real-time Panchang — computes TODAY's (or any date's) Hindu almanac for a
 * location from actual Sun/Moon positions (sidereal) + sunrise/sunset.
 * Pure JS via astronomy-engine. Values are taken at local sunrise (traditional).
 */
import * as Astronomy from "astronomy-engine";
import { NAKSHATRAS, norm360 } from "./constants.js";
import { siderealSunMoon } from "./chart.js";

const TITHI_14 = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi",
];

const YOGAS = [
  "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti",
];

const KARANA_MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
const VAARA = ["Ravivara", "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara"];

// Rahu Kaal segment (1-8) of daytime by weekday (0=Sun … 6=Sat)
const RAHU_SEG = { 0: 8, 1: 2, 2: 7, 3: 5, 4: 6, 5: 4, 6: 3 };

const DELHI = { lat: 28.6139, lng: 77.209, timezone: "Asia/Kolkata", name: "New Delhi, India" };

function fmtTime(date, tz) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(date);
}

function weekdayIndex(date, tz) {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(date);
  return ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 })[wd] ?? date.getUTCDay();
}

function tithiName(index) {
  const paksha = index < 15 ? "Shukla" : "Krishna";
  const within = index % 15;
  const name = within === 14 ? (paksha === "Shukla" ? "Purnima" : "Amavasya") : TITHI_14[within];
  return `${paksha} ${name}`;
}

function karanaName(diffDeg) {
  const n = Math.floor(diffDeg / 6); // 0..59 half-tithis
  if (n === 0) return "Kimstughna";
  if (n >= 57) return ["Shakuni", "Chatushpada", "Naga"][n - 57];
  return KARANA_MOVABLE[(n - 1) % 7];
}

/**
 * @param {{date?: Date, lat?: number, lng?: number, timezone?: string, place?: string}} opts
 */
export function computePanchang(opts = {}) {
  const lat = Number.isFinite(opts.lat) ? opts.lat : DELHI.lat;
  const lng = Number.isFinite(opts.lng) ? opts.lng : DELHI.lng;
  const tz = opts.timezone || DELHI.timezone;
  const baseDate = opts.date instanceof Date ? opts.date : new Date();

  const observer = new Astronomy.Observer(lat, lng, 0);
  // search from local midnight-ish (use start of the day in UTC around baseDate)
  const dayStart = new Date(Date.UTC(
    baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0
  ));

  const riseT = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, dayStart, 2);
  const setT = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, riseT ? riseT.date : dayStart, 2);
  const sunrise = riseT ? riseT.date : null;
  const sunset = setT ? setT.date : null;

  // Panchang elements at sunrise (traditional); fallback to baseDate.
  const at = sunrise || baseDate;
  const { sun, moon } = siderealSunMoon(at);
  const diff = norm360(moon - sun);

  const tithiIndex = Math.floor(diff / 12);
  const nakIndex = Math.floor(moon / (360 / 27));
  const yogaIndex = Math.floor(norm360(sun + moon) / (360 / 27));
  const wd = weekdayIndex(at, tz);

  let rahuKaal = null, abhijit = null;
  if (sunrise && sunset) {
    const dayMs = sunset.getTime() - sunrise.getTime();
    const part = dayMs / 8;
    const seg = RAHU_SEG[wd];
    const rStart = new Date(sunrise.getTime() + (seg - 1) * part);
    const rEnd = new Date(rStart.getTime() + part);
    rahuKaal = `${fmtTime(rStart, tz)} – ${fmtTime(rEnd, tz)}`;

    const midday = new Date(sunrise.getTime() + dayMs / 2);
    const aStart = new Date(midday.getTime() - 24 * 60000);
    const aEnd = new Date(midday.getTime() + 24 * 60000);
    abhijit = `${fmtTime(aStart, tz)} – ${fmtTime(aEnd, tz)}`;
  }

  const dateStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(baseDate);

  return {
    date: dateStr,
    location: opts.place || DELHI.name,
    vaara: VAARA[wd],
    tithi: tithiName(tithiIndex),
    nakshatra: NAKSHATRAS[nakIndex],
    yoga: YOGAS[yogaIndex],
    karana: karanaName(diff),
    sunrise: sunrise ? fmtTime(sunrise, tz) : "—",
    sunset: sunset ? fmtTime(sunset, tz) : "—",
    rahuKaal: rahuKaal || "—",
    abhijitMuhurat: abhijit || "—",
  };
}
