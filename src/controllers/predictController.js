import {
  getUserById, updateUser, createPrediction, listPredictions,
  countPredictions, countPredictionsThisMonth, adjustCredits,
} from "../lib/store.js";
import { geocodePlace } from "../lib/geocode.js";
import { computeChart } from "../lib/astro/chart.js";
import { aiGenerate } from "../lib/aiClient.js";
import { effectivePlanId, getPlan } from "../lib/plans.js";

const FREE_LIMIT = 3; // free plan: first 3 AI kundlis free; then credits/subscription

const SYSTEM = `You are AstroVeda's expert Vedic astrologer.
You are given a person's ACCURATE computed birth chart (sidereal / Lahiri).
Base every statement on the chart data provided — never invent planetary positions.
Write warm, encouraging, specific guidance in simple English.
This is for guidance and entertainment, never medical/legal/financial certainty.
Give the Moon sign (Rashi) the most weight, as is traditional.`;

function buildPrompt(user, chart) {
  const p = chart.planets;
  const line = (x) => `${x.name}: ${x.sign} (${x.degInSign}°), ${x.nakshatra}`;
  return `Person: ${user.name}${user.gender ? ", " + user.gender : ""}.
Moon sign (Rashi): ${chart.moonSign.sign} — Nakshatra ${chart.moonSign.nakshatra}.
Sun sign: ${chart.sunSign.sign}.
Ascendant (Lagna): ${chart.lagna ? chart.lagna.sign : "unknown (birth time not given)"}.
Planets:
- ${line(p.sun)}
- ${line(p.moon)}
- ${line(p.mars)}
- ${line(p.mercury)}
- ${line(p.jupiter)}
- ${line(p.venus)}
- ${line(p.saturn)}
- ${line(p.rahu)}
- ${line(p.ketu)}

Give a BASIC life reading as strict JSON with these keys:
{
  "headline": "short catchy line",
  "summary": "2-3 sentence overview",
  "personality": "2-3 sentences",
  "love": "2-3 sentences",
  "career": "2-3 sentences",
  "health": "1-2 sentences",
  "luckyNumber": <int 1-9>,
  "luckyColor": "color",
  "luckyDay": "weekday",
  "remedy": "one simple Vedic remedy",
  "disclaimer": "For guidance & entertainment only."
}
Return ONLY the JSON object.`;
}

// POST /api/predict/basic  (protected)
export async function basicPrediction(req, res) {
  const user = await getUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  if (!user.birth || !user.birth.date) {
    return res.status(400).json({ error: "Birth details missing. Please complete your profile." });
  }

  // Quota — depends on the user's effective subscription plan.
  const planId = effectivePlanId(user);
  const plan = getPlan(planId);
  let usingPaidCredit = false;
  let usedTotal = 0;

  if (planId === "free") {
    // free plan: FREE_LIMIT lifetime, then a paid credit (pack) is needed
    usedTotal = await countPredictions(user.id);
    if (usedTotal >= FREE_LIMIT) {
      if ((user.credits || 0) > 0) usingPaidCredit = true;
      else
        return res.status(402).json({
          error: `Aapki ${FREE_LIMIT} free kundli ho chuki hain. Subscribe karein ya ek pack lein.`,
          code: "PAYMENT_REQUIRED",
          reason: "free_exhausted",
          freeLimit: FREE_LIMIT,
          used: usedTotal,
          credits: user.credits || 0,
        });
    }
  } else if (plan.monthlyKundli != null) {
    // metered paid plan (e.g. Silver = 30/month)
    const usedMonth = await countPredictionsThisMonth(user.id);
    if (usedMonth >= plan.monthlyKundli) {
      return res.status(402).json({
        error: `Is mahine ki ${plan.monthlyKundli} kundli limit poori ho gayi. Upgrade karein.`,
        code: "LIMIT_REACHED",
        reason: "monthly_exhausted",
        plan: planId,
        monthlyKundli: plan.monthlyKundli,
        used: usedMonth,
      });
    }
  }
  // else: Gold/Platinum → unlimited, no check

  const birth = { ...user.birth, place: { ...(user.birth.place || {}) } };

  // Geocode place if coordinates are missing, and cache them on the user.
  if ((!Number.isFinite(birth.place.lat) || !birth.place.timezone) && birth.place.name) {
    const geo = geocodePlace(birth.place.name);
    if (geo) {
      birth.place.lat = geo.lat;
      birth.place.lng = geo.lng;
      birth.place.timezone = geo.timezone;
      try {
        await updateUser(user.id, {
          "birth.place.lat": geo.lat,
          "birth.place.lng": geo.lng,
          "birth.place.timezone": geo.timezone,
        });
      } catch { /* non-fatal */ }
    }
  }

  let chart;
  try {
    chart = computeChart({
      date: birth.date,
      time: birth.time,
      lat: birth.place.lat,
      lng: birth.place.lng,
      timezone: birth.place.timezone,
    });
  } catch (e) {
    return res.status(500).json({ error: "Chart computation failed", detail: e.message });
  }

  let prediction;
  try {
    prediction = await aiGenerate({ system: SYSTEM, prompt: buildPrompt(user, chart), json: true });
  } catch (e) {
    return res.status(502).json({ error: "AI prediction failed", detail: e.message });
  }

  // Save history (non-fatal if it fails)
  let saved = null;
  try {
    saved = await createPrediction({
      userId: user.id, type: "basic",
      input: { birth }, chart, prediction,
    });
  } catch { /* ignore */ }

  // Consume a paid credit only if a free-plan user went beyond the free tier.
  let creditsLeft = user.credits || 0;
  if (usingPaidCredit) {
    try { const u = await adjustCredits(user.id, -1); creditsLeft = u?.credits ?? creditsLeft - 1; } catch {}
  }

  const freeLeft = planId === "free" ? Math.max(0, FREE_LIMIT - (usedTotal + 1)) : null;
  return res.json({ id: saved?.id, chart, prediction, plan: planId, freeLeft, credits: creditsLeft });
}

// GET /api/predict/history  (protected)
export async function history(req, res) {
  const items = await listPredictions(req.userId);
  return res.json({ predictions: items });
}
