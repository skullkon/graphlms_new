\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE counts bigint[];
BEGIN
    SELECT ARRAY[(SELECT count(*) FROM club.members),
                 (SELECT count(*) FROM club.books),
                 (SELECT count(*) FROM club.copies),
                 (SELECT count(*) FROM club.loans)] INTO counts;
    IF counts <> ARRAY[3,3,4,3]::bigint[] THEN
        RAISE EXCEPTION 'golden seed changed: %', counts;
    END IF;
    IF (SELECT count(*) FROM club.members WHERE email IS NULL) <> 1 THEN
        RAISE EXCEPTION 'NULL fixture mismatch';
    END IF;
    IF (SELECT count(*) FROM club.loans WHERE returned_on IS NULL) <> 2 THEN
        RAISE EXCEPTION 'active loans mismatch';
    END IF;
    IF (SELECT count(*) FROM club.books b JOIN club.copies c ON c.book_id=b.id) <> 4 THEN
        RAISE EXCEPTION 'join cardinality mismatch';
    END IF;
    IF (SELECT count(*) FROM club.members m
        WHERE NOT EXISTS(SELECT 1 FROM club.loans l WHERE l.member_id=m.id)) <> 1 THEN
        RAISE EXCEPTION 'anti join mismatch';
    END IF;
END $$;
DO $$
BEGIN
    BEGIN
        INSERT INTO club.loans VALUES(2000, 1, 100, '2026-09-18', '2026-10-01', NULL);
        RAISE EXCEPTION 'expected unique violation';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO club.copies VALUES(2000, 999, 'BAD-FK', '2026-09-18');
        RAISE EXCEPTION 'expected foreign key violation';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
    BEGIN
        INSERT INTO club.loans VALUES(2000, 1, 103, '2026-09-18', '2026-09-01', NULL);
        RAISE EXCEPTION 'expected check violation';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    UPDATE club.loans SET returned_on='2026-09-18' WHERE id=1000;
    INSERT INTO club.loans VALUES(2000, 3, 100, '2026-09-18', '2026-10-01', NULL);
    IF (SELECT count(*) FROM club.loans WHERE copy_id=100 AND returned_on IS NULL) <> 1 THEN
        RAISE EXCEPTION 'return/reissue mismatch';
    END IF;
END $$;
ROLLBACK;
\echo PASS: seed, NULL, active rows, join, anti join, unique, FK, CHECK, return/reissue. All changes rolled back.
