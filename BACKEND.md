# AstroVeda — Backend Documentation

> **Living document.** Har naya backend feature yahan add karte jao. Ye file
> akela padh ke koi bhi (AI ya insaan) poora backend samajh sakta hai.
>
> Master plan: `./PROJECT_PLAN.md` (this repo) · Frontend docs: separate repo
> `astrology-frontend` → `frontend-astro/FRONTEND.md`.

---

## 1. Overview

AstroVeda ka **REST API backend** — Node.js + Express. Abhi ye **authentication**
(register / login / current-user) handle karta hai; aage predictions/AI aayega.

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Framework:** Express 4
- **Auth:** JWT (stateless) + bcrypt password hashing
- **Database:** **MongoDB (Mongoose)** — Atlas cloud. `store.js` ke peeche abstracted.
- **AI provider:** config-driven (`AI_PROVIDER`) — abhi **Gemini** (free). Aage agent add hoga.
- **Default port:** `5000`

---

## 2. Tech stack & dependencies

| Package        | Kaam |
|----------------|------|
| `express`      | HTTP server + routing |
| `mongoose`     | MongoDB ODM (schema + queries) |
| `cors`         | Cross-origin (frontend `:3000` → API `:5000`) |
| `bcryptjs`     | Password hashing (pure-JS) |
| `jsonwebtoken` | JWT sign/verify |
| `dotenv`       | `.env` config load |
| `astronomy-engine` | Pure-JS planetary positions (chart engine, no native build) |
| `city-timezones`   | Offline geocoding: place → lat/lng/timezone |
| `helmet`           | Secure HTTP headers |
| `express-rate-limit` | Rate limiting (protects AI cost + brute-force) |
| `razorpay`         | Payments — order create + signature verify |

---

## 3. Folder structure

```
backend/
├── .env                     # Real secrets (GITIGNORED)
├── .env.example             # Template (safe to commit)
├── .gitignore
├── package.json
├── data/
│   └── users.json           # (DEPRECATED — purana file store; ab MongoDB use hota hai)
└── src/
    ├── server.js            # Entry: .env load → DB connect → server start
    ├── app.js               # Express app (middleware + routes wiring)
    ├── routes/
    │   ├── auth.js          # /api/auth/* routes
    │   └── predict.js       # /api/predict/* routes
    ├── controllers/
    │   ├── authController.js    # register / login / me
    │   └── predictController.js # basic prediction + history
    ├── middleware/
    │   ├── auth.js          # requireAuth — Bearer token verify
    │   └── rateLimit.js     # general / auth / predict rate limiters
    ├── models/
    │   ├── User.js          # Mongoose User schema (birth details)
    │   └── Prediction.js    # saved predictions (history)
    └── lib/
        ├── db.js            # MongoDB connection (+ DNS override)
        ├── store.js         # Data layer (users + predictions)
        ├── token.js         # JWT sign/verify + publicUser()
        ├── validate.js      # Input validation
        ├── geocode.js       # place name → lat/lng/timezone (offline)
        ├── aiClient.js      # provider-abstract AI (Gemini) — aiGenerate()
        └── astro/
            ├── constants.js # rashis, nakshatras, planets, helpers
            ├── chart.js     # sidereal chart engine (computeChart, siderealSunMoon)
            └── panchang.js  # real-time panchang (computePanchang)
```
Routes/controllers also include `panchang.js` (public `/api/panchang`).

### File-by-file

- **`src/server.js`** — `.env` load → `connectDB()` (fail hua to exit) → `createApp()` → listen.
- **`src/app.js`** — `createApp()`: CORS, JSON parser, `/api/health`, `/api/auth`, 404 + error handler.
- **`src/lib/db.js`** — `connectDB()`: Mongoose se Atlas connect. `MONGODB_URI` use karta hai;
  agar `DNS_SERVERS` set ho to public DNS set karta hai (SRV lookup fix).
- **`src/models/User.js`** — Mongoose `User` schema (`name`, `email` unique, `passwordHash`, timestamps).
- **`src/lib/store.js`** — user CRUD (`getUserByEmail`, `getUserById`, `createUser`). Plain
  objects `{ id, name, email, passwordHash, createdAt }` return karta hai (`_id` → `id`).
  **DB change karna ho to sirf yahi file.**
