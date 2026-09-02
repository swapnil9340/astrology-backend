/**
 * Provider-abstract AI client. Currently implements Gemini (free tier).
 * Swap providers via AI_PROVIDER — the rest of the app calls aiGenerate() only.
 */

const PROVIDER = process.env.AI_PROVIDER || "gemini";
const MODEL = process.env.AI_MODEL || "gemini-3.6-flash";

async function geminiGenerate({ system, prompt, json }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing in .env");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.85,
      ...(json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Gemini error ${res.status}`;
    throw new Error(msg);
  }

  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text).filter(Boolean).join("").trim();
  if (!text) throw new Error("Empty response from AI");
  return text;
}

/**
 * @param {{system?: string, prompt: string, json?: boolean}} opts
 * @returns {Promise<string|object>} text, or parsed object if json:true
 */
export async function aiGenerate({ system, prompt, json = false }) {
  let text;
  if (PROVIDER === "gemini") {
    text = await geminiGenerate({ system, prompt, json });
  } else {
    throw new Error(`AI provider "${PROVIDER}" not implemented yet`);
  }

  if (!json) return text;
  try {
    return JSON.parse(text);
  } catch {
    // model sometimes wraps JSON in ```json fences — strip and retry
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
  }
}
