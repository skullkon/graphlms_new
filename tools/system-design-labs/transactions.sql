-- PostgreSQL 18, psql. Use a separate local teaching database.
-- Run setup ONCE: psql "$LAB_DATABASE_URL" -f transactions.sql
-- This script creates only a fresh schema. It does not drop or reuse objects.
-- A name collision fails setup instead of touching an existing schema.
-- The concurrent experiments below are comments: copy each SESSION block into
-- its own psql window, observing the explicit barriers. No sleep-based timing.
\set ON_ERROR_STOP on

BEGIN;
CREATE SCHEMA sd_isolation_lab;
CREATE TABLE sd_isolation_lab.counters (
    id integer PRIMARY KEY,
    value integer NOT NULL
);
INSERT INTO sd_isolation_lab.counters VALUES (1, 0);
CREATE TABLE sd_isolation_lab.duty (
    name text PRIMARY KEY,
    active boolean NOT NULL
);
INSERT INTO sd_isolation_lab.duty VALUES
    ('anna', true), ('boris', true), ('vera', true);
CREATE TABLE sd_isolation_lab.guard (id integer PRIMARY KEY);
INSERT INTO sd_isolation_lab.guard VALUES (1);
COMMIT;

-- EXPERIMENT 1: lost update.
-- SESSION A:
-- BEGIN ISOLATION LEVEL READ COMMITTED;
-- SELECT value FROM sd_isolation_lab.counters WHERE id=1;
-- SESSION B:
-- BEGIN ISOLATION LEVEL READ COMMITTED;
-- SELECT value FROM sd_isolation_lab.counters WHERE id=1;
-- BARRIER: both SELECTs have returned 0; neither session has updated yet.
-- SESSION A:
-- UPDATE sd_isolation_lab.counters SET value=1 WHERE id=1;
-- COMMIT;
-- SESSION B, only after A's COMMIT:
-- UPDATE sd_isolation_lab.counters SET value=1 WHERE id=1;
-- COMMIT;
-- OBSERVER: SELECT value FROM sd_isolation_lab.counters WHERE id=1;
-- Expected: 1, although two increments were intended.
-- Repair for this exact operation: SET value=value+1, not an old literal.

-- EXPERIMENT 2: write skew.
-- SESSION A:
-- BEGIN ISOLATION LEVEL REPEATABLE READ;
-- SELECT COUNT(*) FROM sd_isolation_lab.duty WHERE active;
-- SESSION B:
-- BEGIN ISOLATION LEVEL REPEATABLE READ;
-- SELECT COUNT(*) FROM sd_isolation_lab.duty WHERE active;
-- BARRIER: both COUNTs returned 3; neither session has updated yet.
-- SESSION A:
-- UPDATE sd_isolation_lab.duty SET active=false WHERE name='anna';
-- COMMIT;
-- SESSION B, after A's COMMIT, using the already-read count:
-- UPDATE sd_isolation_lab.duty SET active=false WHERE name='boris';
-- COMMIT;
-- OBSERVER: SELECT COUNT(*) FROM sd_isolation_lab.duty WHERE active;
-- Expected: 1. Invariant requires at least two active organizers.

-- EXPERIMENT 3: common guard at Read Committed.
-- Reset, only after all experiment-2 transactions have completed:
-- UPDATE sd_isolation_lab.duty SET active=true;
-- SESSION A:
-- BEGIN ISOLATION LEVEL READ COMMITTED;
-- SELECT id FROM sd_isolation_lab.guard WHERE id=1 FOR UPDATE;
-- SELECT COUNT(*) FROM sd_isolation_lab.duty WHERE active;
-- BARRIER: A holds guard and saw 3. Do NOT commit A yet.
-- SESSION B:
-- BEGIN ISOLATION LEVEL READ COMMITTED;
-- SELECT id FROM sd_isolation_lab.guard WHERE id=1 FOR UPDATE;
-- This command waits. Return to A without waiting for B's result.
-- SESSION A:
-- UPDATE sd_isolation_lab.duty SET active=false WHERE name='anna';
-- COMMIT;
-- SESSION B, after its guard SELECT returns:
-- SELECT COUNT(*) FROM sd_isolation_lab.duty WHERE active;
-- Expected: 2. Business rule forbids departure; DO NOT run B's UPDATE.
-- COMMIT;
-- OBSERVER: SELECT COUNT(*) FROM sd_isolation_lab.duty WHERE active;
-- Expected: 2. Every writer of duty must use the same guard protocol.

-- EXPERIMENT 4: Serializable.
-- Reset active=true only after both prior transactions have ended.
-- Repeat experiment 2, replacing REPEATABLE READ with SERIALIZABLE in BOTH
-- sessions. One transaction may fail at a statement or COMMIT. Set
-- \set VERBOSITY verbose in each window to observe SQLSTATE 40001.
-- ROLLBACK the failed transaction, then retry the WHOLE transaction with a
-- fresh COUNT, not just its UPDATE. New count=2 forbids the second departure.
-- The exact failure point is not part of the application contract.
-- Expected after correct retry logic: at least two active organizers.

-- No automatic cleanup is provided. To repeat, use a fresh disposable DB.
-- Verified on PostgreSQL 18.6: setup/collision and the four two-session histories.
-- This file itself does not automate those concurrent experiments.
