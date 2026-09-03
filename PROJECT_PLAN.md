# AstroVeda — Master Project Plan (Hybrid AI Prediction Platform)

> **Living planning doc.** Vision, **hybrid model** architecture, **saari prediction types**
> (DOB se), aur AI agent strategy. Implementation docs: `./BACKEND.md` (this repo) ·
> `frontend-astro/FRONTEND.md` (frontend repo). Status: **PLANNING**.

---

## 1. Vision

Ek **hybrid AI astrology platform** — user sirf **DOB + time + place** (aur naam) de,
aur system uski **poori zindagi ki predictions** de sake: kundli, shaadi, love, career,
health, wealth, sab kuch. **Hybrid = real astrology compute (accurate) + AI (personalized
language)**. Ek DOB se ek baar poora chart banega, phir us par **koi bhi prediction** ban sakegi.

---

## 2. The Hybrid Model (dil of the platform)

```
                         ┌──────────────────────────────┐
  DOB + Time + Place ──▶ │  COMPUTE ENGINE (accurate)    │  ← maths, hallucination nahi
                         │  Swiss Ephemeris:             │
                         │  • Kundli (D1) + divisional   │
                         │    charts (D9, D10, D7…)       │
                         │  • Planets, houses, aspects    │
                         │  • Dashas, transits            │
                         │  • Yogas + Doshas              │
                         └───────────────┬───────────────┘
                                         │  structured chart JSON
                                         ▼
                         ┌──────────────────────────────┐
   "kaunsi prediction?"  │  PREDICTION ROUTER           │  ← relevant factors nikaalta hai
   (love/career/…)  ───▶ │  domain ke hisaab se houses,  │
                         │  planets, dasha select        │
                         └───────────────┬───────────────┘
                                         │  focused context + RAG rules
                                         ▼
                         ┌──────────────────────────────┐
                         │  AI AGENT (Claude)           │  ← samajhta + likhta hai
                         │  domain-expert prompt + rules │
                         │  → personalized prediction    │
                         └───────────────┬───────────────┘
                                         ▼
                          Structured JSON → Frontend (cards/report)
```

**Golden rule:** AI kabhi planet position "guess" nahi karta — wo compute engine deta hai.
AI sirf us pakke data ko insaani, personalized bhasha mein prediction banata hai.

---

## 3. Ek DOB se kya-kya compute hota hai (ek baar, phir reuse)

| Cheez | Kya | Kis prediction mein kaam aata |
|-------|-----|-------------------------------|
| **Lagna / Ascendant** | Birth ke waqt uगता rashi | Personality, poori kundli ki base |
| **Rashi (Moon sign)** | Chandra rashi | Mann, emotions, rashifal |
| **Sun sign / Nakshatra** | Surya rashi, janma nakshatra | Core nature, dasha calc |
| **D1 Janma Kundli** | Main birth chart (12 houses) | Sab kuch |
| **Divisional charts (Vargas)** | D9 Navamsa (shaadi), D10 (career), D7 (santaan), D2 (dhan), D12 (parents), D24 (padhai)… | Domain-specific depth |
| **Planet positions + houses + aspects** | 9 grahas kaha, kaunse bhaav mein | Har prediction |
| **Yogas** | Raj yoga, Dhan yoga, Gajakesari… | Success, wealth, fame |
| **Doshas** | Mangal, Kaal Sarp, Pitra, Sade Sati | Warnings + remedies |
| **Vimshottari Dasha** | Mahadasha/Antardasha timeline | **Timing** ("kab hoga") |
| **Transits (Gochar)** | Abhi grah kaha chal rahe | Current/future forecast |
| **Ashtakavarga** | Strength points | Kis area mein bal kam/zyada |

> Ye sab **ek user ka "chart profile"** ban jaata hai (DB mein cache) — har prediction isi se banti hai.

---

## 4. 📜 Saari Prediction Types (jitni bhi hoti hain)

### A. Personality & core
| Prediction | Kis se banta |
|-----------|--------------|
| Swabhav / personality report | Lagna + Moon + Sun |
| Strengths & weaknesses | Yogas, planet strength |
| Lucky number / colour / day / direction | Astrology + numerology |

