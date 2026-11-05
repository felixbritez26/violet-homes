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
