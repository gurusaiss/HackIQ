# HackIQ — AI-Powered Competition Discovery Platform

> Discover hackathons and competitions personalised to your skills. Scored, filtered, and tracked — all in one place.

**GitHub:** [gurusaiss/HackIQ](https://github.com/gurusaiss/HackIQ) &nbsp;|&nbsp; **Author:** GURU SAI SUMITH

---

## What It Does

HackIQ uses Groq AI (llama-3.3-70b) to search competitions across Devpost, Kaggle, HackerEarth, Unstop and more — then scores each one 0–100 based on your skill profile. No more manually checking 5+ platforms.

---

## Features

| Feature | Description |
|---------|-------------|
| AI Competition Search | Groq AI returns 12–15 personalised competitions per search |
| Match Score (0–100) | 40% skills + 30% interests + 20% experience + 10% location |
| 30-min Cache | Results cached in localStorage, keyed by profile hash |
| Competition Modal | Full detail view — prize, deadline, skills, share, apply |
| Filter Sidebar | Category, prize range, deadline, match%, remote, team size |
| Saved Tracker | Bookmarked → Applied → Won pipeline |
| Firebase Sync | Cloud persistence with localStorage fallback |
| API Key Security | Keys never reach the browser (Vite proxy + Vercel serverless) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 6 + Tailwind CSS 3 |
| Routing | React Router v6 |
| Database | Firebase Firestore (localStorage fallback) |
| AI — Primary | Groq API (llama-3.3-70b-versatile) |
| AI — Secondary | Anthropic Claude (web_search tool) |
| Deployment | Vercel (static + serverless functions) |
| Icons | lucide-react |

---

## Architecture

```
Browser (React SPA)
    │
    ├── Dev:  /api/* → Vite Proxy → injects GROQ_API_KEY → Groq API
    └── Prod: /api/* → Vercel Serverless (api/search.js) → injects key → Groq API

Firebase Firestore ←→ src/lib/supabase.js ←→ Pages
        ↕ (fallback)
    localStorage
```

**Key design:** No dedicated backend server. API key security is handled by Vite's dev proxy and a Vercel serverless function in production — zero keys in the browser bundle.

---

## Project Structure

```
HackIQ/
├── api/
│   └── search.js           ← Vercel serverless (prod API key injection)
├── src/
│   ├── pages/
│   │   ├── Discover.jsx    ← Main search + filter page
│   │   ├── Profile.jsx     ← User profile form
│   │   └── Saved.jsx       ← Saved competitions tracker
│   ├── components/
│   │   ├── CompetitionCard.jsx
│   │   ├── CompetitionModal.jsx
│   │   ├── FilterSidebar.jsx
│   │   ├── MatchScoreRing.jsx
│   │   ├── Navbar.jsx
│   │   ├── SkeletonCard.jsx
│   │   ├── TagInput.jsx
│   │   └── Toast.jsx
│   ├── hooks/
│   │   └── useToast.jsx
│   ├── lib/
│   │   ├── supabase.js     ← Firebase Firestore client
│   │   └── searchApi.js    ← AI search, cache, scoring
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── docs/
│   ├── master-report.html  ← Full interview/viva report
│   └── dev-deploy-report.md
├── .env.example
├── vite.config.js
└── package.json
```

---

## Local Setup

### 1. Clone & install
```bash
git clone https://github.com/gurusaiss/HackIQ.git
cd HackIQ
npm install
```

### 2. Create `.env`
```env
# Required for live AI search
GROQ_API_KEY=gsk_...

# Optional — enables real web search
ANTHROPIC_API_KEY=sk-ant-...

# Optional — Firebase cloud sync (falls back to localStorage)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Run
```bash
npm run dev
# → http://localhost:5173
```

> **No API keys?** The app still works — 12 demo competitions load as fallback.

---

## Firebase Setup

1. [console.firebase.google.com](https://console.firebase.google.com) → New project
2. Firestore Database → Create → **Start in test mode**
3. Rules tab → paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
4. Project Settings → Your apps → Web → copy the 6 config values → paste into `.env`

---

## Deploy to Vercel

1. [vercel.com](https://vercel.com) → Add New Project → Import `HackIQ` from GitHub
2. Framework: **Vite** (auto-detected)
3. Add environment variables (same as `.env` — all 8 vars)
4. Deploy

Every `git push origin main` auto-redeploys.

---

## Environment Variables Reference

| Variable | Prefix | Required | Purpose |
|----------|--------|----------|---------|
| `GROQ_API_KEY` | none | Yes (for AI) | Groq API — server-side only |
| `ANTHROPIC_API_KEY` | none | No | Anthropic web search — server-side only |
| `VITE_FIREBASE_API_KEY` | VITE_ | No | Firebase browser init |
| `VITE_FIREBASE_AUTH_DOMAIN` | VITE_ | No | Firebase browser init |
| `VITE_FIREBASE_PROJECT_ID` | VITE_ | No | Firebase browser init |
| `VITE_FIREBASE_STORAGE_BUCKET` | VITE_ | No | Firebase browser init |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | VITE_ | No | Firebase browser init |
| `VITE_FIREBASE_APP_ID` | VITE_ | No | Firebase browser init |

> Non-`VITE_` keys are loaded by Vite's config but never embedded in the browser bundle.

---

## Key Commands

```bash
npm run dev      # dev server (localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview production build locally
git push origin main  # push + auto-deploy to Vercel
```

---

## How Match Scoring Works

```
computeMatchScore(competition, profile):
  skills overlap    → up to 40 pts
  interests match   → up to 30 pts
  experience level  → up to 20 pts
  location pref     → up to 10 pts
  ─────────────────────────────────
  Total             → 0 – 100
```

Scores are colour-coded: green (≥70%), amber (40–69%), red (<40%).

---

## Docs

- [`docs/master-report.html`](docs/master-report.html) — Full interview/viva/resume report (15 sections + 7 deliverables, 90 mock questions)
- [`docs/dev-deploy-report.md`](docs/dev-deploy-report.md) — Development & deployment summary
- [`.env.example`](.env.example) — All environment variables with Firestore security rules

---

*Built by GURU SAI SUMITH*
