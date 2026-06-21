# HackIQ — Firebase Setup Report

**Author:** GURU SAI SUMITH &nbsp;|&nbsp; **Repo:** gurusaiss/HackIQ

---

## Overview

Firebase is used for cloud persistence of user profiles and saved competitions.
The app works fully without Firebase (falls back to localStorage), but Firebase enables cross-device sync.

**Collections used:**
- `profiles` — stores user profile (doc ID: `local-user`)
- `saved_competitions` — stores saved competition items

---

## Step 1 — Create Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **Add project**
3. Project name: `hackiq` (or any name)
4. **Disable** Google Analytics (not needed)
5. Click **Create project**
6. Wait ~30 seconds → click **Continue**

---

## Step 2 — Create Firestore Database

1. Left sidebar → **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode** → click **Next**
4. Choose region: `asia-south1` (Mumbai) — or nearest to you
5. Click **Enable**
6. Wait for provisioning (~30 seconds)

---

## Step 3 — Set Security Rules

1. Inside Firestore → click the **Rules** tab
2. Delete the existing content
3. Paste the following:

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

4. Click **Publish**

> **Note:** These are open rules suitable for a no-auth portfolio app.
> When you add Firebase Auth later, update to per-user rules:
> `allow read, write: if request.auth.uid == resource.data.userId;`

---

## Step 4 — Register Web App & Get Config

1. Click the **gear icon ⚙️** → **Project settings**
2. Scroll to **Your apps** section
3. Click **`</>`** (web app icon)
4. App nickname: `hackiq-web` → click **Register app**
5. You will see a config block like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "hackiq-xxxxx.firebaseapp.com",
  projectId: "hackiq-xxxxx",
  storageBucket: "hackiq-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

6. **Copy all 6 values** — you'll need them in the next step
7. Click **Continue to console**

---

## Step 5 — Add to Local `.env`

Create or update `D:\C\CODING\Portfolio\Projects\CompleteIQ\.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=hackiq-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hackiq-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=hackiq-xxxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

> `.env` is in `.gitignore` — these values will never be committed to GitHub.

---

## Step 6 — Add to Vercel (Production)

1. Go to **[vercel.com](https://vercel.com)** → your HackIQ project
2. **Settings** → **Environment Variables**
3. Add each of the 6 Firebase variables:

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `hackiq-xxxxx.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `hackiq-xxxxx` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `hackiq-xxxxx.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `VITE_FIREBASE_APP_ID` | `1:123456789:web:abc123def456` |

4. Click **Save** → **Redeploy** (or push a new commit to trigger auto-deploy)

---

## Step 7 — Verify Connection

1. Run the app locally: `npm run dev`
2. Go to **Profile** → fill name + skills → click **Save**
3. Go to **Firebase Console** → Firestore → **Data** tab
4. You should see:

```
profiles/
  └── local-user
        ├── name: "Your Name"
        ├── skills: ["Python", "React"]
        ├── interests: [...]
        └── updated_at: ...
```

5. Save a competition on the Discover page
6. Check Firestore → `saved_competitions/` → document appears ✅

---

## How It Works in Code

**File:** `src/lib/supabase.js`

```js
// Firebase initialises only when VITE_FIREBASE_PROJECT_ID is set
function getDb() {
  if (_db) return _db
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return null  // → localStorage fallback
  const app = getApps().length ? getApps()[0] : initializeApp({ ...config })
  _db = getFirestore(app)
  return _db
}

// Every function checks getDb() before using Firestore
export async function saveProfile(profile) {
  const db = getDb()
  if (db) {
    await setDoc(doc(db, 'profiles', 'local-user'), payload)  // Firestore
  } else {
    localStorage.setItem('ciq_profile', JSON.stringify(payload))  // fallback
  }
}
```

**Singleton pattern** — `getApps().length` check prevents duplicate app initialisation on Vite HMR (hot reload).

---

## Firestore Collections Schema

### `profiles` collection
```
Document ID: local-user
Fields:
  id                  string    "local-user"
  name                string    "Guru Sai Sumith"
  skills              array     ["Python", "React", "ML"]
  interests           array     ["AI", "Web3", "Climate"]
  experience_level    string    "Mid"
  prize_preference    string    "Cash"
  location_preference string    "Global"
  updated_at          string    ISO timestamp
```

### `saved_competitions` collection
```
Document ID: competition.id (or generated ID)
Fields:
  competition_data    map       { title, prize_amount, deadline, ... }
  status              string    "Bookmarked" | "Applied" | "Won"
  saved_at            string    ISO timestamp
```

---

## Free Tier Limits (Spark Plan)

| Resource | Limit | HackIQ Usage |
|----------|-------|--------------|
| Reads | 50,000 / day | ~50 reads per active user |
| Writes | 20,000 / day | ~5 writes per active user |
| Deletes | 20,000 / day | Minimal |
| Storage | 1 GB | < 1 MB for profiles + saved items |
| Bandwidth | 10 GB / month | Negligible |

**Verdict:** Free tier is more than sufficient for portfolio/small-scale use.

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Data saves to localStorage, not Firestore | `VITE_FIREBASE_PROJECT_ID` not set in `.env` | Add the variable and restart dev server |
| `FirebaseError: Missing or insufficient permissions` | Security rules blocking write | Ensure rules say `allow read, write: if true` and click Publish |
| `Firebase: No Firebase App` error in console | `initializeApp()` called before config loaded | Check all 6 VITE_ vars are in `.env` |
| Duplicate app error on hot reload | Multiple `initializeApp()` calls | Already handled — `getApps().length` check in `getDb()` |
| Vercel deploy works but no DB sync | Env vars not added to Vercel dashboard | Add all 6 vars in Vercel → Settings → Environment Variables |

---

## Security Notes

- Firebase config values (`apiKey`, `projectId` etc.) are **safe to expose** in the browser — they only identify the project, not grant access
- **Firestore security rules** control actual data access — current open rules are fine for a no-auth app
- When adding authentication: update rules to `if request.auth != null` or per-user rules
- Never commit `.env` — it's in `.gitignore`

---

*HackIQ Firebase Setup — GURU SAI SUMITH*
