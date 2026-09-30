#!/usr/bin/env python3
"""Deterministic crash/replay lab. Python standard library; no external services."""
import argparse
from contextlib import closing
import json
import sqlite3
import tempfile
from pathlib import Path


EVENTS = [
    {"id": "a", "minute": 0, "value": 2},
    {"id": "b", "minute": 2, "value": 3},
    {"id": "c", "minute": 1, "value": 4},
    {"id": "a", "minute": 0, "value": 2},  # repeated delivery
    {"id": "d", "minute": 5, "value": 7},
    {"id": "e", "minute": 0, "value": 11},  # too late for grace=3
]


def connect(path):
    db = sqlite3.connect(path)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS inbox(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS effects(id TEXT PRIMARY KEY, value INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS progress(partition_id INTEGER PRIMARY KEY, next_offset INTEGER NOT NULL);
        INSERT OR IGNORE INTO progress VALUES(0, 0);
    """)
    return db


def delivery(path, mode, crash=False):
    """Crash here means losing process state at a named durable boundary."""
    with closing(connect(path)) as db:
        offset = db.execute("SELECT next_offset FROM progress WHERE partition_id=0").fetchone()[0]
        delivered = 0
        for current in range(offset, 3):
            event_id = f"item-{current}"
            delivered += 1
            if mode == "early":
                with db:
                    db.execute("UPDATE progress SET next_offset=?", (current + 1,))
                if crash:
                    return delivered
            with db:
                if mode == "safe":
                    payload = json.dumps({"value": current + 1})
                    added = db.execute("INSERT OR IGNORE INTO inbox VALUES(?, ?)",
                                       (event_id, payload)).rowcount
                    if added:
                        db.execute("INSERT INTO effects VALUES(?, ?)", (event_id, current + 1))
                    else:
                        previous = db.execute("SELECT payload FROM inbox WHERE id=?",
                                              (event_id,)).fetchone()[0]
                        if json.loads(previous) != json.loads(payload):
                            raise ValueError("same SQL inbox ID with different contents")
                else:
                    # Unique attempted-effect ID: demonstrates the bug without relying on exceptions.
                    attempt = db.execute("SELECT COUNT(*) FROM effects").fetchone()[0]
                    db.execute("INSERT INTO effects VALUES(?, ?)", (f"attempt-{attempt}", current + 1))
            if crash:
                return delivered
            with db:
                db.execute("UPDATE progress SET next_offset=?", (current + 1,))
        return delivered


def inspect(path):
    db = connect(path)
    result = {
        "effects": db.execute("SELECT COUNT(*) FROM effects").fetchone()[0],
        "sum": db.execute("SELECT COALESCE(SUM(value),0) FROM effects").fetchone()[0],
        "next_offset": db.execute("SELECT next_offset FROM progress").fetchone()[0],
    }
    db.close()
    return result


def windows(events, grace):
    """One-minute windows; close when window_end + grace <= max seen event time.

    max seen is an explicit teaching policy, not a universal broker watermark.
    Duplicate IDs are checked before lateness, preventing accepted replays from
    becoming rejected new events. Conflicting content for an ID is an error.
    """
    accepted = {}
    aggregates = {}
    late = []
    duplicates = []
    maximum = -1
    for event in events:
        event_id = event["id"]
        if event_id in accepted:
            if accepted[event_id] != event:
                raise ValueError("same event ID with different contents")
            duplicates.append(event_id)
            continue
        maximum = max(maximum, event["minute"])
        if event["minute"] + 1 + grace <= maximum:
            late.append(event_id)
            continue
        accepted[event_id] = event.copy()
        minute = event["minute"]
        aggregates[minute] = aggregates.get(minute, 0) + event["value"]
    return {"windows": aggregates, "late": late, "duplicates": duplicates,
            "accepted_ids": list(accepted)}


def queue_trace(producer, consumer, capacity, seconds):
    """Discrete one-second buckets, producer admission before consumer service."""
    size = 0
    rejected = 0
    rows = []
    for second in range(1, seconds + 1):
        admitted = min(producer, capacity - size)
        rejected += producer - admitted
        size += admitted
        served = min(size, consumer)
        size -= served
        rows.append({"second": second, "accepted": admitted, "served": served,
                     "queued_after_service": size, "rejected_total": rejected})
    return rows


def run_lab():
    result = {}
    # Every run owns a fresh directory; no user data or existing DB is removed.
    with tempfile.TemporaryDirectory(prefix="system-design-stream-") as directory:
        for mode in ("early", "late", "safe"):
            path = Path(directory) / f"{mode}.sqlite"
            deliveries = delivery(path, mode, crash=True)
            before = inspect(path)
            deliveries += delivery(path, mode)
            result[mode] = {"after_crash": before, "after_restart": inspect(path),
                            "deliveries": deliveries}
    result["event_time"] = windows(EVENTS, grace=3)
    result["replay"] = windows(EVENTS, grace=3)
    # Full batch includes unique events regardless of streaming late policy.
    unique = {event["id"]: event for event in EVENTS}
    batch = {}
    for event in unique.values():
        batch[event["minute"]] = batch.get(event["minute"], 0) + event["value"]
    result["full_batch"] = batch
    result["backpressure"] = queue_trace(100, 60, 200, 7)
    return result


def test():
    result = run_lab()
    assert result["early"]["after_restart"] == {"effects": 2, "sum": 5, "next_offset": 3}
    assert result["late"]["after_restart"] == {"effects": 4, "sum": 7, "next_offset": 3}
    assert result["safe"]["after_restart"] == {"effects": 3, "sum": 6, "next_offset": 3}
    assert result["safe"]["deliveries"] == 4
    assert result["event_time"] == result["replay"]
    assert result["event_time"]["windows"] == {0: 2, 2: 3, 1: 4, 5: 7}
    assert result["event_time"]["late"] == ["e"]
    assert result["event_time"]["duplicates"] == ["a"]
    assert result["full_batch"] == {0: 13, 2: 3, 1: 4, 5: 7}
    assert all(row["queued_after_service"] <= 200 for row in result["backpressure"])
    assert result["backpressure"][-1]["rejected_total"] == 140
    try:
        windows([EVENTS[0], {"id": "a", "minute": 0, "value": 99}], 3)
    except ValueError:
        pass
    else:
        raise AssertionError("conflicting duplicate accepted")
    with tempfile.TemporaryDirectory(prefix="system-design-conflict-") as directory:
        path = Path(directory) / "conflict.sqlite"
        db = connect(path)
        with db:
            db.execute("INSERT INTO inbox VALUES(?, ?)", ("item-0", json.dumps({"value": 99})))
            db.execute("INSERT INTO effects VALUES(?, ?)", ("item-0", 99))
        db.close()
        before = inspect(path)
        try:
            delivery(path, "safe")
        except ValueError:
            pass
        else:
            raise AssertionError("conflicting SQL inbox payload accepted")
        assert inspect(path) == before == {"effects": 1, "sum": 99, "next_offset": 0}
    print("PASS: loss, duplicate, inbox, replay, late data, bounded queue, event ID conflict, SQL inbox conflict rollback")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test", action="store_true")
    args = parser.parse_args()
    if args.test:
        test()
    else:
        print(json.dumps(run_lab(), ensure_ascii=False, indent=2))
