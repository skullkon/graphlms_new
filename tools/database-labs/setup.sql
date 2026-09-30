\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA club;
CREATE TABLE club.members (
    id bigint PRIMARY KEY,
    name text NOT NULL CHECK (length(trim(name)) > 0),
    email text UNIQUE,
    joined_on date NOT NULL
);
CREATE TABLE club.books (
    id bigint PRIMARY KEY,
    title text NOT NULL CHECK (length(trim(title)) > 0),
    author text NOT NULL,
    published_year integer CHECK (published_year BETWEEN 1400 AND 2100)
);
CREATE TABLE club.copies (
    id bigint PRIMARY KEY,
    book_id bigint NOT NULL REFERENCES club.books(id),
    inventory_code text NOT NULL UNIQUE,
    acquired_on date NOT NULL
);
CREATE TABLE club.loans (
    id bigint PRIMARY KEY,
    member_id bigint NOT NULL REFERENCES club.members(id),
    copy_id bigint NOT NULL REFERENCES club.copies(id),
    borrowed_on date NOT NULL,
    due_on date NOT NULL,
    returned_on date,
    CHECK (due_on >= borrowed_on),
    CHECK (returned_on IS NULL OR returned_on >= borrowed_on)
);
CREATE UNIQUE INDEX one_active_loan_per_copy
    ON club.loans(copy_id) WHERE returned_on IS NULL;
INSERT INTO club.members VALUES
    (1, 'Анна', 'anna@example.test', '2026-08-01'),
    (2, 'Борис', NULL, '2026-08-02'),
    (3, 'Вера', 'vera@example.test', '2026-08-03');
INSERT INTO club.books VALUES
    (10, 'Практика Go', 'Ирина', 2024),
    (11, 'Запросы SQL', 'Олег', 2023),
    (12, 'Как работают сети', 'Ирина', 2025);
INSERT INTO club.copies VALUES
    (100, 10, 'A-100', '2026-08-10'),
    (101, 10, 'A-101', '2026-08-10'),
    (102, 11, 'B-102', '2026-08-11'),
    (103, 12, 'C-103', '2026-08-12');
INSERT INTO club.loans VALUES
    (1000, 1, 100, '2026-09-01', '2026-09-15', NULL),
    (1001, 2, 102, '2026-09-02', '2026-09-16', '2026-09-10'),
    (1002, 1, 101, '2026-09-03', '2026-09-17', NULL);
-- Dedicated teaching objects for two-session anomalies, not library entities.
CREATE TABLE club.lab_counters(id integer PRIMARY KEY, value integer NOT NULL);
INSERT INTO club.lab_counters VALUES (1, 0);
CREATE TABLE club.lab_duty(name text PRIMARY KEY, active boolean NOT NULL);
INSERT INTO club.lab_duty VALUES ('anna', true), ('boris', true), ('vera', true);
CREATE TABLE club.lab_guard(id integer PRIMARY KEY);
INSERT INTO club.lab_guard VALUES (1);
COMMIT;
\echo Setup complete: 3 members, 3 books, 4 copies, 3 loans.
