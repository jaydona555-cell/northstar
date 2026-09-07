# Northstar — Future Work

A living backlog of features and improvements. Items marked ✅ are already
shipped; the rest are ideas ordered by how much they'd move the needle.

---

## ✅ Already done (as of the hackathon build)

| Feature | Where |
|---|---|
| Community hazard map (Leaflet + Firestore) | `js/game.js` map module |
| Report + vote "not there anymore" (guests and signed-in) | `js/game.js` |
| Real-time updates via `onSnapshot` | `js/game.js` `watchHazards` |
| Live **leaderboard** (community impact) | `index.html` → `renderLeaderboard` |
| **Rewards / points** system + badges | `index.html` rewards panel |
| **Login & account** (Google sign-in, guest device ID, portfolio) | `js/game.js` auth module |
| Points merge on sign-in (guest → account) | `js/game.js` |
| Adaptive/responsive display (mobile bottom-sheet sidebar, breakpoints at 920px/640px) | `css/game.css` |
| Fullscreen map + game | `index.html` / `game.js` |
| Place search (Nominatim) + Google Maps deep links | `js/game.js` |
| One-click demo seeder (~1,000 hazards worldwide) | `js/game.js` / `seed.html` |

---

## 🗓️ Near-term ideas (biggest wins first)

### 1. Login streak + report streak
- Track consecutive days a user opens the app and/or files a report.
- Store `lastActiveDay` / `streakCount` on the user's Firestore doc (`/users/{uid}`).
- Show a 🔥 streak counter in the portfolio panel and a small daily bonus on
  the rewards tracker.
- Guests: keep streak in `localStorage` under the existing device ID; merge
  into the account doc on sign-in (same pattern as points today).

### 2. Report rewards / gamification tuning
- Bonus points for first report of the day, verified (voted-resolved) reports,
  and reports with photos/details.
- Leaderboard "week" filter (today / this week / all time).
- Badge tier unlocks (already have the 3 badges — extend the ladder).

### 3. Shop
- Spend earned points on cosmetic/utility items:
  - Custom marker color / icon on the map.
  - Custom display name colors and title flair next to your leaderboard row.
  - "Priority pin" that makes your report's marker slightly larger.
- Store purchases on the user doc; render immediately for the owner.
- Guests see the shop but get a "sign in to keep purchases" prompt.

### 4. Chatbot / agent for the website
- A small FAQ/safety assistant (rules reminders, how-to-report walkthrough).
- Two options:
  - **No-API version (recommended first):** a scripted decision-tree chatbot
    (plain JS + the existing FAQ content from `about.html`), zero cost, works
    offline.
  - **LLM version (later):** a serverless function (Cloud Functions or an
    external provider) that answers with grounding in the FAQ + rules.
- Floating chat bubble on the map view only.

### 5. Login and account functionality — more depth
- "Sign in with Google" already works; add:
  - Email/password auth as a fallback.
  - Profile editing (display name, avatar from Google).
  - **My reports** management from the portfolio (status, resolved history).
  - Export my data (JSON download) — easy win for trust.

### 6. Continuous deployment (CI/CD)
- **No CI/CD today** — deploys are manual (`npx firebase-tools deploy`).
- Add GitHub Actions so every push to `main` auto-deploys:
  ```yaml
  # .github/workflows/deploy.yml (sketch)
  on: { push: { branches: [main] } }
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: w9jds/firebase-action@v13
          with:
            args: deploy --only hosting,firestore
          env:
            GCP_SA_KEY: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
  ```
- Add a Firebase service-account JSON secret to the repo's GitHub Secrets.
- Optional: deploy to a preview channel on PRs (`--only hosting:preview`).

### 7. Adaptive display hardening
- Already responsive, but add:
  - Landscape-phone layout for the game (artwork should scale, not crop).
  - Safe-area insets (`env(safe-area-inset-*)`) for notched phones.
  - High-DPI artwork (`srcset` or `image-rendering` check) for the game scene.

---

## 🚀 Longer-term / stretch

- **Photos on reports** (Firebase Storage) + moderation queue.
- **Hazard-type auto-detection** from a photo (client-side ML or a vision API).
- **City dashboard** — resolved-rate stats per neighborhood, worst streets.
- **PWA**: manifest + service worker so the game works fully offline as an app.
- **Localization** (at least Spanish; the PNW has a large Spanish-speaking
  community).
- **School/curriculum mode** — guided lessons using the hazard game.
- **Admin console** to remove fake/abusive reports (rules already prevent
  client-side deletes, so this is the sanctioned delete path).
- **Notifications** when a reported hazard near you is resolved.

---

## Notes

- All of these work with the current architecture (single `js/game.js`,
  Firestore, no backend server) — no framework migration needed.
- The Firestore rules are intentionally **no-delete from clients**; any
  admin/moderation tooling should go through the same rules or a
  server-side path.
- Before starting a big item, check `ARCHITECTURE.md` for the code map so new
  features slot into the existing modules rather than duplicating them.