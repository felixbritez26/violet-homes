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
