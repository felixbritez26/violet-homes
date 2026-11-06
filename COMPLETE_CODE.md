# Violet Homes — Full source with maps and photos

## .gitignore

```
node_modules/
dist/
.venv/
venv/
__pycache__/
.pytest_cache/
.env
backend/instance/
*.sqlite3
*.sqlite3-shm
*.sqlite3-wal

```

## README.md

```
# Violet Homes

Mobile-first property search assessment. React + Vite frontend and Python + Flask API. Black and violet design; original CSS house illustrations require no image service.

## Requirements
Python 3.10+ and Node.js 20+. Install Pipenv with `python -m pip install pipenv` if needed.

## Run (two terminals)

Terminal 1 — from the project root:
```bash
cd backend
pipenv install --dev
pipenv run dev
```
API: http://localhost:5000/api/health

Terminal 2 — from the project root:
```bash
cd frontend
npm install
npm run start
```
Open http://localhost:5173. In Codespaces, open the forwarded **5173** port; the Vite proxy forwards `/api` to Flask so there are no hardcoded frontend API URLs or CORS requirements. Keep both terminals running. The Vite proxy is for development; production hosting must also route `/api` to Flask.

## Verify
```bash
cd backend
pipenv run test
```
```bash
cd frontend
npm run build
```

## Panels
- Search: authenticated API filtering, ranking, pagination, loading, empty and error states. On mobile, tap the sliders button to expand all filters. Cards show full details in a dialog and link to the coordinates on OpenStreetMap.
- Favorites: add/remove cards, persisted locally on the current browser.
- Updates: save/remove search configurations locally. No background monitoring or live notifications.
- Plan: local budget and interactive checklist, persisted on the device.
- Inbox: clearly labeled demo empty state; no message delivery or authentication.

The assessment requires Search; the other four panels are lightweight extras. Accounts now use SQLite and signed sessions; see the authentication update below. Local device state is not synchronized between users or devices. House illustrations are decorative, not photographs of the listings.

## API
`GET /api/listings?city=Springfield&minPrice=400000&maxPrice=550000&minBedrooms=2&keyword=yard&targetBudget=500000&page=1&pageSize=6`

All filters are optional. City is an exact match after trimming and case-folding; keyword is a case-insensitive substring of description. Numeric bounds are inclusive. All statuses and MLS feed entries are retained as supplied; no unrequested deduplication is performed. IDs are unique only within their source, so identity is `(source, id)`.

Response: `{items, total, page, pageSize, totalPages}`. Each item includes `score`. Invalid numeric inputs return HTTP 400 with `{error}`; page and pageSize are positive integers, pageSize <= 100, minBedrooms is a nonnegative integer, prices are finite and nonnegative, targetBudget is positive. No matches and pages beyond the last page return an empty items array. No matches means totalPages = 0.

## Ranking and trade-offs
Compute age in days against the server's current calendar date (future dates have age zero).
- Recency = `1 / (1 + ageDays / 30)`.
- Budget proximity = `max(0, 1 - abs(price - targetBudget) / targetBudget)`.
- With a target: score = `100 * (0.7 * proximity + 0.3 * recency)`.
- Without a target: score = `100 * recency`.

Budget fit has more influence than recency. A property above or below the target by the same amount receives equal budget fit; min/max price are separate hard constraints. Scores are rounded to six decimals, sorted descending, then ties resolved by source and id for stable pages. Ranking happens before pagination. The UI displays one decimal but sorting uses six, so displayed scores can look tied while having different internal values.

Filtering uses O(n), sorting O(m log m), and in-memory JSON storage suits the supplied 12 rows. Larger datasets would use indexed database queries and potentially cursor pagination. Tests inject a fixed date for repeatability.

## Tests
Core tests cover combined filters, no matches, invalid ranges/nonfinite values, pagination boundaries, same ID across sources, stable ties, budget fit/recency and HTTP error responses.

## Submission
Stop the servers, include this entire project folder in a ZIP, and exclude node_modules, dist, virtual environments, caches and secrets. Unzip into a fresh folder and follow the commands above before submitting. Keep your repository private.

## English interview explanation
“I built a React interface connected to a Flask search API. The backend validates filters, ranks matching listings by budget proximity and recency, and paginates after sorting. I use source plus ID as the listing identity because IDs are not globally unique. Favorites and the checklist are stored locally; messaging and notifications are outside the core assessment scope.”

## Authentication update
The entry point is now `AuthGate.jsx`. A visitor sees login before Search. A signed-in visitor resumes their session on reload; logout returns to login. Register first, then log in. SQLite stores accounts under `backend/instance/`; never submit that directory or the session key. Passwords are scrypt hashes, not plaintext. Cookies are HttpOnly and SameSite=Lax; writes require a CSRF token. The listings API requires authentication. Favorites/plan/searches remain device-local and are namespaced by account; this is not confidential server storage.

### Reset password (working LOCAL DEMO delivery)
1. On login choose Forgot password and enter the registered email.
2. Look in the terminal running `pipenv run dev`.
3. Copy the suffix `/?reset=...` shown there and append it to your FRONTEND origin (port 5173, including its Codespaces URL). For example `https://YOUR-CODESPACE-5173.app.github.dev/?reset=TOKEN`.
4. Open that URL, enter and confirm a new password, then log in.

No email is sent. The API returns the same response for known/unknown accounts. Reset tokens are cryptographically random, stored as SHA-256 digests, expire in 30 minutes, are single-use, and revoke previous sessions on successful reset. A new request invalidates the old reset token. Rate limiting is 30 POST requests per endpoint per IP per 10 minutes, in process memory; restarting the server clears it.

For public deployment replace console delivery with an email provider; do not log reset links. Configure a persistent SECRET_KEY, COOKIE_SECURE=1 under HTTPS, trusted proxy settings, persistent database storage and a shared rate-limit store. This assessment demo does not include email verification, MFA or a production mail service. Do not run Flask debug mode publicly.

### Updating an existing Codespace
Stop both servers with Ctrl+C. Replace the `backend` and `frontend` SOURCE folders with this package's folders. Keep your database private if you already have accounts. This update includes all original panels and the corrected Vite JSX/deduplication settings. From a NEW terminal at the repository root:

```bash
cd backend
pipenv install --dev
pipenv run dev
```

In another NEW terminal at the repository root:

```bash
cd frontend
npm install
npm run start -- --force
```

Open the forwarded 5173 port and hard refresh. Run `pipenv run test` from backend. The account tests use a temporary database and cover registration, validation, login/logout, hashes, CSRF, protected search, expiry, replay rejection and session revocation.

## Photos, map and status filter
- Bundled sample house photographs replace the CSS illustrations. They are illustrative stock photos, NOT photos of the listed addresses. Each is labeled Sample photo. No photo API key or network download is needed at runtime; a CSS house remains the fallback if an image fails.
- Leaflet 1.9.4 displays OpenStreetMap tiles with visible attribution. Internet is required for the map background; tile failures show a notice and the address/price list remains usable. There is no offline tile caching or bulk prefetch.
- List / Map toggles the same paginated API results. Map bounds fit the page's coordinates. Same-coordinate listings share one marker, showing the lowest price and count; its popup lists every feed entry with its own price. No deduplication or location jitter changes source data.
- Property details include the photograph and map. Markers use supplied coordinates, which are sample data and not independently verified real listing locations. Sale prices are USD list prices, not monthly rent. The dataset has no rental field or live listing feed. No live inventory API has been added.
- Optional `status=active|pending|sold` is validated server-side and combined with existing filters. An empty value preserves original behavior. A regression test covers status and invalid values.
- Documentation: https://leafletjs.com/reference.html and https://operations.osmfoundation.org/policies/tiles/

### Photo sources
Downloaded from Unsplash under https://unsplash.com/license for illustrative use:
- https://images.unsplash.com/photo-1600596542815-ffad4c1539a9
- https://images.unsplash.com/photo-1600585154340-be6161a56a0c
- https://images.unsplash.com/photo-1564013799919-ab600027ffc6

```

## UPDATE_ES.md

```
# Actualización de mapa y fotografías

Incluye TODO el proyecto con login, los cinco paneles, diseño móvil, fotos ilustrativas, mapa y filtro por estado.

1. Guardá tu ZIP anterior como respaldo.
2. Detené ambos servidores con Ctrl+C.
3. Reemplazá los archivos de backend y frontend con los de este paquete. Incluí frontend/public/images: contiene las fotos. NO borres backend/instance de tu Codespace si querés conservar las cuentas existentes. Esa carpeta privada no está en este ZIP.
4. Subí el README actualizado.
5. En una terminal nueva:

```bash
cd /workspaces/codespaces-blank/backend
pipenv install --dev
pipenv run dev
```

6. En otra terminal nueva:

```bash
cd /workspaces/codespaces-blank/frontend
npm install
npm run start -- --force
```

Abrí el puerto 5173 y recargá con Ctrl+Shift+R.

