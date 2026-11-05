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