- **`src/controllers/authController.js`** — `register`, `login`, `me`.
- **`src/middleware/auth.js`** — `requireAuth`: Bearer token verify → `req.userId`.
- **`src/lib/token.js`** — `signToken`, `verifyToken`, `publicUser` (response se `passwordHash` hataata).
- **`src/lib/validate.js`** — `validateRegister`, `validateLogin`.
- **`src/lib/geocode.js`** — `geocodePlace(name)` → `{ lat, lng, timezone }` (offline dataset).
- **`src/lib/astro/chart.js`** — `computeChart(birth)` → sidereal (Lahiri) chart: planets'
  rashi + nakshatra, Moon/Sun sign, and Lagna (if birth time + place known). Pure JS.
- **`src/lib/aiClient.js`** — `aiGenerate({system, prompt, json})` → Gemini (provider via `AI_PROVIDER`).
- **`src/controllers/predictController.js`** — `basicPrediction`: user → geocode (cache on user)
  → chart → grounded Gemini prompt → structured JSON → save history. `history`: past predictions.
- **`src/models/Prediction.js`** — saved `{ userId, type, input, chart, prediction }`.

---

## 4. Data model

**Collection `users`** (MongoDB, `astroveda` db). Registration ab **birth details**
bhi capture karta hai taaki signup ke turant baad ek basic prediction ban sake.

```js
{
  _id: ObjectId,            // API mein "id" (hex string)
  name: String,             // required
  email: String,            // required, unique, lowercase, indexed
  passwordHash: String,     // bcrypt hash — kabhi client ko nahi jaata
  gender: "male"|"female"|"other",
  birth: {
    date: Date,             // date of birth
    time: String|null,      // "HH:MM" (24h); null agar unknown
    timeKnown: Boolean,
    place: {
      name: String,         // "City, Country"
      lat: Number|null,     // geocoding se baad mein bharenge
      lng: Number|null,
      timezone: String|null // e.g. "Asia/Kolkata"
    }
  },
  profile: { phone: String, avatarUrl: String|null },
  credits: Number,          // paid kundli credits (free tier = first 3, then packs)
  subscription: { plan: "free"|"silver"|"gold"|"platinum", status, startedAt, expiresAt },
  createdAt: Date, updatedAt: Date   // timestamps: true
}
```

> `lat`/`lng`/`timezone` abhi `null` — accurate Lagna ke liye chart engine ke saath
> geocoding se bharenge (Phase 1 next). Basic prediction DOB + place se ban jaayegi.

- `email` unique + lowercase → case-insensitive, duplicate guard.
- `store.js` `_id` ko `id` (string) mein convert karke deta hai; `publicUser` `passwordHash` hataata hai.

---

## 5. Environment variables (`.env`)

| Var              | Kaam |
|------------------|------|
| `PORT`           | Server port (default 5000) |
| `JWT_SECRET`     | JWT sign key. **Production mein badlo.** |
| `JWT_EXPIRES_IN` | Token validity (default `7d`) |
| `CLIENT_ORIGIN`  | CORS allowed origin(s), comma-separated; `*` = allow all |
| `MONGODB_URI`    | Atlas connection string (db naam `astroveda` include) |
| `MONGODB_DB`     | DB name (`astroveda`) |
| `DNS_SERVERS`    | Optional. Public DNS (e.g. `8.8.8.8,1.1.1.1`) agar local resolver SRV refuse kare |
| `AI_PROVIDER`    | `gemini` \| `groq` \| `ollama` \| `anthropic` |
| `AI_MODEL`       | Model id (e.g. `gemini-3.6-flash`) |
| `GEMINI_API_KEY` | Gemini free key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay payment keys (test/live) |

`.env` gitignored; `.env.example` copy karke banao.

> **DNS note:** Kuch machines ka local resolver (`127.0.0.1`) `mongodb+srv://` ke SRV
> lookup ko refuse karta hai (`querySrv ECONNREFUSED`). `DNS_SERVERS=8.8.8.8,1.1.1.1`
> set karne se fix ho jaata hai.