## Comprobaciones
- Registrate o iniciá sesión.
- Revisá las fotos con la etiqueta Sample photo.
- Tocá Map: aparecen precios de esta página y una lista accesible de direcciones.
- Tocá un precio y View property para abrir detalles.
- Cambiá de página: también cambia el mapa.
- Buscá Reston: deben quedar 2 publicaciones.
- En filtros, Pending: aparece 42 Willow Way. Sold: sin resultados.
- Probá el mapa en un teléfono; permite zoom con los botones o gesto táctil.

No hay alquileres ni datos de disponibilidad en vivo: se conserva el JSON de la evaluación. Las fotos no corresponden a esas direcciones. El mapa base necesita internet.

Antes de entregar, ejecutá pipenv run test desde backend y npm run build desde frontend. Generá un ZIP nuevo desde tu Codespace con tus últimos cambios, excluyendo node_modules, dist, instance y secretos.

```

## backend/Pipfile

```
[[source]]
url = "https://pypi.org/simple"
verify_ssl = true
name = "pypi"

[packages]
flask = "==3.1.2"

[dev-packages]
pytest = "==8.4.2"

[scripts]
dev = "python app.py"
test = "python -m pytest -q"

```

## backend/app.py

```
import json
from pathlib import Path
from flask import Flask, jsonify, request
from auth import init_auth, current_user
from search import SearchError, search_listings

app = Flask(__name__)
with app.app_context():
    init_auth(app)

LISTINGS = json.loads(Path(__file__).with_name('sample_listings.json').read_text())

@app.get('/api/health')
def health():
    return jsonify(status='ok')

@app.get('/api/listings')
def listings():
    if not current_user():
        return jsonify(error='Please log in to search listings.'), 401
    try:
        return jsonify(search_listings(LISTINGS, request.args))
    except SearchError as exc:
        return jsonify(error=str(exc)), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

```

## backend/auth.py

```
"""SQLite accounts, signed sessions, CSRF protection, one-use reset tokens."""
import hashlib
import os
import re
import secrets
import sqlite3
import time
from collections import defaultdict, deque
from pathlib import Path
from flask import Blueprint, current_app, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash

auth = Blueprint('auth', __name__, url_prefix='/api/auth')
DUMMY_HASH = generate_password_hash('dummy-password-for-timing')
ATTEMPTS = defaultdict(deque)

def db():
    connection = sqlite3.connect(current_app.config['DATABASE'])
    connection.row_factory = sqlite3.Row
    return connection

def init_auth(app):
    directory = Path(app.instance_path)
    directory.mkdir(exist_ok=True)
    key_file = directory / 'session.key'
    if not key_file.exists():
        try:
            fd = os.open(key_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(fd, 'w') as f: f.write(secrets.token_hex(32))
        except FileExistsError: pass
    app.config.update(SECRET_KEY=os.environ.get('SECRET_KEY') or key_file.read_text(),
        DATABASE=os.environ.get('DATABASE_PATH', str(directory/'accounts.sqlite3')),
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=os.environ.get('COOKIE_SECURE') == '1',
        MAX_CONTENT_LENGTH=16384)
    with db_for(app) as c:
        c.executescript('''CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0);
          CREATE TABLE IF NOT EXISTS resets (
          digest TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires REAL NOT NULL);
        ''')
    app.register_blueprint(auth)

def db_for(app): return sqlite3.connect(app.config['DATABASE'])

def current_user():
    if not session.get('user_id'): return None
    with db() as c:
        u = c.execute('SELECT * FROM users WHERE id=?', (session['user_id'],)).fetchone()
    if not u or u['version'] != session.get('version'): return None
    return {'id':u['id'], 'name':u['name'], 'email':u['email']}

@auth.before_request
def protect():
    if request.method != 'GET':
        expected = session.get('csrf')
        if not expected or not secrets.compare_digest(expected, request.headers.get('X-CSRF-Token','')):
            return jsonify(error='Session expired. Refresh and try again.'), 403
        key = (request.remote_addr, request.path)
        now = time.time()
        queue = ATTEMPTS[key]
        while queue and queue[0] < now-600: queue.popleft()
        if len(queue) >= 30: return jsonify(error='Too many attempts. Try again in 10 minutes.'), 429
        queue.append(now)

def payload():
    value = request.get_json(silent=True)
    return value if isinstance(value, dict) else {}

def email_value(data):
    value = data.get('email','')
    return value.strip().lower() if isinstance(value,str) else ''

def valid_password(password):
    return isinstance(password,str) and 8 <= len(password) <= 128

def login_session(user_id, version):
    session.clear()
    session.update(user_id=user_id, version=version, csrf=secrets.token_urlsafe(32))

@auth.get('/session')
def session_info():
    if 'csrf' not in session: session['csrf'] = secrets.token_urlsafe(32)
    return jsonify(user=current_user(), csrfToken=session['csrf'])

@auth.post('/register')
def register():
    data = payload(); email = email_value(data)
    name = data.get('name',''); password = data.get('password')
    if not isinstance(name,str) or not 1 <= len(name.strip()) <= 80:
        return jsonify(error='Enter a name between 1 and 80 characters.'), 400
    if len(email)>254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email):
        return jsonify(error='Enter a valid email address.'),400
    if not valid_password(password): return jsonify(error='Use a password between 8 and 128 characters.'),400
    try:
        with db() as c:
            cursor=c.execute('INSERT INTO users(name,email,password) VALUES(?,?,?)',
                (name.strip(),email,generate_password_hash(password)))
            user_id=cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify(error='Unable to create this account. Try logging in or resetting your password.'),409
    # Registration deliberately returns to login.
    return jsonify(message='Account created. You can now log in.'),201

@auth.post('/login')
def login():
    data=payload(); email=email_value(data); password=data.get('password','')
    if not isinstance(password,str) or len(password)>128: return jsonify(error='Invalid email or password.'),401
    with db() as c: u=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
    verified=check_password_hash(u['password'] if u else DUMMY_HASH,password)
    if not u or not verified: return jsonify(error='Invalid email or password.'),401
    login_session(u['id'],u['version'])
    return jsonify(user=current_user(),csrfToken=session['csrf'])

@auth.post('/logout')
def logout():
    session.clear()
    return jsonify(message='Logged out.')

@auth.post('/forgot-password')
def forgot():
    email=email_value(payload())
    with db() as c:
        u=c.execute('SELECT id FROM users WHERE email=?',(email,)).fetchone()
        if u:
            token=secrets.token_urlsafe(32)
            digest=hashlib.sha256(token.encode()).hexdigest()
            c.execute('DELETE FROM resets WHERE user_id=? OR expires<?',(u['id'],time.time()))
            c.execute('INSERT INTO resets VALUES(?,?,?)',(digest,u['id'],time.time()+1800))
            # Local demo delivery only. Never return a reset token in an API response.
            print('\nPASSWORD RESET (local demo; expires in 30 minutes):\n'
                  'Open the FRONTEND URL, then append: /?reset='+token+'\n',flush=True)
    return jsonify(message='If this email is registered, a reset link has been generated. In this local demo, check the backend terminal.')

@auth.post('/reset-password')
def reset():
    data=payload(); token=data.get('token',''); password=data.get('password')
    if not isinstance(token,str) or len(token)>200: return jsonify(error='Invalid reset link.'),400
    if not valid_password(password): return jsonify(error='Use a password between 8 and 128 characters.'),400
    digest=hashlib.sha256(token.encode()).hexdigest()
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row=c.execute('SELECT * FROM resets WHERE digest=? AND expires>?',(digest,time.time())).fetchone()
        if not row: return jsonify(error='This reset link is invalid or expired. Request another one.'),400
        c.execute('UPDATE users SET password=?, version=version+1 WHERE id=?',
            (generate_password_hash(password),row['user_id']))
        c.execute('DELETE FROM resets WHERE user_id=?',(row['user_id'],))
    session.clear()
    return jsonify(message='Password updated. Log in with your new password.')

```

## backend/requirements.txt

```
Flask==3.1.2
pytest==8.4.2

