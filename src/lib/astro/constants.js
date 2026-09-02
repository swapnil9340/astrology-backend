// Vedic (sidereal) astrology constants.

export const RASHIS = [
  { en: "Aries", hi: "मेष", lord: "Mars" },
  { en: "Taurus", hi: "वृषभ", lord: "Venus" },
  { en: "Gemini", hi: "मिथुन", lord: "Mercury" },
  { en: "Cancer", hi: "कर्क", lord: "Moon" },
  { en: "Leo", hi: "सिंह", lord: "Sun" },
  { en: "Virgo", hi: "कन्या", lord: "Mercury" },
  { en: "Libra", hi: "तुला", lord: "Venus" },
  { en: "Scorpio", hi: "वृश्चिक", lord: "Mars" },
  { en: "Sagittarius", hi: "धनु", lord: "Jupiter" },
  { en: "Capricorn", hi: "मकर", lord: "Saturn" },
  { en: "Aquarius", hi: "कुम्भ", lord: "Saturn" },
  { en: "Pisces", hi: "मीन", lord: "Jupiter" },
];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

// Bodies we compute (7 classical grahas; Rahu/Ketu via mean node).
export const PLANETS = [
  { key: "sun", en: "Sun", hi: "सूर्य" },
  { key: "moon", en: "Moon", hi: "चन्द्र" },
  { key: "mars", en: "Mars", hi: "मंगल" },
  { key: "mercury", en: "Mercury", hi: "बुध" },
  { key: "jupiter", en: "Jupiter", hi: "गुरु" },
  { key: "venus", en: "Venus", hi: "शुक्र" },
  { key: "saturn", en: "Saturn", hi: "शनि" },
  { key: "rahu", en: "Rahu", hi: "राहु" },
  { key: "ketu", en: "Ketu", hi: "केतु" },
];

export function norm360(d) {
  return ((d % 360) + 360) % 360;
}

/** Sidereal longitude → sign + nakshatra + padas etc. */
export function describeLongitude(lonSidereal) {
  const lon = norm360(lonSidereal);
  const signIndex = Math.floor(lon / 30);
  const degInSign = lon - signIndex * 30;
  const nakIndex = Math.floor(lon / (360 / 27));
  const pada = Math.floor((lon % (360 / 27)) / ((360 / 27) / 4)) + 1;
  return {
    lon: +lon.toFixed(3),
    sign: RASHIS[signIndex].en,
    signHi: RASHIS[signIndex].hi,
    signLord: RASHIS[signIndex].lord,
    degInSign: +degInSign.toFixed(2),
    nakshatra: NAKSHATRAS[nakIndex],
    pada,
  };
}
