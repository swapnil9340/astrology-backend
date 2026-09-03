import { aiGenerate } from "../lib/aiClient.js";
import { RashifalCache } from "../models/RashifalCache.js";

const SIGNS = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces",
};

function todayIST() {
  // YYYY-MM-DD in Asia/Kolkata
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}

const SYSTEM =
  "You are an expert Vedic astrologer writing today's daily horoscope (rashifal). " +
  "Be warm, positive and specific. This is for guidance/entertainment only.";

function buildPrompt(signName, date, lang) {
  const langLine = lang === "hi"
    ? "Write ALL text values in Hindi (Devanagari script). Keys stay in English."
    : "Write in simple English.";
  return `Write today's (${date}) Vedic daily horoscope for the moon sign ${signName}.
${langLine}
Return STRICT JSON only, with these keys:
{
  "overall": "2-3 warm sentences about the day",
  "love": "1-2 sentences",
  "career": "1-2 sentences",
  "health": "1-2 sentences",
  "finance": "1-2 sentences",
  "lucky": { "number": <int 1-9>, "color": "color name", "time": "part of day" },
  "mood": "one word",
  "ratings": { "love": <int 0-100>, "career": <int 0-100>, "health": <int 0-100> }
}
Return ONLY the JSON object.`;
}

// GET /api/rashifal/:sign   (public; cached per sign per day)
export async function getRashifal(req, res) {
  const slug = String(req.params.sign || "").toLowerCase();
  const signName = SIGNS[slug];
  if (!signName) return res.status(404).json({ error: "Unknown sign." });

  const lang = req.query.lang === "hi" ? "hi" : "en";
  const day = todayIST();
  const cacheKey = `${day}:${lang}`; // per sign, per day, per language

  // 1. cache hit?
  try {
    const cached = await RashifalCache.findOne({ sign: slug, date: cacheKey }).lean();
    if (cached) return res.json({ sign: slug, date: day, lang, source: "cache", rashifal: cached.data });
  } catch { /* ignore, fall through */ }

  // 2. generate via Gemini
  try {
    const data = await aiGenerate({ system: SYSTEM, prompt: buildPrompt(signName, day, lang), json: true });
    try {
      await RashifalCache.create({ sign: slug, date: cacheKey, data });
    } catch { /* duplicate (race) — fine */ }
    return res.json({ sign: slug, date: day, lang, source: "ai", rashifal: data });
  } catch (e) {
    return res.status(502).json({ error: "Rashifal generate nahi ho paya", detail: e.message });
  }
}
