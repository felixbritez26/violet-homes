# Violet Homes

A mobile-first property search application built with React, Vite, Python and Flask. It implements the supplied listing-search assessment and adds account authentication, illustrative property photos, and an interactive price map.

## Quick start

Requirements: Python 3.10+, Node.js 20+ and npm. Install Pipenv if needed:

```bash
python -m pip install pipenv
```

Extract the project and open the folder containing **backend/** and **frontend/**. All commands below assume that folder is the project root. Keep the backend and frontend running in separate terminals.

### 1. Configure the map

The map uses **Leaflet** to render **CARTO Dark Matter** raster tiles. CARTO provides the background map, not property inventory. Listing coordinates and prices come from the supplied JSON file.

Request your own CARTO Basemaps API key:

https://carto.com/basemaps/apikey/

Create **frontend/.env.local**:

```env
VITE_CARTO_API_KEY=YOUR_CARTO_BASEMAPS_KEY
```

Replace the placeholder with your key. Restart Vite after changing this file. No key is included in the submission.

The updated `frontend/src/components/PropertyMap.jsx` uses this tile URL:

```javascript
const tiles = L.tileLayer(
  `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(
    import.meta.env.VITE_CARTO_API_KEY
  )}`,
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
      '&copy; <a href="https://carto.com/attribution/">CARTO</a>',
  }
).addTo(map);
```

Keep map attribution visible. A missing/invalid key, provider restriction or connection failure can prevent background tiles from loading; the app displays a fallback notice and retains the address/price list. The core search does not require a map key.

**Browser key note:** Vite exposes `VITE_` variables to client-side JavaScript. This key is therefore visible to visitors; use a key intended for browser map access and apply provider-supported origin restrictions/quotas where available. Never put a server secret in a `VITE_` variable. Excluding `.env.local` from Git prevents accidentally publishing your personal configuration; it does not make browser keys secret at runtime.

### 2. Start the backend — terminal 1

```bash
cd backend
pipenv install --dev
pipenv run dev
```

The backend runs at **http://localhost:5000**. Health check: **http://localhost:5000/api/health**.

`pipenv run dev` is defined in **backend/Pipfile**. It must be run from the backend folder. There is no `start` alias in the supplied Pipfile unless you add one yourself.

### 3. Start the frontend — terminal 2

Open a NEW terminal at the project root:

```bash
cd frontend
npm install
npm run start
```

Open **http://localhost:5173**. Register a new account, then log in. There is no preconfigured reviewer account; registration works locally without an email service.

The Vite development proxy forwards `/api` to `http://127.0.0.1:5000`, so the frontend uses relative API paths. No separate frontend API URL or CORS configuration is required for this workflow.

### GitHub Codespaces

For the workspace used during development:

Terminal 1:

```bash
cd /workspaces/codespaces-blank/backend
pipenv install --dev
pipenv run dev
```

Terminal 2:

```bash
cd /workspaces/codespaces-blank/frontend
npm install
npm run start
```

If your repository has another name, adjust the workspace path. In **Ports**, open **5173** in the browser. Keep both processes running. Port 5000 serves the API, not the React page: opening its root path can legitimately show 404.

## Features and scope

| Feature | Behavior |
| --- | --- |
| Authentication | Register, log in, persist a signed session across reloads, and log out. Both the UI and listings endpoint require login. |
| Filters | Minimum/maximum price, minimum bedrooms, city, description keyword, and optional listing status. |
| Ranking | Combines budget proximity and listing recency; see the formula below. |
| Pagination | Select page size and navigate previous/next pages after filtering and ranking. |
| Result cards | Address, city/state/ZIP, price, bedrooms, bathrooms, square footage, source, status and relevance score. |
| Property details | Description, listing date, sample photo, location map and an external OpenStreetMap location link. |
| List / Map | Both views represent the same API result page. Map markers display prices and open property details. |
| Favorites | Add/remove listings, persisted in the browser and namespaced by account. |
| Updates | Save/remove search configurations locally. No automated monitoring or notifications. |
| Plan | Budget note and checklist saved locally for the account on that browser. |
| Inbox | Explicit demonstration panel; no message delivery or agent conversations. |
| UI states | Loading, no-results, API errors, validation errors and unavailable map background. |

The supplied dataset contains **12 feed entries**, including different sources describing similar properties. Prices are USD list prices, **not monthly rental prices**. This is a demonstration search over sample data, not a live real-estate marketplace. There is no live MLS, Zillow or rental inventory integration.

Photos are illustrative stock images bundled under **frontend/public/images/** and labeled **Sample photo**. They do not depict the actual sample addresses. A decorative CSS house is used if a photo fails to load.

## Project structure

| Path | Responsibility |
| --- | --- |
| `backend/app.py` | Flask app, health route and authenticated search route. |
| `backend/search.py` | Pure validation, filtering, scoring, stable sorting and pagination logic. |
| `backend/auth.py` | SQLite accounts, password hashing, sessions, CSRF and reset tokens. |
| `backend/sample_listings.json` | Supplied property dataset. |
| `backend/tests/` | Core search and authentication tests. |
| `frontend/src/main.jsx` | Mounts the authentication gate. |
| `frontend/src/AuthGate.jsx` | Login, registration, recovery, reset and logout screens. |
| `frontend/src/App.jsx` | Main navigation and account-specific local state. |
| `frontend/src/pages/Search.jsx` | Search inputs, API requests, list/map switching and pagination. |
| `frontend/src/pages/Plan.jsx` | Local budget and checklist. |
| `frontend/src/components/PropertyCard.jsx` | Listing card and composite identity helpers. |
| `frontend/src/components/PropertyImage.jsx` | Sample photo selection and fallback. |
| `frontend/src/components/PropertyMap.jsx` | Leaflet map, price markers, grouped locations and tile errors. |
| `frontend/src/styles.css` | Black/violet styling and mobile application layout. |
| `frontend/vite.config.js` | Automatic JSX transform, React deduplication and development API proxy. |

## Search API

### Health

`GET /api/health` — no login required.

### Listings

`GET /api/listings` — signed-in session required; unauthenticated requests return HTTP 401.

Example request after login:

```text
/api/listings?city=Springfield&minPrice=400000&maxPrice=550000&minBedrooms=2&keyword=yard&targetBudget=500000&status=active&page=1&pageSize=6
```

| Parameter | Rules |
| --- | --- |
| `city` | Optional exact match after trimming and case-folding. |
| `keyword` | Optional case-insensitive substring of the description. |
| `minPrice`, `maxPrice` | Optional finite nonnegative numbers; inclusive bounds; min cannot exceed max. |
| `minBedrooms` | Optional nonnegative integer; default 0. |
| `targetBudget` | Optional finite number >= 1; affects ranking, not hard filtering. |
| `status` | Optional `active`, `pending` or `sold`, case-insensitive after trimming. Empty means all statuses. |
| `page` | Positive integer; default 1. |
| `pageSize` | Integer from 1 to 100; default 6. UI choices are 3, 6 and 12. |

Response fields:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 6,
  "totalPages": 0
}
```

A nonempty `items` array contains listing objects with their original fields plus `score`. Invalid parameters return HTTP 400 with an `error` message. Valid searches without matches return an empty list; pages past the final page also return an empty list. Source IDs are not globally unique, so the listing identity is **(source, id)**.

### Scoring and trade-offs

For each matching listing:

```text
ageDays = max(0, currentServerDate - listedDate)
recency = 1 / (1 + ageDays / 30)

When targetBudget is supplied:
  proximity = max(0, 1 - abs(price - targetBudget) / targetBudget)
  score = 100 * (0.70 * proximity + 0.30 * recency)

Without targetBudget:
  score = 100 * recency
```

Budget fit has more weight than recency. A property equally above or below the target gets equal budget proximity; minimum/maximum prices are separate hard limits. Recency decays smoothly rather than using an abrupt cutoff. Future listing dates have age zero.

Scores are rounded to six decimal places. Results sort by descending score, then source and ID to resolve ties deterministically. Filtering and sorting occur **before pagination**. The UI displays one decimal, so apparently equal displayed scores can differ internally. Tests inject a fixed date to avoid date-dependent expectations.

Filtering is O(n), sorting is O(m log m) for m matches, and JSON is loaded into memory. This is appropriate for the supplied small dataset. A larger service would benefit from indexed database queries and a pagination strategy designed for changing inventory.

No cross-source deduplication is performed: feed entries remain available for inspection. The map groups **identical coordinates**, showing the lowest price and entry count in the marker, with each feed entry's price in the popup. Nearby but different coordinates can visually overlap; zoom or use the address list. Coordinates and prices are from the sample dataset, not independently verified live listings.

## Authentication API and storage

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/auth/session` | Returns the current user (or null) and a CSRF token. |
| POST | `/api/auth/register` | Creates an account with name, email and password; returns to login. |
| POST | `/api/auth/login` | Verifies credentials and establishes the session. |
| POST | `/api/auth/logout` | Clears the browser session. |
| POST | `/api/auth/forgot-password` | Generates a reset link for an existing account using local console delivery. |
| POST | `/api/auth/reset-password` | Accepts a one-use token and new password. |

POST bodies use JSON. Obtain the CSRF token from the session endpoint and send it in `X-CSRF-Token`, retaining the session cookie. The React gate handles this automatically.

Passwords are 8–128 characters and stored using Werkzeug's scrypt password hash. Session cookies are HttpOnly and SameSite=Lax. A persistent local session key and SQLite database are created automatically under **backend/instance/**. Do not submit or commit that directory.

Rate limiting allows 30 POST requests per endpoint per IP per 10 minutes using in-process memory. It resets when the process restarts and is not a distributed production limit.

Favorites, saved searches and the checklist use localStorage namespaced by account. They are device-local convenience data, not encrypted or synchronized account storage. Logging into the same account on another device does not transfer them.

### Password reset — local demo delivery

**No recovery email is sent.** To test the full reset flow:

1. Register an account.
2. Choose **Forgot password?** and submit that email.
3. Check the backend terminal for a line containing `/?reset=TOKEN`.
4. Append that suffix to the FRONTEND origin and open it. Locally:

```text
http://localhost:5173/?reset=TOKEN
```

In Codespaces use the forwarded **5173** origin instead of localhost.

5. Enter and confirm a new password, then log in with it.

Reset links expire after 30 minutes and can be used once. Only a SHA-256 digest of the random token is stored. Requesting another link invalidates the previous link. A successful reset invalidates existing authenticated sessions via the account version. Responses do not disclose whether the recovery email exists.

## Tests and build

From a NEW terminal at the project root:

```bash
cd backend
pipenv run test
```

The prepared map/photo version includes **23 backend test cases** covering combined filters, no matches, invalid/nonfinite inputs, pagination boundaries, stable ties and composite identities, ranking behavior, status filtering, registration, login/logout, hashes, CSRF, reset expiry and reuse, session revocation, and rate limiting. This is backend coverage, not a claim of automated end-to-end browser coverage.

From another terminal at the project root:

```bash
cd frontend
npm run build
```

The generated frontend output is under `frontend/dist/`. The development setup above is the supported review workflow. A static build/preview alone does not configure a production backend proxy; production hosting must route `/api` to Flask separately.

### Manual acceptance checks

- Register, log in, reload and verify the session persists; log out and verify return to login.
- No filters: 12 feed entries, 2 pages with the default page size of 6.
- City `Reston`: 2 entries. City `Springfield`: 4 entries. City `Miami`: no results.
- Status `pending`: one entry, `42 Willow Way`. Status `sold`: no results in this dataset.
- Set minimum price above maximum price: explicit validation error.
- Change target budget and inspect relevance ranking.
- Save/remove a favorite and reload to verify device-local persistence.
- Open a property, check details, sample photo and map.
- Switch List / Map; change page and filters to check matching results.
- Test recovery through the backend console and verify the old password no longer works.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `/bin/sh: dev: not found` | Run from `backend`, using its Pipfile, not an accidentally generated root Pipfile. |
| npm cannot find `package.json` | Run from `frontend`. |
| Backend folder missing | Restore the full backend source from the project ZIP. |
| Browser shows API root 404 | Open the frontend on 5173; use `/api/health` for a backend check. |
| Old frontend after updating files | Stop Vite, run `npm run start -- --force`, and hard refresh. |
| React undefined / invalid hook call | Keep the updated Vite automatic JSX and React deduplication settings; install dependencies inside frontend. |
| Login cannot reach backend | Keep Flask running on port 5000 and check the `/api` proxy. |
| Map background missing | Check `.env.local`, restart Vite, verify the CARTO key/access and internet connectivity. |
| Duplicate account | Log in or reset its password; accounts persist in SQLite. |
| Recovery email does not arrive | Expected in this demo; retrieve the reset link from the backend terminal. |

The frontend HTML can include this referrer setting inside `<head>`:

```html
<meta name="referrer" content="strict-origin-when-cross-origin" />
```

## Packaging and submission

Include:
- `backend/` source, tests, Pipfile, lockfile, requirements and sample JSON.
- `frontend/` source, public images, package files, Vite config and HTML.
- This `README.md` and `.gitignore`.
- An optional `frontend/.env.example` with only `VITE_CARTO_API_KEY=YOUR_CARTO_BASEMAPS_KEY`.

Exclude:
- `node_modules/`, `dist/`, `.git/`, `.venv/`, `venv/` and test/Python caches.
- `backend/instance/`, SQLite databases and the session key.
- `.env`, `.env.local` and any private credentials.
- Previous ZIP files.

Recommended `.gitignore` entries:

```gitignore
node_modules/
dist/
.venv/
venv/
__pycache__/
.pytest_cache/
.env
.env.local
.env.*.local
backend/instance/
*.sqlite3
*.sqlite3-shm
*.sqlite3-wal
```

After packaging, extract the ZIP into a fresh folder and follow these setup instructions. The reviewer must register an account and supply their own CARTO browser map key for the background map. Core search and bundled photographs do not require that key.

## Known limitations and production considerations

This is an assessment application. It does not implement live inventory, verified property photography, real email delivery, messaging, email verification or MFA. It is a responsive web application, not a native mobile binary or installable PWA.

Before public deployment, configure a persistent secret key, HTTPS with Secure cookies (`COOKIE_SECURE=1`), an appropriate production WSGI server, trusted proxy settings, persistent database storage, shared rate limiting, real email delivery and map-key restrictions. Disable Flask debug mode. Do not log password reset tokens in production.

## Credits and references

- Leaflet: https://leafletjs.com/reference.html
- CARTO Basemaps and API key: https://carto.com/basemaps/apikey/
- CARTO attribution: https://carto.com/attribution/
- OpenStreetMap contributors: https://www.openstreetmap.org/copyright
- Illustrative photos: Unsplash, licensed under https://unsplash.com/license
  - https://images.unsplash.com/photo-1600596542815-ffad4c1539a9
  - https://images.unsplash.com/photo-1600585154340-be6161a56a0c
  - https://images.unsplash.com/photo-1564013799919-ab600027ffc6

## Short technical explanation

“The React frontend sends filters to a Flask API. The backend validates them, filters the supplied listings, calculates relevance from budget proximity and recency, sorts deterministically, and returns one page. Leaflet displays those same results using a CARTO background map. Authentication uses hashed passwords and signed cookies; reset links are delivered through the console for this local demo.”
