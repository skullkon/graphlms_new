#!/usr/bin/env python3
"""Create a consistent SQLite snapshot; keep fourteen daily backups."""
from datetime import datetime, timezone
from pathlib import Path
import os
import sqlite3

os.umask(0o077)
root = Path('/var/backups/graphlms')
root.mkdir(parents=True, exist_ok=True)
target = root / (datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.db')
with sqlite3.connect('file:/var/lib/graphlms/app.db?mode=ro', uri=True) as source:
    with sqlite3.connect(target) as destination:
        source.backup(destination)
        assert destination.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
for old in sorted(root.glob('*.db'), reverse=True)[14:]:
    old.unlink()
print('Database backup verified:', target.name)
