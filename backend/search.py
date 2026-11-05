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