---

## 6. API Reference

Base URL: `http://localhost:5000`

### `GET /api/health` → `{ ok, service, time }`

### `GET /api/plans`  (public)
Subscription plans + one-time credit packs.
```jsonc
// 200 → { plans: [ {id,name,price,period,monthlyKundli,popular,tagline,features[]} ],
//         packs: [ {id,name,credits,price} ] }
```

### `POST /api/payment/order`  🔒  (Razorpay)
```jsonc
// body: { kind: "pack"|"plan", itemId: "pack10"|"gold"|... }
// 200 → { orderId, amount, currency, keyId, name }   // keyId = public Razorpay key
```

### `POST /api/payment/verify`  🔒
Verifies the checkout signature (HMAC), then grants credits (pack) or activates the plan.
```jsonc
// body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, kind, itemId }
// 200 → { ok:true, credits?, subscription?, user }
// 400 → signature verification failed
```

### `POST /api/auth/register`
```jsonc
// body:
// { name, email, password, phone, gender,
//   dateOfBirth: "YYYY-MM-DD", timeOfBirth: "HH:MM" (optional), placeOfBirth: "City, Country" }
// 201 → { token, user: { id, name, email, gender, birth{...}, profile{phone}, createdAt } }
// 422 → { error: "Validation failed", fields: { dateOfBirth, phone, ... } }
// 409 → { error: "An account with this email already exists." }
```
Validation: name≥2, valid email, password≥6, phone 10–15 digits, gender required,
dateOfBirth required (valid, not future), timeOfBirth optional (HH:MM), placeOfBirth required.

### `POST /api/auth/login`
```jsonc
// body: { email, password }
// 200 → { token, user }
// 401 → { error: "Invalid email or password." }
```

### `GET /api/auth/me`  🔒 (`Authorization: Bearer <token>`)
```jsonc
// 200 → { user }
// 401 → { error: "Invalid or expired token." }
```

### `POST /api/predict/basic`  🔒
Uses the logged-in user's stored birth details. Geocodes the birth place (caches
lat/lng/timezone on the user), computes the sidereal chart, and asks the AI agent
(grounded on the chart) for a basic reading. Saves it to history.
```jsonc
// 200 → {
//   id,
//   chart: { meta, lagna, moonSign, sunSign, planets{ sun,moon,mars,... } },
//   prediction: { headline, summary, personality, love, career, health,
//                 luckyNumber, luckyColor, luckyDay, remedy, disclaimer }
// }
//   returns also: freeLeft, credits
// 400 → birth details missing   • 502 → AI failed   • 500 → chart failed
// 402 → free limit reached (3 free kundlis used, no paid credits) → { code:"PAYMENT_REQUIRED", freeLimit, used }
// 429 → rate limit (20 predictions / hour per user)
```
**Free tier:** first **3** AI kundlis free per user; then a paid **credit** is consumed
(bought via packs — payment gateway pending). Homepage `POST /api/chart` (compute-only) stays free.

### `GET /api/predict/history`  🔒
```jsonc
// 200 → { predictions: [ { id, type, chart, prediction, createdAt } ] }
```

### `POST /api/chart`  (public, compute-only — no AI, no login)
Real-time Vedic chart from birth details. Powers the homepage "Free Kundli" preview.
```jsonc
// body: { dateOfBirth: "YYYY-MM-DD", timeOfBirth?: "HH:MM", placeOfBirth?: "City, Country" }
// 200 → { chart: { lagna, moonSign, sunSign, planets{...} }, place }
// 422 → { error: "Validation failed", fields: { dateOfBirth } }
```

### `GET /api/rashifal/:sign`  (public, AI + daily cache)
Today's AI-generated daily horoscope for a sign (aries…pisces). Cached per sign per day
(MongoDB) so Gemini is called at most once/sign/day. No login, free.
```jsonc
// 200 → { sign, date, source:"ai"|"cache", rashifal: {
//   overall, love, career, health, finance,
//   lucky:{number,color,time}, mood, ratings:{love,career,health} } }
// 404 → unknown sign   • 502 → AI failed
```

