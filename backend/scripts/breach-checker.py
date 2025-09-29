#!/usr/bin/env python3
"""
Real-time breach checker using HaveIBeenPwned API
Modified for VIGIL integration

Improvements:
- Uses official HIBP v3 API if HIBP_API_KEY is set; otherwise falls back to the
  legacy unifiedsearch endpoint.
- Returns precise status codes so the backend can avoid generic 500s.
- Adds clearer error messages and Retry-After hints when rate-limited.
"""

import sys
import os
import json
import urllib.request
import urllib.parse
import urllib.error
import time
from datetime import datetime


def _json_success(email, breaches, pastes, message=None):
    return {
        'success': True,
        'status': 200,
        'email': email,
        'breaches': breaches,
        'pastes': pastes,
        'totalBreaches': len(breaches),
        'totalPastes': len(pastes),
        'checkedAt': datetime.now().isoformat(),
        **({'message': message} if message else {})
    }


def _json_error(email, status, message, retry_after=None):
    payload = {
        'success': False,
        'status': status,
        'email': email,
        'error': message
    }
    if retry_after:
        payload['retryAfter'] = retry_after
    return payload


def _map_breach_fields(breach):
    return {
        'name': breach.get('Name', 'Unknown'),
        'title': breach.get('Title', 'Unknown'),
        'domain': breach.get('Domain', 'Unknown'),
        'breachDate': breach.get('BreachDate', ''),
        'addedDate': breach.get('AddedDate', ''),
        'pwnCount': breach.get('PwnCount', 0),
        'description': breach.get('Description', ''),
        'dataClasses': breach.get('DataClasses', []),
        'isVerified': breach.get('IsVerified', False),
        'isSensitive': breach.get('IsSensitive', False),
        'logoPath': breach.get('LogoPath', '')
    }


def check_breach(email: str):
    """Check if email has been involved in any data breaches"""
    api_key = os.getenv('HIBP_API_KEY')

    # Common headers
    base_headers = {
        # Use a common browser UA to improve acceptance of the legacy unifiedsearch endpoint
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.8'
    }

    try:
        if api_key:
            # Use official API v3 when a key is provided
            quoted = urllib.parse.quote(email)
            url = f'https://haveibeenpwned.com/api/v3/breachedaccount/{quoted}?truncateResponse=false&includeUnverified=true'
            headers = {**base_headers, 'hibp-api-key': api_key}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode('utf-8')
                breaches_raw = json.loads(raw)
                # The v3 endpoint returns a list of breaches
                breaches = [_map_breach_fields(b) for b in breaches_raw] if isinstance(breaches_raw, list) else []
                # Pastes API has been deprecated; keep empty for compatibility
                pastes = []
                if not breaches:
                    return _json_success(email, [], [], 'No breaches found for this email address')
                return _json_success(email, breaches, pastes)
        else:
            # Fallback to legacy unifiedsearch (may be rate-limited or blocked)
            url = 'https://haveibeenpwned.com/unifiedsearch/' + urllib.parse.quote(email)
            # First attempt with Chrome-like UA
            headers1 = {**base_headers, 'Referer': 'https://haveibeenpwned.com/', 'Origin': 'https://haveibeenpwned.com'}
            req = urllib.request.Request(url, headers=headers1)
            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
            except urllib.error.HTTPError as e:
                # Retry once with a Safari-like UA and a short backoff for 401/403/429/503
                if e.code in (401, 403, 429, 503):
                    time.sleep(1.2)
                    safari_headers = dict(headers1)
                    safari_headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
                    req2 = urllib.request.Request(url, headers=safari_headers)
                    with urllib.request.urlopen(req2) as resp2:
                        data = json.loads(resp2.read().decode('utf-8'))
                else:
                    raise

            breaches = []
            if 'Breaches' in data and data['Breaches']:
                for breach in data['Breaches']:
                    breaches.append(_map_breach_fields(breach))
            pastes = []
            if 'Pastes' in data and data['Pastes']:
                for paste in data['Pastes']:
                    pastes.append({
                        'source': paste.get('Source', 'Unknown'),
                        'id': paste.get('Id', ''),
                        'title': paste.get('Title', ''),
                        'date': paste.get('Date', ''),
                        'emailCount': paste.get('EmailCount', 0)
                    })
            message = 'No breaches found for this email address' if not breaches else None
            return _json_success(email, breaches, pastes, message)

    except urllib.error.HTTPError as e:
        # Map common HIBP responses
        if e.code == 404:
            return _json_success(email, [], [], 'No breaches found for this email address')
        # Translate common upstream authorization/rate-limit failures to 503 so the UI shows a friendly message
        mapped_status = 503 if e.code in (401, 403, 429) else e.code
        retry_after = None
        try:
            retry_after = e.headers.get('Retry-After') if hasattr(e, 'headers') else None
        except Exception:
            pass
        return _json_error(email, mapped_status, f'HTTP Error {e.code}: {e.reason}', retry_after)
    except urllib.error.URLError as e:
        return _json_error(email, 502, f'Network error: {getattr(e, "reason", str(e))}')
    except Exception as e:
        return _json_error(email, 500, str(e))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'success': False, 'status': 400, 'error': 'Email address required'}))
        sys.exit(1)

    email = sys.argv[1].strip()

    if not email or '@' not in email:
        print(json.dumps({'success': False, 'status': 400, 'error': 'Valid email address required'}))
        sys.exit(1)

    result = check_breach(email)
    print(json.dumps(result, indent=2))