```

## backend/sample_listings.json

```
[
  {
    "id": "A1",
    "source": "MLS_A",
    "address": "123 Main St, Apt 4B",
    "city": "Springfield",
    "state": "VA",
    "zip": "22150",
    "price": 450000,
    "bedrooms": 2,
    "bathrooms": 1.5,
    "sqft": 980,
    "latitude": 38.7893,
    "longitude": -77.1873,
    "listedDate": "2026-08-29",
    "status": "active",
    "description": "Bright top-floor condo near shops and transit. Pet friendly."
  },
  {
    "id": "B7",
    "source": "MLS_B",
    "address": "123 Main Street, Unit 4B",
    "city": "Springfield",
    "state": "VA",
    "zip": "22150",
    "price": 452000,
    "bedrooms": 2,
    "bathrooms": 1.5,
    "sqft": 980,
    "latitude": 38.7893,
    "longitude": -77.1873,
    "listedDate": "2026-08-27",
    "status": "active",
    "description": "Top floor condo, walk to shopping. Pets allowed."
  },
  {
    "id": "A2",
    "source": "MLS_A",
    "address": "456 Oak Ave",
    "city": "Springfield",
    "state": "VA",
    "zip": "22150",
    "price": 525000,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "sqft": 1450,
    "latitude": 38.7791,
    "longitude": -77.1901,
    "listedDate": "2026-09-02",
    "status": "active",
    "description": "Updated kitchen, fenced yard, close to schools."
  },
  {
    "id": "B8",
    "source": "MLS_B",
    "address": "456 Oak Avenue",
    "city": "Springfield",
    "state": "VA",
    "zip": "22151",
    "price": 527500,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "sqft": 1450,
    "latitude": 38.7791,
    "longitude": -77.1901,
    "listedDate": "2026-08-30",
    "status": "active",
    "description": "Renovated kitchen, fenced backyard, near schools."
  },
  {
    "id": "A3",
    "source": "MLS_A",
    "address": "789 Pine Rd",
    "city": "Fairfax",
    "state": "VA",
    "zip": "22030",
    "price": 399000,
    "bedrooms": 2,
    "bathrooms": 1.0,
    "sqft": 850,
    "latitude": 38.8462,
    "longitude": -77.3064,
    "listedDate": "2026-09-01",
    "status": "active",
    "description": "Cozy starter home, no pets."
  },
  {
    "id": "B9",
    "source": "MLS_B",
    "address": "789 Pine Rd",
    "city": "Fairfax",
    "state": "VA",
    "zip": "22030",
    "price": 399500,
    "bedrooms": 2,
    "bathrooms": 1.0,
    "sqft": 850,
    "latitude": 38.8462,
    "longitude": -77.3064,
    "listedDate": "2026-08-25",
    "status": "active",
    "description": "Cozy starter home, pets not permitted."
  },
  {
    "id": "A4",
    "source": "MLS_A",
    "address": "22 Birch Ln",
    "city": "Reston",
    "state": "VA",
    "zip": "20190",
    "price": 610000,
    "bedrooms": 4,
    "bathrooms": 3.0,
    "sqft": 2100,
    "latitude": 38.9586,
    "longitude": -77.3570,
    "listedDate": "2026-09-03",
    "status": "active",
    "description": "Spacious family home near Reston Town Center. Pets welcome."
  },
  {
    "id": "B10",
    "source": "MLS_B",
    "address": "100 Maple Dr",
    "city": "Reston",
    "state": "VA",
    "zip": "20190",
    "price": 585000,
    "bedrooms": 3,
    "bathrooms": 2.5,
    "sqft": 1900,
    "latitude": 38.9601,
    "longitude": -77.3499,
    "listedDate": "2026-08-20",
    "status": "active",
    "description": "Townhome with 2-car garage, community pool."
  },
  {
    "id": "A5",
    "source": "MLS_A",
    "address": "55 Elm Ct",
    "city": "Vienna",
    "state": "VA",
    "zip": "22180",
    "price": 470000,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "sqft": 1300,
    "latitude": 38.9012,
    "longitude": -77.2653,
    "listedDate": "2026-09-04",
    "status": "active",
    "description": "Quiet cul-de-sac, walkable to Metro. No pets."
  },
  {
    "id": "B11",
    "source": "MLS_B",
    "address": "55 Elm Court",
    "city": "Vienna",
    "state": "VA",
    "zip": "22180",
    "price": 465000,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "sqft": 1300,
    "latitude": 38.9012,
    "longitude": -77.2653,
    "listedDate": "2026-08-15",
    "status": "active",
    "description": "Peaceful street, close to Metro. Pet restrictions apply."
  },
  {
    "id": "A6",
    "source": "MLS_A",
    "address": "300 Cedar Blvd",
    "city": "Manassas",
    "state": "VA",
    "zip": "20110",
    "price": 415000,
    "bedrooms": 3,
    "bathrooms": 2.0,
    "sqft": 1600,
    "latitude": 38.7509,
    "longitude": -77.4753,
    "listedDate": "2026-08-10",
    "status": "active",
    "description": "Split-level home, large driveway, pets allowed."
  },
  {
    "id": "A7",
    "source": "MLS_A",
    "address": "42 Willow Way",
    "city": "Chantilly",
    "state": "VA",
    "zip": "20151",
    "price": 540000,
    "bedrooms": 4,
    "bathrooms": 2.5,
    "sqft": 1950,
    "latitude": 38.8909,
    "longitude": -77.4316,
    "listedDate": "2026-07-28",
    "status": "pending",
    "description": "Corner lot, recently painted, no pets due to HOA."
  }
]

```

## backend/search.py

```
"""Pure search logic, independent of Flask and storage."""
from datetime import date
from math import isfinite, ceil

class SearchError(ValueError):
    pass

def search_listings(listings, params, today=None):
    today = today or date.today()
    def number(key, default=None, integer=False, minimum=0):
        raw = params.get(key, '')
        if raw == '' or raw is None:
            return default
        try:
            value = float(raw)
        except (TypeError, ValueError):
            raise SearchError(f'{key} must be a number')
        if not isfinite(value) or value < minimum or (integer and not value.is_integer()):
            raise SearchError(f'{key} must be {"an integer" if integer else "a finite number"} >= {minimum}')
        return int(value) if integer else value
    low, high = number('minPrice'), number('maxPrice')
    beds = number('minBedrooms', 0, True)
    budget = number('targetBudget', minimum=1)
    page = number('page', 1, True, 1)
    size = number('pageSize', 6, True, 1)
    if size > 100:
        raise SearchError('pageSize must be <= 100')
    if low is not None and high is not None and low > high:
        raise SearchError('minPrice cannot exceed maxPrice')
    city = str(params.get('city', '')).strip().casefold()
    keyword = str(params.get('keyword', '')).strip().casefold()
    status = str(params.get('status', '')).strip().casefold()
    if status and status not in {'active', 'pending', 'sold'}:
        raise SearchError('status must be active, pending, or sold')
    results = []
    for item in listings:
        if status and item['status'] != status: continue
        if low is not None and item['price'] < low: continue
        if high is not None and item['price'] > high: continue
        if item['bedrooms'] < beds: continue
        if city and city != item['city'].strip().casefold(): continue
        if keyword and keyword not in item['description'].casefold(): continue
        age = max(0, (today - date.fromisoformat(item['listedDate'])).days)
        recency = 1 / (1 + age / 30)
        proximity = max(0, 1 - abs(item['price'] - budget) / budget) if budget else 0
        score = 100 * (0.7 * proximity + 0.3 * recency) if budget else 100 * recency
        results.append({**item, 'score': round(score, 6)})
    # Composite identity ensures stable ties across MLS sources.
    results.sort(key=lambda x: (-x['score'], x['source'], x['id']))
    total = len(results)
    return {'items': results[(page-1)*size:page*size], 'total': total,
            'page': page, 'pageSize': size, 'totalPages': ceil(total/size)}

```

## backend/tests/test_auth.py

```
import hashlib
import sqlite3
import time
import pytest
from app import app
from auth import ATTEMPTS

@pytest.fixture
def client(tmp_path):
    old = app.config['DATABASE']
    app.config.update(DATABASE=str(tmp_path/'test.sqlite3'),TESTING=True)
    with sqlite3.connect(app.config['DATABASE']) as c:
        c.executescript('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT,email TEXT UNIQUE,password TEXT,version INTEGER DEFAULT 0); CREATE TABLE resets(digest TEXT PRIMARY KEY,user_id INTEGER,expires REAL);')
    ATTEMPTS.clear()
    with app.test_client() as client: yield client
    app.config['DATABASE']=old

def post(client,path,body):
    csrf=client.get('/api/auth/session').json['csrfToken']
    return client.post('/api/auth/'+path,json=body,headers={'X-CSRF-Token':csrf})

def register(client):
    return post(client,'register',{'name':'Felix','email':'felix@example.com','password':'testing-password'})

def login(client,password='testing-password'):
    return post(client,'login',{'email':'felix@example.com','password':password})

