/**
 * Subscription plans. `monthlyKundli`: number = per-month AI kundli quota,
 * null = unlimited. Free plan uses a lifetime quota of 3 (handled in controller).
 * Prices in INR.
 */
export const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    monthlyKundli: 3, // lifetime 3 for free (see controller)
    popular: false,
    tagline: "Shuruaat ke liye",
    features: [
      "3 free AI kundli",
      "Daily horoscope & rashifal",
      "Real-time panchang",
      "Basic chart preview",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    price: 99,
    period: "month",
    monthlyKundli: 30,
    popular: false,
    tagline: "Regular seekers",
    features: [
      "30 AI kundli / month",
      "Love & marriage predictions",
      "Kundli matching",
      "Ad-free experience",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 299,
    period: "month",
    monthlyKundli: null, // unlimited
    popular: true,
    tagline: "Best value",
    features: [
      "Unlimited AI kundli",
      "All predictions (career, health, finance)",
      "Detailed PDF reports + print",
      "Priority generation",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 599,
    period: "month",
    monthlyKundli: null,
    popular: false,
    tagline: "The full experience",
    features: [
      "Everything in Gold",
      "Talk to Pandit ji — discounted minutes",
      "Share kundli with astrologer",
      "Priority support",
    ],
  },
];

// One-time credit packs (pay-as-you-go).
export const PACKS = [
  { id: "pack10", name: "10 Kundli Pack", credits: 10, price: 100 },
  { id: "pack25", name: "25 Kundli Pack", credits: 25, price: 200 },
];

export function getPlan(id) {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

export function getPack(id) {
  return PACKS.find((p) => p.id === id) || null;
}

/** The user's currently effective plan id (respects active + non-expired sub). */
export function effectivePlanId(user) {
  const sub = user?.subscription;
  if (sub && sub.status === "active" && (!sub.expiresAt || new Date(sub.expiresAt) > new Date())) {
    return sub.plan || "free";
  }
  return "free";
}
