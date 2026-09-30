"""Small executable models, not production storage or a search engine."""
import re
import sqlite3

MAX_AMOUNT = 2**63 - 1


class SearchIndex:
    def __init__(self):
        self.documents = {}
        self.postings = {}

    @staticmethod
    def tokens(text):
        return set(re.findall(r"\w+", text.casefold()))

    def apply(self, doc_id, version, text, deleted=False):
        if not isinstance(version, int) or isinstance(version, bool) or version < 1:
            raise ValueError("version must be a positive integer")
        old = self.documents.get(doc_id)
        payload = (version, text, deleted)
        if old and version < old[0]:
            return False
        if old and version == old[0]:
            if old != payload:
                raise ValueError("conflicting payload for the same version")
            return False
        if old and not old[2]:
            for token in self.tokens(old[1]):
                self.postings[token].discard(doc_id)
        self.documents[doc_id] = payload  # Deletion remains a versioned tombstone.
        if not deleted:
            for token in self.tokens(text):
                self.postings.setdefault(token, set()).add(doc_id)
        return True

    def search(self, query, allowed_ids):
        """AND terms; the authoritative permission set is passed on every read."""
        terms = self.tokens(query)
        if not terms:
            return []
        candidates = set.intersection(*(self.postings.get(t, set()) for t in terms))
        return sorted(candidates.intersection(allowed_ids))


class Ledger:
    """One currency, one local SQLite database, no external financial effects."""
    def __init__(self, filename):
        self.filename = filename

    def connect(self):
        return sqlite3.connect(self.filename, timeout=10, isolation_level=None)

    def initialize(self):
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY, balance INTEGER NOT NULL
                    CHECK(typeof(balance) = 'integer' AND balance >= 0));
                CREATE TABLE IF NOT EXISTS requests (
                    key TEXT PRIMARY KEY, source TEXT NOT NULL, destination TEXT NOT NULL,
                    amount INTEGER NOT NULL, outcome TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS operations (
                    key TEXT PRIMARY KEY, source TEXT NOT NULL, destination TEXT NOT NULL,
                    amount INTEGER NOT NULL CHECK(amount > 0));
                CREATE TABLE IF NOT EXISTS entries (
                    operation_key TEXT NOT NULL, account TEXT NOT NULL, delta INTEGER NOT NULL,
                    PRIMARY KEY(operation_key, account));
            """)

    def seed(self, accounts):
        # Bootstrap only; these initial balances are outside the transfer journal.
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            try:
                for account, balance in accounts.items():
                    if (not isinstance(balance, int) or isinstance(balance, bool)
                            or balance < 0 or balance > MAX_AMOUNT):
                        raise ValueError("invalid initial balance")
                    db.execute("INSERT INTO accounts VALUES (?, ?)", (account, balance))
                db.commit()
            except BaseException:
                db.rollback()
                raise

    def transfer(self, key, source, destination, amount, fail_before_commit=False):
        if (not key or source == destination or not isinstance(amount, int)
                or isinstance(amount, bool) or amount <= 0 or amount > MAX_AMOUNT):
            raise ValueError("invalid transfer")
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")  # Serialize this model's writers.
            try:
                previous = db.execute(
                    "SELECT source, destination, amount, outcome FROM requests WHERE key=?", (key,)
                ).fetchone()
                if previous:
                    if previous[:3] != (source, destination, amount):
                        raise ValueError("idempotency conflict")
                    db.commit()
                    return "replayed" if previous[3] == "applied" else previous[3]
                balances = dict(db.execute(
                    "SELECT id, balance FROM accounts WHERE id IN (?, ?)", (source, destination)
                ))
                if source not in balances or destination not in balances:
                    raise ValueError("unknown account")
                if balances[source] < amount:
                    db.execute("INSERT INTO requests VALUES (?, ?, ?, ?, ?)",
                               (key, source, destination, amount, "insufficient"))
                    db.commit()
                    return "insufficient"
                if balances[destination] + amount > MAX_AMOUNT:
                    raise ValueError("destination balance exceeds integer range")
                db.execute("INSERT INTO requests VALUES (?, ?, ?, ?, ?)",
                           (key, source, destination, amount, "applied"))
                db.execute("INSERT INTO operations VALUES (?, ?, ?, ?)",
                           (key, source, destination, amount))
                db.executemany("INSERT INTO entries VALUES (?, ?, ?)",
                               [(key, source, -amount), (key, destination, amount)])
                db.execute("UPDATE accounts SET balance=balance-? WHERE id=?", (amount, source))
                db.execute("UPDATE accounts SET balance=balance+? WHERE id=?", (amount, destination))
                if fail_before_commit:
                    raise RuntimeError("injected interruption before commit")
                db.commit()
                return "applied"
            except BaseException:
                db.rollback()
                raise

    def snapshot(self):
        with self.connect() as db:
            db.execute("BEGIN")
            balances = dict(db.execute("SELECT id, balance FROM accounts"))
            operations = db.execute("SELECT key, source, destination, amount FROM operations").fetchall()
            entries = db.execute("SELECT operation_key, account, delta FROM entries").fetchall()
            db.commit()
            return balances, operations, entries