### B. Career & money
| Prediction | Kis se |
|-----------|--------|
| Career guidance (best field) | 10th house, D10, Saturn/Mercury |
| Job vs Business | 10th/7th, dasha |
| Career timing (promotion/change) | Dasha + transit |
| Wealth & finance | 2nd, 11th house, D2 |
| Sudden gains / losses | Rahu/Ketu, 11th/8th |
| Property & vehicles | 4th house |
| Foreign settlement / travel | 12th, 9th, Rahu |

### C. Marriage & relationships
| Prediction | Kis se |
|-----------|--------|
| **Shaadi prediction** (kab hogi) | 7th house, D9, Venus/Jupiter, dasha |
| Spouse nature & direction | 7th lord, D9 |
| Married life quality | 7th, Venus, Mangal dosha |
| **Love prediction** | Venus, Mars, 5th/7th house |
| **Kundli Milan / Guna Milan (36)** | Ashtakoot — 2 charts |
| Love compatibility (synastry) | Dono charts ka interplay |
| Mangal dosha check + remedy | Mars placement |
| Reconciliation / breakup timing | Dasha + transit |

### D. Family & children
| Prediction | Kis se |
|-----------|--------|
| Children / santaan yog | 5th house, D7, Jupiter |
| Relationship with parents | 4th, 9th, D12 |
| Family harmony | 2nd, 4th |

### E. Health
| Prediction | Kis se |
|-----------|--------|
| Health vulnerabilities | 6th, 8th, lagna lord |
| Disease timing / caution periods | Dasha + transit |
| Longevity (aayu) | 8th house, lagna |
| Mental peace | Moon, 4th |

### F. Education
| Prediction | Kis se |
|-----------|--------|
| Education & studies | 4th, 5th, D24, Mercury/Jupiter |
| Higher studies / abroad | 9th, 12th |
| Competitive exam yog | Mercury, dasha |

### G. Timing / periodic (rashifal)
| Prediction | Kis se |
|-----------|--------|
| Daily / weekly / monthly / yearly horoscope | Moon sign + transits |
| **Dasha phal** (har period ka result) | Vimshottari dasha |
| **Sade Sati** report | Saturn transit over Moon |
| Jupiter/Saturn transit effects | Gochar |
| Annual chart (Varshphal) | Solar return |
| Muhurat (shubh time for event) | Panchang + transit |

### H. Doshas & remedies
| Prediction | Kis se |
|-----------|--------|
| Mangal / Kaal Sarp / Pitra dosha | Chart |
| Gemstone recommendation | Lagna + weak/benefic planets |
| Rudraksha / mantra / yantra | Planet remedies |
| Lal Kitab remedies | Lal Kitab system |

### I. Occult / adjacent (naam + DOB se)
| Prediction | Kis se |
|-----------|--------|
| Numerology (life path, destiny, name no.) | DOB + naam |
| KP astrology predictions | KP system |
| Nameology / baby names | Nakshatra + numerology |
| Tarot reading | Cards (not DOB) |
| Palmistry | Hand image (not DOB) |

### J. Bundled reports (paid, high value)
Life Report (full) · Career Report · Marriage Report · Love Report · Health Report ·
Finance Report · Year-Ahead 2026 · Couple Compatibility Report.

---

## 5. Hybrid engine har prediction ko kaise serve karta hai

**Ek generic flow, har prediction ke liye reuse:**
1. User ka **chart profile** compute/fetch (Section 3).
2. **Prediction router** domain ke relevant factors chunta hai (e.g. shaadi → 7th, D9, Venus, dasha).
3. **RAG** us domain ke classical rules retrieve karta hai.
4. **AI agent** (domain prompt + factors + rules) → structured prediction.
5. Validate (JSON schema) → guardrails → UI.

Isliye **naya prediction add karna = naya domain template + rules**, poora system dobara nahi banana.

---

## 6. AI Agent strategy (one → many, aur "training")

| Stage | Setup | Kab |
|-------|-------|-----|
| **1. One smart agent** | Ek Claude agent + **per-domain prompt templates** + chart grounding | MVP — sabse fast |
| **2. RAG per domain** | Har domain (love, career…) ka apna rules knowledge base | Authenticity ke liye |
| **3. Specialized sub-agents** | High-value domains (Love 💘, Marriage 💍, Career 💼) ke **dedicated agents** — apna prompt + RAG | Grow phase |
| **4. Fine-tune + eval** | User ratings + astrologer-approved readings → dataset → fine-tune + eval harness | Scale — "hamara trained model" |

Orchestrator (router) decide karta hai kaunsa agent chalega. Ye **multi-agent** design scalable hai.

