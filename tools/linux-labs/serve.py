#!/usr/bin/env python3
"""Учебный HTTP-сервер только на loopback; ОС выбирает свободный порт."""
import functools
import http.server
import pathlib
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: serve.py DIRECTORY PORT_FILE')
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=sys.argv[1])
with http.server.HTTPServer(('127.0.0.1', 0), handler) as server:
    pathlib.Path(sys.argv[2]).write_text(str(server.server_port), encoding='utf-8')
    server.serve_forever()
