# AstroVeda — Backend Documentation

> **Living document.** Har naya backend feature yahan add karte jao. Ye file
> akela padh ke koi bhi (AI ya insaan) poora backend samajh sakta hai.
>
> Frontend docs: `../frontend-astro/FRONTEND.md` · Master plan: `../PROJECT_PLAN.md`

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
    │   └── auth.js          # /api/auth/* routes
    ├── controllers/
    │   └── authController.js# register / login / me logic
    ├── middleware/
    │   └── auth.js          # requireAuth — Bearer token verify
    ├── models/
    │   └── User.js          # Mongoose User schema
    └── lib/
        ├── db.js            # MongoDB connection (+ DNS override)
        ├── store.js         # Data layer (Mongoose). YAHIN DB abstract hai.
        ├── token.js         # JWT sign/verify + publicUser()
        └── validate.js      # Input validation
```

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

---

## 4. Data model

**Collection `users`** (MongoDB, `astroveda` db). Mongoose schema:

```js
{
  _id: ObjectId,          // API mein "id" (hex string) ban ke jaata hai
  name: String,           // required
  email: String,          // required, unique, lowercase, indexed
  passwordHash: String,   // bcrypt hash — kabhi client ko nahi jaata
  createdAt: Date,        // timestamps: true
  updatedAt: Date
}
```

- `email` unique + lowercase → case-insensitive, duplicate guard.
- `store.js` `_id` ko `id` (string) mein convert karke deta hai; `publicUser` `passwordHash` hataata hai.

---

## 5. Environment variables (`.env`)

| Var              | Kaam |
|------------------|------|
| `PORT`           | Server port (default 5000) |
| `JWT_SECRET`     | JWT sign key. **Production mein badlo.** |
| `JWT_EXPIRES_IN` | Token validity (default `7d`) |
| `CLIENT_ORIGIN`  | CORS allowed origin(s), comma-separated |
| `MONGODB_URI`    | Atlas connection string (db naam `astroveda` include) |
| `MONGODB_DB`     | DB name (`astroveda`) |
| `DNS_SERVERS`    | Optional. Public DNS (e.g. `8.8.8.8,1.1.1.1`) agar local resolver SRV refuse kare |
| `AI_PROVIDER`    | `gemini` \| `groq` \| `ollama` \| `anthropic` |
| `AI_MODEL`       | Model id (e.g. `gemini-3.6-flash`) |
| `GEMINI_API_KEY` | Gemini free key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) |

`.env` gitignored; `.env.example` copy karke banao.

> **DNS note:** Kuch machines ka local resolver (`127.0.0.1`) `mongodb+srv://` ke SRV
> lookup ko refuse karta hai (`querySrv ECONNREFUSED`). `DNS_SERVERS=8.8.8.8,1.1.1.1`
> set karne se fix ho jaata hai.

---

## 6. API Reference

Base URL: `http://localhost:5000`

### `GET /api/health` → `{ ok, service, time }`

### `POST /api/auth/register`
```jsonc
// body: { name, email, password }
// 201 → { token, user: { id, name, email, createdAt } }
// 422 → { error: "Validation failed", fields: {...} }
// 409 → { error: "An account with this email already exists." }
```

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
| Input validation + duplicate guard | ✅ Done | |
| CORS | ✅ Done | |
| **MongoDB (Mongoose)** | ✅ Done | Atlas, `users` collection |
| AI provider config | ✅ Done | Gemini key set + verified (`gemini-3.6-flash`) |
| **AI agent (predictions)** | ⏳ Next | `aiClient.js` + `/api/predict/:type` |
| Chart engine (Swiss Ephemeris) | ⏳ Planned | kundli maths |
| Kundli Milan / matching | ⏳ Planned | |
| Payments / wallet | ⏳ Planned | |
| Password reset / email verify | ⏳ Planned | |
| Rate limiting / refresh tokens | ⏳ Planned | |

---

## 10. Next steps

1. **`aiClient.js`** — provider-abstract AI client (Gemini first) + JSON output.
2. **Chart engine** — Swiss Ephemeris → `POST /api/chart` (compute + cache).
3. **Predictions** — `POST /api/predict/:type` (kundli/love/marriage first).
4. Har feature ke baad ye doc update.

---

_Last updated: MongoDB migration + AI provider config done._