---

## 7. System architecture

```
Frontend (Next.js)
     │ JSON
     ▼
Backend API (Express)
  • auth  • prediction service  • payments  • astrologer chat  • admin
     │                 │
     ▼                 ▼
Chart Engine      AI Agent service (Claude) + RAG vector DB
(Swiss Ephemeris)      │
     └────────┬────────┘
              ▼
     Database (MongoDB): users, chart_profiles, predictions, couples, payments
```

---

## 8. Data model (planned)

- **users** — auth + profile.
- **chart_profiles** — ek user ka poora computed chart (cache; recompute avoid).
- **predictions** — `{ userId, type, inputRefs, agentOutput, rating?, paid, createdAt }`.
- **couples** — partner details + chart ref (matching ke liye).
- **agent_knowledge** — per-domain vector-embedded rules (RAG).
- **payments** — orders, wallet, subscriptions.

---

## 9. API design (planned)

| Method & path | Kaam |
|---------------|------|
| `POST /api/chart` | DOB → full chart profile (compute + cache) |
| `POST /api/predict/:type` | Generic: `type` = love / marriage / career / health / finance / dasha / … |
| `POST /api/match` | Kundli Milan (2 charts) |
| `POST /api/report/:kind` | Paid bundled report |
| `GET  /api/predictions` | User history |

Ek generic `predict/:type` endpoint → saare prediction types ek pattern se.

---

## 10. Tech stack (planned)

| Layer | Choice |
|-------|--------|
| AI agent | **Claude API** (Opus/Sonnet) |
| Chart engine | **Swiss Ephemeris** (node lib / microservice) |
| Knowledge base | **Vector DB** (Mongo Atlas Vector / Qdrant) |
| Database | **MongoDB** |
| Payments | Razorpay / Stripe |
| Real-time chat | Socket.IO |

---

## 11. Monetization (decided model)

1. **Free tier: 3 kundlis per user.** Uske baad AI kundli banane ke liye pay karna hoga.
   (Homepage ka quick chart preview — compute-only, no AI — free rehta hai.)
2. **Kundli packs (payment gateway):** e.g. **₹100 = 10 kundli**. Credits user account
   mein add hote hain; har AI kundli 1 credit khaati hai. Gateway: **Razorpay** (India).
3. **Delivery add-ons:** generate + **send** (email/WhatsApp) + **print/PDF download** option.
4. **Talk to Pandit ji:** famous/verified astrologers se **direct chat/call**, unke saath
   **kundli share**. Har pandit ka **alag charge** (per-min ya per-session). Platform commission.
5. (Later) subscription, shop (gemstone/remedies/yantra).

### Build order
- ✅/🔜 **Free-3 quota** (backend counts predictions; 4th pe paywall) — foundation, no keys needed.
- 🔜 **Razorpay integration** — order create + verify webhook → credits add. (Razorpay keys chahiye.)
- 🔜 **PDF/print** of kundli + send (email/WhatsApp).
- 🔜 **Pandit module** — astrologer profiles + per-astrologer pricing + chat (Socket.IO) + kundli share.

---

## 12. Phased roadmap

| Phase | Deliverable |
|-------|-------------|
| **0 (done)** | Site + auth (JWT) |
| **1 — MVP** | MongoDB + Chart engine (kundli + core) + AI agent v1 + **3 predictions: Kundli summary, Love, Marriage** + basic paywall |
| **2 — Grow** | RAG, Career/Health/Finance/Dasha predictions, Kundli Milan, reports, payments, saved predictions dashboard |
| **3 — Scale** | Specialized agents, talk-to-astrologer chat, fine-tune + eval, remedies/shop, notifications |
| **4 — Expand** | Numerology/KP/Lal Kitab/Tarot, multi-language, mobile app |

---

## 13. Immediate next steps (build shuru karte waqt)

1. **MongoDB** set → `store.js` migrate.
2. **Chart engine** integrate (Swiss Ephemeris) → `POST /api/chart` (full profile).
3. **AI agent v1** (Claude + domain prompt + chart grounding + JSON output).
4. Pehla end-to-end: **Kundli summary + Love + Marriage** predictions.
5. Frontend: prediction forms + result cards (red theme + MUI).
6. Har step → `BACKEND.md` / `FRONTEND.md` / ye doc update.

---

_Last updated: planning phase (hybrid model, full prediction catalog). Har feature ke saath update hoga._
