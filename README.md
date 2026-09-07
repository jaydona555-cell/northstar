# Northstar

**Repository:** https://github.com/jaydona555-cell/northstar

Northstar is a public-safety web app with two parts sharing one page:

- A **community hazard map** where people can report road hazards, see reports clustered on a Leaflet map, sort them by distance, and vote when a hazard is no longer present.
- A **Hazard Hunt game** — an interactive "can you spot the hazards?" challenge built on an illustrated city scene.

Both live in the same `index.html` and are served from a single Firebase Hosting site at **https://northstar-c7201.web.app/** (mirrored at https://northstar-c7201.firebaseapp.com/).

## Docs

- `ARCHITECTURE.md` — deep dive: runtime topology, Firestore data model, a line-numbered code map of `js/game.js`, end-to-end flows, and the security model.
- `INTERVIEW_PREP.md` — judge Q&A plus DevTools live-coding drills (line-by-line change exercises).
- `FUTURE_WORK.md` — backlog of ideas: streaks, shop, chatbot, CI/CD, and more (with what's already done).

## Feature split

The repo now contains two separate experiences that coexist on the same page:

### Community hazard map

- Reports hazards on an interactive **Leaflet** map using OpenStreetMap tiles.
- Stores reports in **Firestore** (`/hazards` collection) and reads them in real time with `onSnapshot`, so every connected client sees new and updated reports instantly.
- Sorts hazards by distance when browser geolocation is available, using a haversine calculation and a live GPS watch.
- Lets **anyone — guest or signed-in — report hazards**: choose a preset type (Pothole, Crash, Road block, Other) or enter a custom hazard, optionally add details, and click the map to choose a location.
- Lets **anyone vote "not there anymore"** (guests get a persistent device ID). Each vote increments `notThereVotes` in a Firestore transaction. A hazard is marked `resolved` and removed from the UI when it reaches the required threshold (`3 + activeVotes`), so more active agreement means more votes are needed to remove it.
- Marker size grows with active agreement, capped at a maximum radius.
- Each marker popup links to **Google Maps** for the hazard location.
- Includes a **Nominatim place search** bar (OpenStreetMap, no API key) to jump to restaurants/landmarks.
- Has a **collapsible closest-hazards sidebar** and a mobile-friendly layout.
- Has a **one-click demo seeder** (🧪 Seed demo data): every click adds ~1,000 demo hazards — dense near the venue/Sammamish, then scattered across Washington, US cities, and major world cities, so a demo never starts on an empty map.

Backend: **Firebase** (Hosting + Firestore + Auth/Google). All logic runs in the browser via `js/game.js`; no custom server.

### Hazard Hunt game

- Illustrated city scene (`art/unsafe-city.png`) with 19 clickable hazard markers positioned by percentage so they stay glued to the artwork at any size.
- 3-minute countdown timer, live score/found/total/accuracy HUD, progress bar, and a results screen with Play Again.
- Each discovered hazard shows a feedback card explaining what's wrong and why it matters, with severity and points.
- Sound cues for finding a hazard, time's up, completion, and UI clicks (files in `sounds/`).
- Purely client-side — no Firebase, no network, no build step.

## Quick start (local)

1. Serve the repo from its root with any static server, for example:

   ```
   python -m http.server
   ```

   Then open `http://localhost:8000`.

2. The **Hazard Hunt game** works fully offline from that static server — open the page and click Start Hunt.

3. The **community map** loads Leaflet and the Firebase SDKs from CDN, so no install is required. **Guests can report and vote immediately** (the app assigns a device ID); sign in with Google to keep points and reports across devices. The Firebase project must be reachable. Geolocation, place search (Nominatim), and audio also behave best when the page is served over HTTPS or on localhost.

## Firebase project and config

This app uses the Firebase project **northstar-c7201**.

Relevant files:

- `firebase.json` — Hosting config (site name `northstar-c7201`, public root `.`) plus Firestore config pointing at `firestore.rules` and `firestore.indexes.json`.
- `.firebaserc` — sets the default Firebase project to `northstar-c7201` for CLI commands.
- `firestore.rules` — Firestore security rules. `match /hazards/{hazardId}`: `allow read: if true`, `allow create, update: if true` (guests may report/vote; **client deletes are not allowed**). `match /users/{userId}`: each signed-in user may read/write only their own doc. Rules take effect once deployed (`firebase deploy --only firestore`).
- `firestore.indexes.json` — Firestore index config (currently empty; add indexes here if queries need them).
- `js/game.js` — contains the Firebase app config (apiKey, authDomain, projectId, etc.) used to initialize Firebase, Auth, and Firestore in the browser.

If you want to run your own copy against a different Firebase project, you would:

1. Create your own Firebase project and enable Hosting, Firestore, and Google Auth.
2. Replace the `FIREBASE_CONFIG` object in `js/game.js` with your project's web app config.
3. Update `.firebaserc` to point at your project (or use `firebase use`).
4. Deploy with `firebase deploy --only hosting,firestore`.

## Deployment

The live site is deployed to **Firebase Hosting**.

To deploy (requires the Firebase CLI and access to the `northstar-c7201` project):

```
firebase login
firebase deploy --only hosting,firestore
```

What gets deployed:

- Hosting: everything in the repo root (`index.html`, `about.html`, `404.html`, `css/`, `js/`, `art/`, `sounds/`, `favicon.svg`, etc.) except files matching the `ignore` rules in `firebase.json` (`firebase.json` itself, dotfiles, `node_modules/`).
- Firestore: the rules from `firestore.rules` and indexes from `firestore.indexes.json`.

The default 404 page (`404.html`) is a standard Firebase-generated "Page Not Found" page and is served automatically for unknown URLs.



## Repo structure

```
northstar/
├── index.html                 # main page: start screen, game, results, community map, report form
├── about.html                 # simple project overview page
├── 404.html                   # custom Firebase Hosting 404 page
├── README.md                  # this file
├── favicon.svg                # site icon
├── css/
│   └── game.css               # styles for the whole Northstar experience + shared UI
├── js/
│   └── game.js                # Hazard Hunt game state + logic (score, timer, hazards, sounds, map integration)
├── art/
│   └── unsafe-city.png        # illustrated game artwork
├── sounds/
│   ├── hazard-found.mp3       # sound when a hazard is discovered
│   ├── warning.mp3            # sound when time runs out
│   ├── complete.mp3           # sound when all hazards are found
│   └── click.mp3              # UI interaction sound
├── firebase.json              # Firebase Hosting + Firestore config
├── .firebaserc                # default Firebase project (northstar-c7201)
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore index config
├── seed.html                  # dev-only bulk seeder (superseded by the in-app seed button)
├── INTERVIEW_PREP.md          # interview study guide (Q&A + DevTools live-coding drills)
├── ARCHITECTURE.md            # deep-dive: diagrams, data model, code map
└── .gitignore                 # ignores logs, Firebase cache, node_modules, env files, etc.
```

## Development notes

- The page is a single-page app — views are shown/hidden with CSS rather than separate routes.
- The community map and the game both live in `js/game.js` (a single map module owns the Leaflet map, voting, reporting, place search, rewards, and portfolio) with styles in `css/game.css`. `index.html` pulls in that one script.
- The Firebase SDKs (app, auth, firestore, analytics) and Leaflet are loaded from CDN; no build step or bundler needed.
- Sound playback depends on browser autoplay policies; the game guards audio calls so a blocked playback doesn't crash the game.
