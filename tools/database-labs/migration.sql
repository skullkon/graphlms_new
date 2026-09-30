\set ON_ERROR_STOP on
BEGIN;
SET LOCAL lock_timeout='1s';
-- Teaching dry run: rollback keeps the golden fixture unchanged.
ALTER TABLE club.members ADD COLUMN display_name text;
UPDATE club.members SET display_name=name WHERE display_name IS NULL;
SELECT id,name,display_name FROM club.members ORDER BY id;
DO $$ BEGIN
    IF EXISTS(SELECT 1 FROM club.members WHERE display_name IS NULL) THEN
        RAISE EXCEPTION 'backfill incomplete';
    END IF;
END $$;
ROLLBACK;
\echo Dry run rolled back; no column remains. Deploy migration needs its own version ledger and concurrency policy.
