\set ON_ERROR_STOP on
BEGIN;
-- Fresh temp object; name collisions fail. It belongs only to this session.
CREATE TEMP TABLE loan_search(id bigint PRIMARY KEY, member_id bigint NOT NULL, borrowed_on date NOT NULL);
INSERT INTO loan_search
SELECT n, n % 1000, DATE '2026-01-01' + (n % 200)::integer
FROM generate_series(1,100000) AS s(n);
ANALYZE loan_search;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, borrowed_on FROM loan_search WHERE member_id=17
ORDER BY borrowed_on,id LIMIT 10;
CREATE INDEX loan_search_member_date ON loan_search(member_id,borrowed_on,id);
ANALYZE loan_search;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, borrowed_on FROM loan_search WHERE member_id=17
ORDER BY borrowed_on,id LIMIT 10;
SELECT count(*) AS expected_100 FROM loan_search WHERE member_id=17;
ROLLBACK;
