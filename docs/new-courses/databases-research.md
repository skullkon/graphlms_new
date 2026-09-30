# Исследование курса баз данных для начинающего Go backend-разработчика

Проверка 2026-09-30. Предпосылки: базовый синтаксис Go, функции и ошибки; SQL и опыт администрирования не предполагаются. Курс использует оригинальную учебную библиотеку `club`: участники, книги, физические экземпляры и выдачи. В каждом уроке фиксируются данные, ожидаемый результат и граница опыта.

## Сравнение открытых программ

[CMU 15-445 Fall 2025](https://15445.courses.cs.cmu.edu/fall2025/schedule.html) — проверенный архив: relational model и SQL предшествуют storage, buffer pool, indexes, execution/planning; затем concurrency, MVCC, logging/recovery и distributed systems. Открытая структура подходит для проверки полноты инженерных основ. Наш курс раньше вводит пользовательские транзакции и позже связывает их с WAL. Реализация C++-движка не требуется начинающему Go backend-разработчику; это сознательная адаптация уровня, а не эквивалент университетской программы.

[Berkeley CS186: открытые notes](https://cs186berkeley.net/fa19/) и [SQL joins](https://cs186berkeley.net/notes/note2/), [transactions](https://cs186berkeley.net/notes/note11/), [recovery](https://cs186berkeley.net/notes/note14/) проверены через индексируемые первичные страницы. SQL, физическое хранение, query execution, concurrency и recovery связываются в один курс. Наш порядок сначала закрепляет правильный результат JOIN/агрегатов на маленьких данных, затем добавляет измерение плана. Авторизованные задания, закрытые решения и актуальные enrollment-only материалы не доступны и не использовались. Главная страница при direct open не открылась; опубликованные notes видны в search preview. Не приписываем всему текущему CS186 содержание найденного архивного выпуска.

[PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html) рассчитан на новичка: установка и архитектура → таблицы и запросы → JOIN/агрегаты → views/foreign keys/transactions. Он даёт точку входа, но сам заявляет ограниченную полноту. Дополняем его явными NULL/order, кардинальностью, двухсессионными историями, параметризацией Go, миграциями и restore drill. Тексты и задания не копируют tutorial и университетские примеры.

По [официальной политике версий](https://www.postgresql.org/support/versioning/) current stable на дату проверки — PostgreSQL 18.6; 19 помечена development/beta. В уроках фиксируем ветку 18 и предлагаем последний patch этой ветки; не используем beta для обязательной практики. Native installation и контейнер являются вариантами, аккаунт в облаке не требуется.

## Последовательность и адаптация

1. `01-local-postgres`: роли server/client/database/schema, локальная установка, новая база, psql и безопасный setup.
2. `02-tables-constraints`: строки, типы, PK/FK/NOT NULL/CHECK, активная выдача одной копии.
3. `03-select-null-order`: фильтр, NULL, порядок, LIMIT и воспроизводимый результат.
4. `04-joins-cardinality`: one-to-many, LEFT JOIN, удвоение фактов, EXISTS.
5. `05-aggregates`: GROUP BY/HAVING/COUNT, знаменатель, пустые группы, подзапросы.
6. `06-relational-model`: сущность и факт, функциональные зависимости, нормализация и денормализация.
7. `07-transactions-isolation`: atomicity, MVCC, lost update, write skew, два окна, исправления.
8. `08-indexes-explain`: B-tree, порядок колонок, plans/buffers/statistics, write cost.
9. `09-schemas-migrations`: schema/search_path, expand/migrate/contract, версии и locking.
10. `10-go-sql-pools`: parameterization, Scan/NULL/errors, Tx/context/pooling и нагрузка.
11. `11-durability-backups`: WAL/commit, checkpoint, backup types, отдельное восстановление и проверка.
12. `12-nosql-tradeoffs`: модели доступа, jsonb, KV/document/graph, согласованность и производные копии.
13. `13-final-project`: библиотечный API на Go, инварианты, concurrency/retry, plans и restore proof.

Каждый урок содержит полноценное объяснение, SQL с ожидаемыми строками, самостоятельную практику, критерии готовности и разбор. `minutes` оценивает чтение; время выполнения лаборатории указано отдельно. ZIP собирается из `tools/database-labs` интегратором; мы не меняем registry/UI/manifest.

## Первичные источники для технических контрактов

Проверено web 2026-09-30: [PostgreSQL constraints](https://www.postgresql.org/docs/18/ddl-constraints.html), [table expressions](https://www.postgresql.org/docs/18/queries-table-expressions.html), [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html), [SQL dump](https://www.postgresql.org/docs/18/backup-dump.html), [transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [WAL](https://www.postgresql.org/docs/18/wal-intro.html). Direct open части других страниц ограничен; для них используются официальные индексированные previews: [types](https://www.postgresql.org/docs/18/datatype.html), [aggregate functions](https://www.postgresql.org/docs/18/functions-aggregate.html), [Go parameterization](https://go.dev/doc/database/sql-injection), [Go sql.DB pooling](https://go.dev/doc/database/manage-connections), [Go querying](https://go.dev/doc/database/querying), [Go opening handle](https://go.dev/doc/database/open-handle).

Лаборатории не требуют платных API. Setup выполняется один раз в новой локальной базе: `ON_ERROR_STOP`, явная транзакция, новая схема без `IF NOT EXISTS`. Collisions приводят к отказу, а не к использованию старых объектов. Отсутствие PostgreSQL runtime при написании отдельно отмечается; SQL-проверки нельзя считать выполненными по чтению текста. В SQL-тестах проверяем golden seed, ожидаемые JOIN/aggregate строки, FK/CHECK и запрет двух активных выдач. Negative tests ловят только ожидаемый тип ошибки и откатывают собственные изменения. Двухсессионные scripts содержат явные ручные барьеры вместо sleep-based assumptions.

## Фактическое исполнение, 2026-09-30

PostgreSQL 18.6, временный Unix-socket-only кластер, новая database_course. setup/tests/indexes/migration PASS; setup collision отказал с сохранением seed. pg_dump custom → новая database_restore_sd → pg_restore single transaction → tests PASS. Двухсессионные истории RC lost update, RR write skew, RC guard wait/fresh count, Serializable40001 и partial unique wait обе ветки PASS. SQL лаборатории исполнены, а не только проверены визуально. Внутренний проверяющий harness поддерживал два persistent psql процесса, явные SELECT-барьеры и наблюдение pg_stat_activity wait_event_type=Lock.

Go-клиент: Go1.25.6, pgx v5.7.2 закреплён, `go test ./...` без тестовых файлов подтвердил компиляцию. Реальное чтение members1/2/3, включая NULLemail, и отказ соединения localhost:1 проверены. Версия драйвера не объявляется последней. Дополнительные первичные страницы проверены: [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html) и [Go transactions](https://go.dev/doc/database/execute-transactions). Страница continuous-archiving при прямом fetch была недоступна; ссылка дана для дальнейшего чтения, конкретные команды PITR в курс не включены.
