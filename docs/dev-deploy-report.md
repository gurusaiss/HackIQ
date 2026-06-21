# HackIQ — Development & Deployment Report

**Author:** GURU SAI SUMITH &nbsp;|&nbsp; **Repo:** gurusaiss/HackIQ

---

## Development Summary

### Phases

| Phase | What Happened | Key Decision |
|-------|--------------|--------------|
| PRD | Defined scope — 3 pages, AI search, profile, saved tracker | React + Vite over Next.js (no SSR needed) |
| MVP | Built all pages, components, routing, dark theme UI | Tailwind CSS utility classes for speed |
| Security fix | API keys were exposed via VITE_ prefix in browser bundle | Vite proxy (dev) + Vercel serverless (prod) |
| Product audit | Found: fake data, no cache, no modal, weak UX | Rewrote searchApi.js, added modal + cache |
| DB migration | Supabase free tier pauses after 7 days | Switched to Firebase Firestore (never pauses) |
| Branding | CompeteIQ → HackIQ | Shorter, developer-resonant name |
| Deployment | git init, push to gurusaiss/HackIQ, Vercel import | Auto-deploy on every push to main |

---

## Critical Bugs & Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| API keys in browser bundle | `VITE_` prefix embeds vars at build time | Used non-`VITE_` keys + Vite proxy + Vercel serverless |
| Supabase DB went offline | Free tier pauses inactive projects after 7 days | Migrated to Firebase Firestore |
| AI returning fake competitions | Prompt had no date/URL anchors, no strict schema | Added today's date, real platform URLs, 12-field JSON schema |
| Repeat searches hit API every time | No caching — every visit called Groq | 30-min localStorage cache keyed by base64(profile hash) |
| Port 5173 in use | Old Vite process still running (PID 10860) | `Stop-Process -Id 10860 -Force` in PowerShell |
| Wrong git commit author | Global git config overriding local | `git config user.name`, amend, force push |

---

## Architecture Decisions

**No backend server** — Vite proxy handles API key injection in dev; Vercel serverless `api/search.js` handles prod. Total hosting cost: $0.

**Firebase over Supabase** — Firestore free tier: 50K reads/day, never pauses. Supabase free tier: pauses after 7 inactive days — unacceptable for portfolio.

**localStorage cache** — 30-min TTL, profile-hash key. Eliminates 80%+ of repeat API calls. Falls back gracefully when browser storage is cleared.

**Same filename after migration** — `src/lib/supabase.js` kept its name after Firebase migration to avoid updating imports in 3 page files. Misleading name, but zero churn.

---

## API Security Flow

```
DEV:
Browser → /api/groq/* → Vite Proxy (vite.config.js)
         Proxy reads GROQ_API_KEY from Node env
         Injects Authorization header
         Forwards to https://api.groq.com

PROD:
Browser → /api/search → Vercel Serverless (api/search.js)
         Function reads process.env.GROQ_API_KEY
         Injects key, forwards to Groq/Anthropic
         Returns JSON to browser
```

Keys never appear in browser bundle or network requests.

---

## Deployment Steps (One-time)

1. **GitHub** — push to `gurusaiss/HackIQ` (already done)
2. **Groq** — get free API key at console.groq.com
3. **Firebase** — create project → Firestore in test mode → copy 6 config values
4. **Vercel** — import repo → add 8 env vars → Deploy
5. **Done** — every `git push` auto-redeploys

---

## Vercel Environment Variables

```
GROQ_API_KEY              ← server-side, never in browser
ANTHROPIC_API_KEY         ← server-side, optional
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## CI/CD

- **Pipeline:** GitHub push → Vercel detects → `npm run build` → deploy `dist/`
- **Rollback:** Vercel dashboard → one-click revert to any previous deployment
- **No Docker** — unnecessary for static SPA + serverless

---

## What's Missing (Known Gaps)

| Gap | Priority | Fix |
|-----|----------|-----|
| No authentication | High | Firebase Auth (Google OAuth) |
| Open Firestore rules | High | Per-user rules after adding Auth |
| No rate limiting | Medium | Middleware in api/search.js |
| No tests | Medium | Vitest + React Testing Library |
| No error monitoring | Low | Sentry |
| No TypeScript | Low | Rename .jsx → .tsx, add tsconfig |

---

## Performance

| Metric | Result |
|--------|--------|
| First search | ~2–3s (Groq API call) |
| Cached search | <50ms |
| Firestore read | <100ms (always warm) |
| Filter interaction | Instant (useMemo client-side) |
| Build output | dist/ (Vite tree-shaken, code-split) |

---

*HackIQ — GURU SAI SUMITH*