### `GET /api/panchang`  (public, real-time)
Computes today's (or `?date=`) panchang for a location from real Sun/Moon positions.
```jsonc
// query: ?place=Jaipur,India  OR  ?lat=&lng=&tz=   (optional ?date=YYYY-MM-DD)
// 200 → { panchang: { date, location, vaara, tithi, nakshatra, yoga, karana,
//                     sunrise, sunset, rahuKaal, abhijitMuhurat } }
```

---

## 7. Auth flow

```
Register/Login → bcrypt hash/compare → signToken({sub:user.id}) → JWT (7d)
Client saves token → sends "Authorization: Bearer <token>" → requireAuth → req.userId → controller
```
Stateless; password kabhi plain store/return nahi hota.

---

## 8. Run karna

```bash
cd backend
npm install
npm run dev          # auto-reload → http://localhost:5000
# ya: npm start
```
Startup pe dikhega: `🗄️ MongoDB connected → db "astroveda"` + `🔮 ... running`.

Test:
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@t.com","password":"secret123"}'
```

---

## 9. Features — status

| Feature | Status | Notes |
|---------|--------|-------|
| Health check | ✅ Done | |
| Register / Login / Me | ✅ Done | JWT + bcrypt |
| **Registration with birth details + phone** | ✅ Done | gender, DOB, time, place, phone stored |
| Input validation + duplicate guard | ✅ Done | |
| CORS | ✅ Done | |
| **MongoDB (Mongoose)** | ✅ Done | Atlas, `users` collection |
| AI provider config | ✅ Done | Gemini key set + verified (`gemini-3.6-flash`) |
| **Geocoding (offline)** | ✅ Done | place → lat/lng/timezone, cached on user |
| **Chart engine (sidereal/Lahiri)** | ✅ Done | pure-JS (astronomy-engine); planets, rashi, nakshatra, Lagna |
| **AI agent — basic prediction** | ✅ Done | `POST /api/predict/basic` (chart-grounded Gemini) + history |
| **Security: helmet + rate limiting** | ✅ Done | general 300/15m, auth 40/15m, predict 20/hr per user |
| **AI Daily Rashifal** | ✅ Done | `GET /api/rashifal/:sign` — Gemini, cached per sign/day, public/free |
| **Real-time Panchang** | ✅ Done | `GET /api/panchang` — live tithi/nakshatra/yoga/karana/sunrise/sunset/rahu-kaal |
| **Public real-time chart** | ✅ Done | `POST /api/chart` — homepage Free Kundli preview (compute-only, no AI/login) |
| **Free-3 quota + credits** | ✅ Done | 3 free AI kundlis/user; 402 + paywall after; `credits` field for paid packs |
| **Subscription plans (multiple)** | ✅ Done | free/silver/gold/platinum; `GET /api/plans`; quota is plan-aware (Silver 30/mo, Gold/Platinum unlimited) |
| **Payments (Razorpay)** | ✅ Done | order + verify; packs (₹100/10) → credits, plans → subscription. Test keys verified |
| Kundli PDF/print + send (email/WhatsApp) | ⏳ Planned | |
| Talk-to-Pandit (per-astrologer pricing, chat, share) | ⏳ Planned | |
| Kundli Milan / matching | ⏳ Planned | |
| More prediction types (love/career/…) | ⏳ Planned | reuse `predict` pattern |
| Rahu/Ketu true node, divisional charts | ⏳ Planned | v1 uses mean node |
| Payments / wallet | ⏳ Planned | |
| Password reset / email verify | ⏳ Planned | |
| Rate limiting / refresh tokens | ⏳ Planned | |

---

## 10. Next steps

1. **Frontend UI** — birth data se prediction dikhane wala page (result cards + history).
2. **More prediction types** — `love`, `marriage`, `career` (same pipeline, alag prompt).
3. **Kundli Milan** — `POST /api/match` (2 charts, Ashtakoot 36 guna).
4. **Accuracy upgrades** — true Rahu/Ketu, divisional charts (D9/D10), precise geocoder.
5. Har feature ke baad ye doc update.

---

_Last updated: geocoding + sidereal chart engine + basic AI prediction (chart-grounded) done._
