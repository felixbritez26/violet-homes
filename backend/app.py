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