def seed_reset(token='valid-token',expires=None):
    with sqlite3.connect(app.config['DATABASE']) as c:
        c.execute('INSERT INTO resets VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),1,expires or time.time()+1800))

def test_register_login_logout_and_protected_search(client):
    assert client.get('/api/listings').status_code==401
    assert register(client).status_code==201
    assert client.get('/api/auth/session').json['user'] is None
    assert login(client).json['user']['name']=='Felix'
    assert client.get('/api/listings').json['total']==12
    assert post(client,'logout',{}).status_code==200
    assert client.get('/api/listings').status_code==401

def test_password_is_hashed_and_duplicates_rejected(client):
    register(client)
    with sqlite3.connect(app.config['DATABASE']) as c:
        password=c.execute('SELECT password FROM users').fetchone()[0]
    assert password!='testing-password' and password.startswith('scrypt:')
    assert register(client).status_code==409
    assert login(client,'wrong').status_code==401

def test_validation_and_csrf(client):
    assert client.post('/api/auth/register',json={}).status_code==403
    assert post(client,'register',{'name':'A','email':'invalid','password':'short'}).status_code==400
    assert post(client,'register',{'name':None}).status_code==400
    assert post(client,'login',{'password':[]}).status_code==401

def test_reset_once_and_revoke_existing_session(client):
    register(client); login(client); seed_reset()
    other=app.test_client()
    response=post(other,'reset-password',{'token':'valid-token','password':'new-password-123'})
    assert response.status_code==200
    assert client.get('/api/listings').status_code==401
    assert login(client).status_code==401
    assert login(client,'new-password-123').status_code==200
    assert post(other,'reset-password',{'token':'valid-token','password':'other-password'}).status_code==400

def test_expired_token(client):
    register(client); seed_reset(expires=time.time()-10)
    assert post(client,'reset-password',{'token':'valid-token','password':'new-password'}).status_code==400

def test_forgot_generic_and_console_delivery(client,capsys):
    register(client)
    real=post(client,'forgot-password',{'email':'felix@example.com'})
    output=capsys.readouterr().out
    assert '/?reset=' in output
    absent=post(client,'forgot-password',{'email':'absent@example.com'})
    assert real.json==absent.json and 'token' not in real.json

def test_rate_limit(client):
    for _ in range(30): assert login(client).status_code==401
    assert login(client).status_code==429

```

## backend/tests/test_search.py

```
import json
from datetime import date
from pathlib import Path
import pytest
from search import search_listings, SearchError
from app import app

DATA = json.loads((Path(__file__).parents[1] / 'sample_listings.json').read_text())
TODAY = date(2026, 9, 5)

def run(**params): return search_listings(DATA, params, TODAY)

def test_filters():
    result = run(city=' springFIELD ', minPrice=450000, maxPrice=525000, minBedrooms=2, keyword='PET')
    assert {x['id'] for x in result['items']} == {'A1', 'B7'}

def test_empty():
    assert run(city='Unknown')['total'] == 0
    assert run(city='Unknown')['items'] == []

@pytest.mark.parametrize('params', [dict(minPrice=10, maxPrice=1), dict(pageSize=0), dict(page=0), dict(minBedrooms=1.2), dict(targetBudget=0), dict(minPrice='nan'), dict(maxPrice='inf'), dict(pageSize=101), dict(page='abc')])
def test_invalid(params):
    with pytest.raises(SearchError): run(**params)

def test_pagination():
    first, second = run(pageSize=6), run(pageSize=6, page=2)
    assert first['totalPages'] == 2
    assert len(first['items']) == len(second['items']) == 6
    assert not {x['id'] for x in first['items']} & {x['id'] for x in second['items']}
    assert run(page=3)['items'] == []

def test_ties_and_composite_identity():
    a = {**DATA[0], 'source': 'Z', 'id': 'same'}
    b = {**a, 'source': 'A'}
    result = search_listings([a,b], {}, TODAY)
    assert [x['source'] for x in result['items']] == ['A', 'Z']

def test_budget_and_recency():
    rows = [{**DATA[0], 'id':'old', 'listedDate':'2026-08-01'}, {**DATA[0], 'id':'new', 'listedDate':'2026-09-05'}, {**DATA[0], 'id':'far', 'price':900000, 'listedDate':'2026-09-05'}]
    assert [x['id'] for x in search_listings(rows, {'targetBudget':450000}, TODAY)['items']] == ['new','old','far']

def test_api():
    client = app.test_client()
    assert client.get('/api/listings').status_code == 401
    with client.session_transaction() as session:
        session['user_id'] = 1
        session['version'] = 0
    from unittest.mock import patch
    with patch('app.current_user', return_value={'id':1}):
        assert client.get('/api/listings').status_code == 200
    from unittest.mock import patch
    with patch('app.current_user', return_value={'id':1}):
        response = client.get('/api/listings?pageSize=0')
    assert response.status_code == 400 and 'error' in response.json

def test_status_filter():
    result = run(status='pending')
    assert result['total'] == 1 and result['items'][0]['id'] == 'A7'
    assert run(status='sold')['total'] == 0
    assert run(status=' ACTIVE ', city='Springfield')['total'] == 4
    with pytest.raises(SearchError): run(status='for-rent')

```

## frontend/index.html

```
<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#100e18"/><title>Violet Homes</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>

```

## frontend/package.json

```
{"name":"violet-homes","private":true,"version":"1.0.0","type":"module","scripts":{"start":"vite --host 0.0.0.0","build":"vite build","preview":"vite preview --host 0.0.0.0"},"dependencies":{"leaflet":"^1.9.4","lucide-react":"^0.468.0","react":"^19.1.1","react-dom":"^19.1.1"},"devDependencies":{"vite":"^6.3.6"}}
```

## frontend/src/App.jsx

```
import PropertyMap from './components/PropertyMap';
import PropertyImage from './components/PropertyImage';
import { useState } from "react";
import {
  Search as SearchIcon,
  Bell,
  Heart,
  ClipboardCheck,
  Inbox,
  House,
  X,
  ArrowRight,
} from "lucide-react";
import Search from "./pages/Search";
import Plan from "./pages/Plan";
import PropertyCard, { identity, money } from "./components/PropertyCard";
function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? initial;
    } catch {
      return initial;
    }
  });
  function update(next) {
    setValue(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }
  return [value, update];
}
const tabs = [
  ["Search", SearchIcon],
  ["Updates", Bell],
  ["Favorites", Heart],
  ["Plan", ClipboardCheck],
  ["Inbox", Inbox],
];
export default function App({ user }) {
  const [tab, setTab] = useState("Search"),
    [favorites, setFavorites] = useStored(`violet-favorites-${user.id}`, []),
    [searches, setSearches] = useStored(`violet-searches-${user.id}`, []),
    [plan, setPlan] = useStored(`violet-plan-${user.id}`, { done: [] }),
    [selected, setSelected] = useState(null),
    [notice, setNotice] = useState("");
  function save(item) {
    setFavorites(
      favorites.some((x) => identity(x) === identity(item))
        ? favorites.filter((x) => identity(x) !== identity(item))
        : [...favorites, item],
    );
  }
  function saveSearch(query) {
    setSearches([...searches, { ...query, id: Date.now() }]);
    setNotice("Search saved. Find it in Updates.");
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setTab("Search");
          }}
        >
          <span className="brand-icon">
            <House size={23} />
          </span>
          <span>
            violet<span className="brand-light">homes</span>
          </span>
        </a>
        <p className="nav-caption">YOUR SPACE</p>
        <nav>
          {tabs.map(([name, Icon]) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => {
                setTab(name);
                setNotice("");
              }}
            >
              <Icon size={21} />
              <span>{name}</span>
              {name === "Favorites" && favorites.length > 0 && (
                <small>{favorites.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            My workspace<small>Find somewhere you belong.</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <span className="mobile-brand">
            <House size={20} />
            violet homes
          </span>
          <span className="breadcrumb">
            My workspace <span>/ {tab}</span>
          </span>
          <span className="header-pill">A fresh perspective on home</span>
          <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
        </header>
        <main>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Dismiss" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {tab === "Search" && (
            <Search
              favorites={favorites}
              onSave={save}
              onOpen={setSelected}
              onSaveSearch={saveSearch}
            />
          )}
          {tab === "Favorites" && (
            <>
              <div className="eyebrow">THE ONES THAT FEEL LIKE YOU</div>
              <h1>
                A little closer
                <br />
                <span>to home.</span>
              </h1>
              <p className="intro">
                Your shortlist, all in one place. Saved on this device.
              </p>
              {favorites.length ? (
                <div className="grid">
                  {favorites.map((item) => (
                    <PropertyCard
                      key={identity(item)}
                      item={item}
                      saved
                      onSave={save}
                      onOpen={setSelected}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  icon={Heart}
                  title="Room for your favorites"
                  text="Tap a heart on a property to start your collection."
                  action={() => setTab("Search")}
                />
              )}
            </>
          )}
          {tab === "Updates" && (
            <>
              <div className="eyebrow">STAY IN THE LOOP</div>
              <h1>
                Your search.
                <br />
                <span>Worth keeping.</span>
              </h1>
              <p className="intro">
                Manage saved searches on this device. Live notifications are not
                enabled.
              </p>
              {searches.length ? (
                searches.map((s) => (
                  <section className="saved-search" key={s.id}>
                    <Bell size={23} />
                    <div>
                      <h3>{s.city || "All cities"}</h3>
                      <p className="muted">
                        {s.targetBudget
                          ? `Budget ${money(s.targetBudget)}`
                          : "Any budget"}{" "}
                        · {s.keyword || "All descriptions"}
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        setSearches(searches.filter((x) => x.id !== s.id))
                      }
                    >
                      Remove
                    </button>
                  </section>
                ))
              ) : (
                <Empty
                  icon={Bell}
                  title="Keep a good search close"
                  text="Save your search from the Search panel to see it here."
                  action={() => setTab("Search")}
                />
              )}
            </>
          )}
          {tab === "Plan" && <Plan plan={plan} setPlan={setPlan} />}{" "}
          {tab === "Inbox" && (
            <>
              <div className="eyebrow">YOUR COMMUNICATIONS CENTER</div>
              <h1>
                Good things
                <br />
                <span>start with hello.</span>
              </h1>
              <p className="intro">A home for your future conversations.</p>
              <Empty
                icon={Inbox}
                title="Your inbox is quiet"
                text="Messaging is a demo panel. Agent conversations and message delivery are not connected."
                action={() => setTab("Search")}
              />
            </>
          )}
          <footer>
            VIOLET HOMES <span>Find your kind of place.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav">
        {tabs.map(([name, Icon]) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            onClick={() => {
              setTab(name);
              setNotice("");
            }}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Property details"
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="close"
              aria-label="Close details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="detail-photo"><PropertyImage item={selected}/></div>
            <div className="eyebrow">
              {selected.status} · {selected.source}
            </div>
            <h2>{selected.address}</h2>
            <p>
              {selected.city}, {selected.state} {selected.zip}
            </p>
            <h1>{money(selected.price)}</h1>
            <p>{selected.description}</p>
            <p className="muted">
              {selected.bedrooms} beds · {selected.bathrooms} baths ·{" "}
              {selected.sqft} ft²
            </p>
            <p className="muted">
              Listed {selected.listedDate} · Relevance{" "}
              {selected.score.toFixed(1)}/100
            </p>
            <PropertyMap items={[selected]}/>
            <a
              className="primary map-link"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}
            >
              View location <ArrowRight size={16} />
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
function Empty({ icon: Icon, title, text, action }) {
  return (
    <section className="empty">
      <span className="empty-icon">
        <Icon size={38} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary" onClick={action}>
        Explore homes <ArrowRight size={16} />
      </button>
    </section>
  );
}

```

## frontend/src/AuthGate.jsx

```
import { useEffect, useState } from 'react';
import { House, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import App from './App';

async function api(path, csrf, body) {
  const response = await fetch('/api/auth/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export default function AuthGate() {
  const resetToken = new URLSearchParams(window.location.search).get('reset') || '';
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login');
  const [user, setUser] = useState(null), [csrf, setCsrf] = useState('');
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  async function refresh() {
    const data = await api('session');
    setCsrf(data.csrfToken); setUser(data.user); return data;
  }
  useEffect(() => { refresh().catch(() => setError('Cannot reach the backend. Check that pipenv run dev is running.')).finally(() => setReady(true)); }, []);
  function navigate(next, keepMessage = false) {
    setMode(next); setPassword(''); setConfirm(''); setError(''); setVisible(false);
    if (!keepMessage) setMessage('');
    if (next !== 'reset') window.history.replaceState({}, '', window.location.pathname);
  }
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    if ((mode === 'register' || mode === 'reset') && password !== confirm) {
      setError('Passwords do not match.'); return;
    }
    setBusy(true);
    try {
      const token = csrf || (await refresh()).csrfToken;
      if (mode === 'login') {
        const data = await api('login', token, { email, password });
        setCsrf(data.csrfToken); setUser(data.user); setPassword('');
      } else if (mode === 'register') {
        const data = await api('register', token, { name, email, password });
        setMessage(data.message); navigate('login', true);
      } else if (mode === 'forgot') {
        const data = await api('forgot-password', token, { email }); setMessage(data.message);
      } else {
        const data = await api('reset-password', token, { token: resetToken, password });
        setMessage(data.message); setUser(null); await refresh(); navigate('login', true);
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError('');
    try { await api('logout', csrf, {}); setUser(null); await refresh(); navigate('login'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  if (!ready) return <div className="auth-loading" role="status">Opening your space…</div>;
  if (user && mode !== 'reset') return <><div className="account-strip"><span>Welcome, {user.name}</span><button disabled={busy} onClick={logout}>Log out</button></div>{error && <p className="auth-session-error" role="alert">{error}</p>}<App key={user.id} user={user}/></>;
  const copy = {
    login: ['WELCOME TO YOUR NEXT CHAPTER', 'Welcome back.', 'Your next home is waiting.', 'Log in'],
    register: ['MAKE ROOM FOR SOMETHING NEW', 'Find your place.', 'Create your account and start exploring.', 'Create account'],
    forgot: ['LET’S GET YOU BACK HOME', 'Forgot password?', 'Enter your email to request a reset link.', 'Request reset link'],
    reset: ['A FRESH START', 'Set a new password.', 'Choose a new password for your account.', 'Update password'],
  }[mode];
  return <div className="auth-shell"><div className="auth-card"><a className="brand auth-brand" href="#" onClick={e=>{e.preventDefault();navigate('login');}}><span className="brand-icon"><House size={24}/></span><span>violet<span className="brand-light">homes</span></span></a><div className="auth-art"><span className="auth-orbit"/><span className="auth-home"><House size={65} strokeWidth={1.2}/></span><span className="auth-dot"/></div><div className="eyebrow">{copy[0]}</div><h1>{copy[1]}</h1><p className="intro">{copy[2]}</p>{error && <div className="auth-error" role="alert">{error}</div>}{message && <div className="auth-success" role="status">{message}</div>}<form onSubmit={submit} className="auth-form">
    {mode === 'register' && <label>Full name<input name="name" autoComplete="name" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}
    {mode !== 'reset' && <label>Email address<div className="auth-field"><Mail size={17}/><input name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>}
    {mode !== 'forgot' && <label>Password<div className="auth-field"><LockKeyhole size={17}/><input name="password" type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='login'?'Your password':'At least 8 characters'}/><button type="button" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
    {(mode === 'register' || mode === 'reset') && <label>Confirm password<input name="confirm" type={visible?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password"/></label>}
    {mode==='login'&&<button type="button" className="auth-link forgot-link" onClick={()=>navigate('forgot')}>Forgot password?</button>}
    <button className="primary auth-submit" disabled={busy}>{busy?'Please wait…':copy[3]}{!busy&&<ArrowRight size={17}/>}</button>
    </form>{mode==='login'?<p className="auth-switch">New here? <button className="auth-link" onClick={()=>navigate('register')}>Create an account</button></p>:<p className="auth-switch"><button className="auth-link" onClick={()=>navigate('login')}>Back to login</button></p>}{mode==='forgot'&&<p className="auth-demo">Local demo: reset links appear in the backend terminal. No email is sent.</p>}<p className="auth-footer">Find your kind of place.</p></div></div>;
}

```

## frontend/src/components/PropertyCard.jsx

```
import PropertyImage from './PropertyImage';
import { Heart, BedDouble, Bath, Maximize, MapPin, ArrowUpRight } from 'lucide-react';
export const identity = x => `${x.source}:${x.id}`;
export const money = x => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(x);
export default function PropertyCard({item,saved,onSave,onOpen}){
 return <article className="property"><div className="property-art"><PropertyImage item={item}/><span className="status">{item.status}</span><button className={'heart '+(saved?'saved':'')} aria-label={saved?'Remove favorite':'Save favorite'} onClick={()=>onSave(item)}><Heart size={19} fill={saved?'currentColor':'none'}/></button><span className="source">{item.source} · {item.id}</span></div><div className="property-body"><div className="row"><h2>{money(item.price)}</h2><span className="match">{Number(item.score).toFixed(1)} match</span></div><h3>{item.address}</h3><p className="muted location"><MapPin size={13}/>{item.city}, {item.state} {item.zip}</p><div className="specs"><span><BedDouble size={15}/>{item.bedrooms} beds</span><span><Bath size={15}/>{item.bathrooms} baths</span><span><Maximize size={14}/>{item.sqft.toLocaleString()} ft²</span></div><button className="details" onClick={()=>onOpen(item)}>Explore property <ArrowUpRight size={17}/></button></div></article>
}

```

## frontend/src/components/PropertyImage.jsx

```
import { useState } from 'react';
export default function PropertyImage({item}) {
  const [failed,setFailed] = useState(false);
  // Same coordinates share a sample image across MLS feeds.
  const index = Math.abs(Math.round(item.latitude * 10000) + Math.round(item.longitude * 10000)) % 3 + 1;
  return <>{!failed ? <img className="property-photo" src={`/images/home-${index}.jpg`} alt="Illustrative house exterior; not a photograph of this listing" loading="lazy" onError={()=>setFailed(true)}/> : <div className="house"><div className="roof"/><div className="walls"><i/><i/><b/></div></div>}<span className="photo-disclaimer">Sample photo</span></>;
}

```

## frontend/src/components/PropertyMap.jsx

```
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { money } from './PropertyCard';

export default function PropertyMap({ items, onOpen }) {
  const container = useRef(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([38.85, -77.3], 10);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    const groups = new Map();
    items.forEach(item => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return;
      const key = `${item.latitude},${item.longitude}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const points = [];
    groups.forEach(rows => {
      const first = rows[0];
      const point = [first.latitude, first.longitude];
      points.push(point);
      const price = Math.min(...rows.map(x => x.price));
      const label = `$${(price / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${rows.length > 1 ? ` · ${rows.length}` : ''}`;
      const marker = L.marker(point, {
        icon: L.divIcon({ className: 'price-pin-wrap', html: `<span class="price-pin">${label}</span>`, iconSize: [95, 32], iconAnchor: [47, 16] }),
        title: rows.map(x => `${x.address}: ${money(x.price)}`).join('; '),
      }).addTo(map);
      // Build DOM with textContent: listing text is never interpolated as HTML.
      const popup = document.createElement('div');
      popup.className = 'map-popup';
      rows.forEach(item => {
        const row = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = money(item.price);
        const address = document.createElement('p'); address.textContent = item.address;
        const meta = document.createElement('small'); meta.textContent = `${item.city} · ${item.status} · ${item.source}`;
        row.append(title, address, meta);
        if (onOpen) {
          const button = document.createElement('button'); button.textContent = 'View property';
          button.addEventListener('click', () => onOpen(item)); row.append(button);
        }
        popup.append(row);
      });
      marker.bindPopup(popup);
    });
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); };
  }, [items, onOpen]);
  return <section className="map-section"><div ref={container} className="property-map" aria-label="Map of listing locations"/>{tileError && <p className="map-note" role="status">Map background unavailable. Prices and the address list below are still available.</p>}<p className="map-note">Locations and prices from the sample dataset. Shared coordinates are grouped. Map shows this page only.</p><div className="map-results">{items.map(item => <button key={`${item.source}:${item.id}`} disabled={!onOpen} onClick={() => onOpen?.(item)}><span>{item.address}<small>{item.city}, {item.state} · {item.source}</small></span><strong>{money(item.price)}</strong></button>)}</div></section>;
}

```

## frontend/src/main.jsx

```
import React from "react";
import { createRoot } from "react-dom/client";
import AuthGate from "./AuthGate";
import "./styles.css";
createRoot(document.getElementById("root")).render(<AuthGate />);

```

## frontend/src/pages/Plan.jsx

```
import { useState } from "react";
import { Check, Flag } from "lucide-react";
const steps = [
  "Set my target budget",
  "Choose my preferred neighborhoods",
  "Save a shortlist of homes",
  "Arrange property visits",
  "Review my next steps",
];
export default function Plan({ plan, setPlan }) {
  const [budget, setBudget] = useState(plan.budget || "");
  return (
    <>
      <div className="eyebrow">ONE STEP CLOSER</div>
      <h1>
        Your home.
        <br />
        <span>Your game plan.</span>
      </h1>
      <p className="intro">A little clarity goes a long way.</p>
      <section className="feature">
        <Flag />
        <h2>Build your next chapter</h2>
        <p>Keep your priorities together as you explore your options.</p>
        <label>
          My target budget
          <input
            type="number"
            min="1"
            placeholder="450000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <button
          className="primary"
          onClick={() => setPlan({ ...plan, budget })}
        >
          Save budget
        </button>
      </section>
      <h2>Your checklist</h2>
      <p className="muted">
        {(plan.done || []).length} of {steps.length} complete · saved on this
        device
      </p>
      <div className="checklist">
        {steps.map((step, i) => (
          <button
            key={step}
            className="check-row"
            onClick={() =>
              setPlan({
                ...plan,
                done: (plan.done || []).includes(i)
                  ? plan.done.filter((x) => x !== i)
                  : [...(plan.done || []), i],
              })
            }
          >
            <span className={(plan.done || []).includes(i) ? "checked" : ""}>
              {(plan.done || []).includes(i) && <Check size={16} />}
            </span>
            {step}
          </button>
        ))}
      </div>
    </>
  );
}

```

## frontend/src/pages/Search.jsx

```
import PropertyMap from '../components/PropertyMap';
import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import PropertyCard, { identity } from "../components/PropertyCard";
export const defaults = {
  city: "",
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  keyword: "",
  targetBudget: "",
  pageSize: "6",
  status: "",
};
export default function Search({ favorites, onSave, onOpen, onSaveSearch }) {
  const [view, setView] = useState("list");
  const [form, setForm] = useState(defaults),
    [query, setQuery] = useState(defaults),
    [page, setPage] = useState(1),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [expanded, setExpanded] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/listings?" + new URLSearchParams({ ...query, page }), {
      signal: controller.signal,
    })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw Error(body.error || "Search failed");
        return body;
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, page, retry]);
  function submit(e) {
    e.preventDefault();
    setPage(1);
    setQuery({ ...form });
  }
  return (
    <>
      <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
      <h1>
        Find a place.
        <br />
        <span>Make it yours.</span>
      </h1>
      <p className="intro">Thoughtfully matched homes, one search away.</p>
      <form className="search-panel" onSubmit={submit}>
        <div className="search-line">
          <SearchIcon size={20} />
          <input
            aria-label="City"
            placeholder="Search a city, e.g. Springfield"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle filters"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>
        <div className={"filters " + (expanded ? "expanded" : "")}>
          {[
            ["minPrice", "Min price"],
            ["maxPrice", "Max price"],
            ["minBedrooms", "Min bedrooms"],
            ["targetBudget", "Target budget"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={key === "targetBudget" ? 1 : 0}
                step={1}
                placeholder="Any"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Description keyword
            <input
              placeholder="e.g. yard"
              value={form.keyword}
              onChange={(e) => setForm({ ...form, keyword: e.target.value })}
            />
          </label>
          <label>Listing status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="">All statuses</option><option value="active">Active</option><option value="pending">Pending</option><option value="sold">Sold</option></select></label>
          <label>
            Per page
            <select
              value={form.pageSize}
              onChange={(e) => setForm({ ...form, pageSize: e.target.value })}
            >
              {[3, 6, 12].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="row actions">
          <button className="primary" type="submit">
            Search homes <SearchIcon size={16} />
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setForm(defaults);
              setQuery({ ...defaults });
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>
      <div className="section-title">
        <div>
          <h2>Discover your next home</h2>
          <p className="muted">
            {loading
              ? "Finding your matches…"
              : `${data?.total ?? 0} listings · ranked by relevance`}
          </p>
        </div>
        <button className="secondary" onClick={() => onSaveSearch(query)}>
          <Bookmark size={15} />
          Save search
        </button>
      </div>
      <div className="view-toggle" aria-label="Result view"><button className={view==="list"?"selected":""} onClick={()=>setView("list")}>List</button><button className={view==="map"?"selected":""} onClick={()=>setView("map")}>Map</button></div>
      {loading ? (
        <div className="empty" role="status">
          Finding the right places for you…
        </div>
      ) : error ? (
        <div className="empty" role="alert">
          <h2>Search unavailable</h2>
          <p>{error}</p>
          <button className="secondary" onClick={() => setRetry(retry + 1)}>
            Try again
          </button>
        </div>
      ) : !data?.items.length ? (
        <div className="empty">
          <h2>No homes found</h2>
          <p>Try another city or broader filters.</p>
        </div>
      ) : (
        <>
          {view === "map" ? <PropertyMap items={data.items} onOpen={onOpen}/> : <div className="grid">
            {data.items.map((item) => (
              <PropertyCard
                key={identity(item)}
                item={item}
                saved={favorites.some((x) => identity(x) === identity(item))}
                onSave={onSave}
                onOpen={onOpen}
              />
            ))}
          </div>}
          <div className="pagination">
            <button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {page} of {data.totalPages}
            </span>
            <button
              aria-label="Next page"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </>
  );
}

```

## frontend/src/styles.css

```
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{font-family:'DM Sans',system-ui,sans-serif;color:#f4f1fa;background:#100e18;font-synthesis:none;color-scheme:dark;--muted:#9d97ae;--purple:#ad8bfa;--line:#302a40}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button,a,input,select{-webkit-tap-highlight-color:transparent}button{cursor:pointer}button:disabled{opacity:.35;cursor:not-allowed}button:focus-visible,a:focus-visible{outline:2px solid #c4aaff;outline-offset:4px}button{color:inherit}a{color:inherit}h1,h2,h3,p{margin-top:0}h1,h2,h3{font-family:Manrope,system-ui,sans-serif}h1{font-size:clamp(36px,5vw,57px);line-height:1.12;letter-spacing:-2px;margin-bottom:16px}h1 span{color:#b99af9}h2{font-size:20px}h3{font-size:15px}p{line-height:1.65}.muted,.intro{color:var(--muted)}.intro{margin-bottom:30px}.eyebrow{color:#c2a8f7;font-size:10px;letter-spacing:2.3px;font-weight:700;margin-bottom:17px}.sidebar{width:225px;position:fixed;inset:0 auto 0 0;background:#15111f;border-right:1px solid var(--line);padding:32px 20px;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-size:22px;font-weight:700;letter-spacing:-1px}.brand-light{font-weight:400;color:#b2a8c1}.brand-icon{background:#a47bea;color:#160e25;border-radius:12px;width:39px;height:39px;display:grid;place-items:center}.nav-caption{color:#756c85;font-size:10px;letter-spacing:2px;margin:55px 14px 18px}.sidebar nav{display:grid;gap:9px}.sidebar nav button{border:0;background:none;color:#a49aae;text-align:left;display:flex;align-items:center;gap:14px;padding:15px;border-radius:12px}.sidebar nav button.active{color:#d2b9ff;background:#30223f}.sidebar nav small{margin-left:auto}.sidebar-bottom{margin-top:auto;display:flex;align-items:center;gap:10px;font-size:12px}.sidebar-bottom small{display:block;font-size:9px;color:var(--muted);margin-top:5px}.avatar{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#35264c;color:#d2b8ff;font-weight:700}.workspace{margin-left:225px}header{height:83px;border-bottom:1px solid var(--line);padding:0 42px;display:flex;align-items:center;gap:24px;font-size:12px}.breadcrumb{color:#a99cb8}.breadcrumb span{color:#eee8f5}.header-pill{margin-left:auto;font-size:10px;color:#a89db7;border:1px solid var(--line);border-radius:30px;padding:9px 13px}main{max-width:1250px;margin:auto;padding:42px 42px 24px}.search-panel{background:#1b1626;border:1px solid #3c3050;padding:15px;border-radius:18px;margin-bottom:34px}.search-line{display:flex;align-items:center;gap:12px;color:#b697e8}.search-line input{border:0;background:transparent;flex:1;min-width:0;padding:12px 0;color:white;outline:none}.icon-button{display:grid;place-items:center;padding:11px;border-radius:10px;background:#332444;border:1px solid #4b3560}.filters{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.filters label,.feature label{font-size:11px;color:#b7abc8;display:grid;gap:7px}input,select{min-width:0;background:#130f1c;border:1px solid #382d48;border-radius:9px;padding:12px;color:#f0e9fb;outline-color:#ad8bfa}.row{display:flex;align-items:center;justify-content:space-between;gap:8px}.actions{margin-top:15px;justify-content:flex-start}.primary{border:0;background:#b392f3;color:#1b102c;font-size:12px;font-weight:700;padding:13px 20px;border-radius:10px;display:inline-flex;justify-content:center;align-items:center;gap:10px}.secondary{border:1px solid #443451;background:#241b30;border-radius:9px;padding:10px 13px;font-size:11px;display:flex;gap:7px;align-items:center}.text-button{background:none;border:0;color:#baa4dc;font-size:12px;padding:10px}.section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:23px}.section-title h2{margin:0 0 4px}.section-title p{font-size:11px;margin:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.property{border-radius:17px;background:#1b1725;overflow:hidden;border:1px solid #342a43}.property-art{height:185px;position:relative;overflow:hidden;background:radial-gradient(ellipse at 70% 5%,#8a6b9e80,transparent 65%),linear-gradient(155deg,#30233e,#594368 70%,#2e2438)}.property:nth-child(3n+2) .property-art{background:radial-gradient(ellipse at 15% 20%,#87769090,transparent 60%),linear-gradient(155deg,#252a3a,#5c5977 70%,#343044)}.property:nth-child(3n) .property-art{background:linear-gradient(145deg,#54415b,#9c8090)}.house{position:absolute;width:190px;height:140px;left:50%;bottom:-5px;transform:translateX(-50%)}.roof{position:absolute;top:0;width:190px;height:80px;background:#201a2b;clip-path:polygon(50% 0,100% 100%,0 100%)}.walls{position:absolute;top:70px;left:15px;width:160px;height:95px;background:#b3a0c6;box-shadow:8px 0 #80708f}.walls i{position:absolute;top:19px;left:17px;width:28px;height:32px;background:#4d375e;border:4px solid #e2d0e8}.walls i:nth-child(2){left:auto;right:17px}.walls b{position:absolute;bottom:0;left:65px;background:#47314f;width:29px;height:52px}.status{position:absolute;top:13px;left:13px;background:#17111ed9;color:#e4d8f3;border:1px solid #a187b966;border-radius:20px;padding:5px 10px;font-size:10px;text-transform:capitalize}.heart{position:absolute;right:12px;top:12px;border:1px solid #bfa6d466;background:#21182cbf;border-radius:50%;width:34px;height:34px;display:grid;place-items:center}.heart.saved{color:#cfafff}.source{position:absolute;bottom:10px;left:13px;font-size:9px;color:#f4eafa;background:#1b152b80;padding:5px 8px;border-radius:6px}.property-body{padding:19px}.property-body h2{font-size:24px;letter-spacing:-1px;margin:0}.match{background:#332444;color:#ceb0ff;border-radius:7px;padding:5px 7px;font-size:9px;white-space:nowrap}.property-body h3{margin:12px 0 3px}.location{display:flex;align-items:center;gap:4px;font-size:11px;margin-bottom:15px}.specs{display:flex;gap:12px;flex-wrap:wrap;color:#c6bdd3;font-size:11px}.specs span{display:flex;align-items:center;gap:5px}.details{display:flex;justify-content:space-between;align-items:center;background:transparent;border:0;border-top:1px solid var(--line);width:100%;margin-top:17px;padding:13px 0 0;font-size:11px;color:#c6a6fa}.pagination{display:flex;align-items:center;justify-content:center;gap:20px;margin:28px 0;font-size:12px;color:#bba9ce}.pagination button{background:#2c203c;border:1px solid #483456;border-radius:9px;padding:9px;display:flex}.empty{text-align:center;border:1px solid var(--line);border-radius:20px;padding:55px 24px;background:radial-gradient(ellipse at top,#30213e,#191420 70%);margin:25px 0}.empty p{max-width:410px;margin:0 auto 25px;color:var(--muted);font-size:14px}.empty-icon{display:inline-grid;place-items:center;width:90px;height:90px;background:#3c2852;color:#c8a5ff;border-radius:26px;margin-bottom:25px}.feature{padding:27px;background:linear-gradient(130deg,#47305d,#251a35);border:1px solid #684986;border-radius:20px;margin-bottom:30px;max-width:650px}.feature>svg{color:#d2b5ff;margin-bottom:18px}.feature p{color:#c2b1d1;font-size:13px}.feature label{max-width:280px;margin-bottom:15px}.checklist{max-width:650px;border:1px solid var(--line);border-radius:16px;overflow:hidden}.check-row{display:flex;align-items:center;gap:15px;width:100%;border:0;border-bottom:1px solid var(--line);background:#1b1625;padding:20px;text-align:left;font-size:13px}.check-row>span{width:24px;height:24px;border:1px solid #665077;border-radius:7px;display:grid;place-items:center}.checked{background:#af8be9;color:#170f22}.saved-search{padding:22px;border:1px solid var(--line);border-radius:14px;display:flex;align-items:center;gap:18px;margin-bottom:15px;background:#1b1625}.saved-search>svg{color:#c2a1f5}.saved-search h3,.saved-search p{margin:0}.saved-search p{font-size:11px}.saved-search button{margin-left:auto}footer{display:flex;justify-content:space-between;font-size:9px;letter-spacing:2px;color:#8d7e9e;padding-top:35px;margin-top:35px;border-top:1px solid var(--line)}footer span{letter-spacing:0}.mobile-nav,.mobile-brand{display:none}.notice{display:flex;align-items:center;justify-content:space-between;background:#332343;border:1px solid #735492;padding:13px;border-radius:10px;margin-bottom:20px;font-size:12px}.notice button,.close{background:transparent;border:0}.modal-backdrop{position:fixed;inset:0;background:#08050bd9;z-index:10;display:grid;place-items:center;padding:20px}.modal{position:relative;width:min(100%,520px);background:#20172e;border:1px solid #644482;padding:35px;border-radius:22px;max-height:90vh;overflow:auto}.modal h1{font-size:36px;margin:25px 0}.close{position:absolute;right:13px;top:13px}.map-link{text-decoration:none}
@media(min-width:1200px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:950px){.sidebar{width:185px;padding:25px 13px}.brand{font-size:19px;gap:7px}.workspace{margin-left:185px}main{padding:32px 24px}header{padding:0 24px}.header-pill{display:none}.breadcrumb{margin-right:auto}}@media(max-width:650px){.sidebar{display:none}.workspace{margin-left:0}header{height:67px;padding:0 22px;justify-content:space-between}.breadcrumb{display:none}.mobile-brand{display:flex;align-items:center;gap:8px;font-weight:700;color:#d0b3ff;font-size:17px}.mobile-nav{display:flex;position:fixed;bottom:0;left:0;right:0;background:#18121ff5;backdrop-filter:blur(15px);border-top:1px solid #382947;justify-content:space-around;padding:11px 5px max(12px,env(safe-area-inset-bottom));z-index:5}.mobile-nav button{display:grid;justify-items:center;gap:5px;background:transparent;border:0;color:#8e819f;font-size:9px;padding:4px 10px}.mobile-nav button.active{color:#c5a1ff}main{padding:30px 20px 100px}h1{font-size:42px;letter-spacing:-1.8px}.intro{font-size:13px}.filters{display:none;grid-template-columns:repeat(2,minmax(0,1fr))}.filters.expanded{display:grid}.grid{grid-template-columns:1fr}.property-art{height:205px}.section-title h2{font-size:17px}.secondary{font-size:10px;padding:10px}.search-line input{font-size:12px}.search-panel{padding:12px}.property-body{padding:19px}.feature{padding:23px}.saved-search{padding:15px;gap:10px}.saved-search .text-button{font-size:10px}.modal{padding:29px 23px}.modal h1{font-size:32px}footer{font-size:8px;letter-spacing:1px}}

/* Account screens */
.auth-shell{min-height:100dvh;display:grid;place-items:center;padding:30px 20px;background:radial-gradient(ellipse at 50% 0,#37204480,transparent 60%),#100e18}.auth-card{width:min(100%,430px);padding:30px;background:#181220;border:1px solid #3c2b4d;border-radius:25px;box-shadow:0 30px 100px #0005}.auth-brand{justify-content:center;margin-bottom:30px}.auth-art{height:120px;position:relative;display:grid;place-items:center;margin-bottom:20px}.auth-home{color:#c2a1ff;z-index:1;transform:rotate(-7deg);background:linear-gradient(140deg,#4e3268,#20162e);width:105px;height:105px;display:grid;place-items:center;border:1px solid #7954a2;border-radius:29px;box-shadow:0 12px 35px #0005}.auth-orbit{position:absolute;width:230px;height:80px;border:1px solid #624779;border-radius:50%;transform:rotate(-17deg)}.auth-dot{position:absolute;width:12px;height:12px;background:#c4a3ff;border-radius:50%;left:48px;bottom:24px;box-shadow:0 0 20px #b18bf6}.auth-card .eyebrow{text-align:center;font-size:9px;letter-spacing:1.8px}.auth-card h1{text-align:center;font-size:32px;letter-spacing:-1px}.auth-card .intro{text-align:center;font-size:13px;margin-bottom:25px}.auth-form{display:grid;gap:17px}.auth-form label{display:grid;gap:8px;font-size:12px;color:#c9bbd9}.auth-field{display:flex;align-items:center;border:1px solid #382d48;background:#130f1c;border-radius:10px;padding:0 12px;color:#a88cc9}.auth-field:focus-within{outline:2px solid #ad8bfa}.auth-field input{width:100%;border:0;background:transparent;outline:none;min-width:0}.auth-field button{background:transparent;border:0;color:#ae98c8;padding:5px;display:flex}.auth-submit{width:100%;margin-top:4px;padding:15px}.auth-link{background:transparent;border:0;color:#c2a0ff;font-size:12px;padding:0}.forgot-link{justify-self:end}.auth-switch{font-size:12px;color:#aaa0b8;text-align:center;margin:24px 0 0}.auth-switch button{font-weight:700}.auth-footer{text-align:center;margin:30px 0 0;color:#776986;font-size:10px;letter-spacing:1.5px}.auth-error,.auth-success{padding:12px;border-radius:10px;margin-bottom:20px;font-size:12px;line-height:1.6}.auth-error{color:#ffc0d0;background:#54253655;border:1px solid #92485a}.auth-success{color:#c3efdb;background:#284e3d55;border:1px solid #46735e}.auth-demo{font-size:11px;color:#a494b4;line-height:1.6;text-align:center;margin-top:18px}.auth-loading{display:grid;place-items:center;min-height:100dvh;color:#c5a2ff}.account-strip{display:flex;align-items:center;justify-content:flex-end;gap:15px;padding:10px 24px;background:#24182f;border-bottom:1px solid #463054;font-size:12px}.account-strip button{background:#3e2952;border:1px solid #715093;border-radius:8px;padding:7px 12px;color:#e6d5ff}.auth-session-error{padding:10px;background:#542536;color:#ffc0d0;margin:0}
@media(max-width:650px){.auth-shell{padding:20px 15px}.auth-card{padding:25px 22px}.auth-art{height:105px}.account-strip{justify-content:space-between;padding:10px 20px}}
/* Mobile application frame, including desktop previews */
.sidebar,.breadcrumb,.header-pill{display:none}.workspace{margin-left:0}.app{max-width:480px;min-height:100dvh;margin:0 auto;background:#100e18;border-inline:1px solid #302a40}body{background:#08060d}.app header{height:68px;padding:0 22px;justify-content:space-between}.mobile-brand{display:flex;align-items:center;gap:8px;color:#d0b3ff;font-size:18px;font-weight:700}.app main{padding:28px 20px 110px}.app h1{font-size:40px;letter-spacing:-1.5px}.intro{font-size:13px}.grid{grid-template-columns:1fr}.filters{display:none;grid-template-columns:repeat(2,minmax(0,1fr))}.filters.expanded{display:grid}.search-line input{font-size:12px}.section-title h2{font-size:17px}.property-art{height:205px}.mobile-nav{display:flex;position:fixed;bottom:0;left:50%;right:auto;transform:translateX(-50%);width:min(100%,480px);z-index:5;justify-content:space-around;padding:12px 5px max(12px,env(safe-area-inset-bottom));background:#18121ff5;backdrop-filter:blur(15px);border-top:1px solid #382947}.mobile-nav button{display:grid;justify-items:center;gap:5px;padding:5px 10px;background:transparent;border:0;color:#8e819f;font-size:10px}.mobile-nav button.active{color:#c5a1ff}.account-strip{max-width:480px;margin:auto}.auth-session-error{max-width:480px;margin:auto}
/* Listing photography and price map */
.property-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.property-art:has(.property-photo)::after{content:'';position:absolute;inset:50% 0 0;background:linear-gradient(transparent,#120d20a6);pointer-events:none}.property-art .status,.property-art .heart,.property-art .source{z-index:1}.photo-disclaimer{position:absolute;bottom:10px;right:10px;z-index:1;background:#160f24c9;color:#e5d8f6;border-radius:5px;padding:4px 6px;font-size:9px}.detail-photo{position:relative;overflow:hidden;height:210px;border-radius:14px;margin:15px 0 24px;background:#352544}.view-toggle{display:flex;padding:4px;background:#1e172a;border:1px solid #423151;border-radius:12px;gap:4px;margin-bottom:20px}.view-toggle button{flex:1;border:0;padding:11px;border-radius:8px;background:transparent;color:#b7a7c8;font-size:12px}.view-toggle button.selected{background:#b392f3;color:#1b102c;font-weight:700}.property-map{height:370px;border-radius:16px;border:1px solid #5f4577;z-index:0;background:#c3c8bd}.leaflet-container{font-family:'DM Sans',sans-serif;color:#221530}.price-pin-wrap{background:transparent;border:0}.price-pin{display:flex;align-items:center;justify-content:center;height:32px;white-space:nowrap;padding:0 9px;background:#6b35a5;color:#fff;border:2px solid #f2e5ff;border-radius:20px;box-shadow:0 3px 12px #23112b66;font-size:11px;font-weight:700}.map-popup{min-width:180px;max-height:250px;overflow:auto}.map-popup>div{padding:8px 0;border-bottom:1px solid #eee}.map-popup p{margin:5px 0;font-size:12px}.map-popup small{display:block;font-size:10px}.map-popup button{display:block;margin:8px 0 0;border:0;background:#6c3a9e;color:white;padding:7px 10px;border-radius:6px;font-size:11px}.map-note{font-size:10px;color:#b7a7c8;line-height:1.6;margin:12px 0}.map-results{display:grid;gap:7px;margin:15px 0}.map-results button{display:flex;justify-content:space-between;gap:10px;align-items:center;text-align:left;border:1px solid #3d2b4d;background:#22172f;border-radius:10px;padding:12px;font-size:11px}.map-results button:disabled{opacity:1;cursor:default}.map-results small{display:block;font-size:9px;margin-top:5px;color:#b9a8ca}.map-results strong{color:#d2b3ff;white-space:nowrap}.modal .property-map{height:230px}.modal .map-results{display:none}.map-link{margin-top:10px}.leaflet-control-attribution{font-size:10px!important}

```

## frontend/vite.config.js

```
import { defineConfig } from 'vite';
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { host: '0.0.0.0', proxy: { '/api': 'http://127.0.0.1:5000' } },
});

```

