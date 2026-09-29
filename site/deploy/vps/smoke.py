#!/usr/bin/env python3
"""Verify production auth and cross-session progress with a disposable account.

Prints the test email for subsequent removal. Never prints credentials/cookies.
"""
import http.cookiejar
import json
import secrets
import urllib.error
import urllib.request

BASE = 'https://learn.186.246.26.166.sslip.io/backend'
email = 'deploy-check-' + secrets.token_hex(6) + '@example.invalid'
password = secrets.token_urlsafe(32)

def client():
    jar = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar)), jar

def request(opener, jar, path, method='GET', data=None, csrf=True):
    headers = {'Content-Type': 'application/json'}
    if csrf:
        for cookie in jar:
            if cookie.name == 'goroutine.csrf':
                headers['X-CSRF-Token'] = cookie.value
    req = urllib.request.Request(BASE + path, method=method, headers=headers,
        data=None if data is None else json.dumps(data).encode())
    with opener.open(req, timeout=30) as response:
        return json.load(response)

a, cookies_a = client()
b, cookies_b = client()
registered = request(a, cookies_a, '/auth/register', 'POST', {'email': email, 'password': password})
print('Test account:', email)
assert all(c.secure for c in cookies_a)
assert any(c.name == 'goroutine.session' and c.has_nonstandard_attr('HttpOnly') for c in cookies_a)
key = 'system-design:deployment-check'
# The payload exceeds Express's default 100 KB JSON limit.
note = 'Проверка сохранения развёрнутых заметок. ' * 4000
request(a, cookies_a, '/me/progress', 'PUT', {'solved': [key], 'code': {key: note}})
request(b, cookies_b, '/auth/login', 'POST', {'email': email, 'password': password})
restored = request(b, cookies_b, '/me/progress')
assert key in restored['solved'] and restored['code'][key] == note
try:
    request(b, cookies_b, '/me/progress', 'PUT', {'code': {key: 'invalid'}}, csrf=False)
    raise AssertionError('Mutation without CSRF was accepted')
except urllib.error.HTTPError as e:
    assert e.code == 403
assert request(b, cookies_b, '/me/progress')['code'][key] == note
print('PASS: register, login, secure cookies, independent session, large draft, CSRF')
