# Данные и распределённые системы: исследование для пересборки курса

Дата проверки источников: 30 сентября 2026. Область исследования: `book/03-data`, `06-cache`, `07-replication`, `08-partitioning`, `09-events` и hard-parts `consistency`, `consensus`, `transactions`, `delivery`, `hot-keys`, `multiregion`, `migrations`. Это проектная карта; предложенные лаборатории ещё не реализованы и не запускались.

## Что сохранить и что перестроить

Текущий материал уже различает неизвестный исход и отказ, сохранение и применение журнала, локальную транзакцию и внешний эффект. Hard-parts содержат содержательные контрпримеры: write skew, чтение с обратной записью в кворум, commit записи прошлого срока Raft, устаревший worker, зависший участник 2PC, продвижение offset с пропуском. Эти механизмы стоит сохранить по смыслу и встроить в последовательное обучение. Простое добавление объёма к существующим главам не решит проблему предпосылок и практики.

Главный разрыв: ученик сначала узнаёт, что индекс помогает и транзакция защищает правило, а затем должен рассуждать о снимках, журналах и устойчивом состоянии без курса об устройстве хранения. В проверенной области нет объяснений LSM, WAL и MVCC; полнотекстовый поиск по всем `book` и `hard-parts` также не нашёл этих терминов. Времена событий и окна затронуты в `10-realtime`; считать их отсутствующими во всём курсе неверно. Однако они не собраны в последовательный блок обработки потоков с наблюдаемым результатом.

## DDIA: издания и карта покрытия

Официальный издатель указывает первое издание: Martin Kleppmann, март 2017; второе: Martin Kleppmann и Chris Riccomini, февраль 2026. Во втором издании 14 глав; репликация и шардирование имеют номера 6 и 7, транзакции — 8. Нумерацию 12 глав первого издания нельзя выдавать за содержание актуального второго. Используем книги как карту вопросов, а тексты, задачи и трассы курса пишем самостоятельно. [O’Reilly, первое издание](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/ch05.html), [O’Reilly, второе издание](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/), [официальная глава Sharding](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/ch07.html).

Ниже тематическая карта, а не оглавление книги. Номера — только ориентиры первого издания.

| Область DDIA | Состояние проверенного курса | Требуемое учебное действие |
| --- | --- | --- |
| Модели данных, запросы (2) | SQL, связи, ограничения, JOIN разобраны | Выбрать между таблицами, документами, графом и key-value по четырём конкретным запросам; объяснить обновление связанных фактов |
| Хранение и поиск (3) | B-tree показан через упорядоченный справочник | Проследить страницу, buffer pool, индекс, запись, WAL, checkpoint; собрать учебный LSM и измерить амплификацию |
| Аналитическое хранение (3) | Не входит в проверенные главы | Отличить OLTP и OLAP; показать колонку, сжатие, проекцию, материализацию и стоимость freshness |
| Кодирование и эволюция (4) | Миграция данных есть в hard-parts | Проверить четыре сочетания старого/нового reader и writer, включая старые записи и replay |
| Репликация (5) | Лидер, lag, подтверждения, сессионные гарантии есть | Сопоставить single-leader, multi-leader и leaderless; отдельно причинность, конфликты, anti-entropy, sloppy quorum |
| Разбиение (6) | Hash/range, виртуальные корзины, горячие ключи, поколения владения есть | Проверить реальные распределения нагрузки, scatter/gather, локальный и глобальный secondary index |
| Транзакции (7) | Хорошие инварианты и write skew; базовой модели MVCC нет | Воспроизвести read skew, lost update, write skew и цикл; сравнить блокировки, OCC и SSI |
| Частичные отказы (8) | Таймауты и паузы встроены в hard-parts | Сделать явную модель crash/recovery, stable storage, clocks; не выводить смерть узла из heartbeat |
| Согласованность, консенсус (9) | Сильные hard-parts, но большой скачок сложности | Проверить истории, текущий срок commit, stale reads, fencing на ресурсе; safety отдельно от liveness |
| Batch (10) | Не входит в проверенную область | Пересчитать производное состояние из полного снимка; сравнить результат с incremental pipeline |
| Streams (11) | Outbox, inbox, offsets, exactly-once scope есть | Добавить backpressure, event-time, lateness, stream-table, joins, retention и воспроизводимый replay |
| Производные данные, корректность (12) | Поиск и backfill есть | Ввести reconciliation, tombstones, проверку расхождений и переиндексацию без оживления удалённых объектов |

Расширения второго издания следует учесть тематически: эксплуатационная цена распределённости, облако и собственное размещение, мультиарендность, local-first и синхронизация, современные аналитические системы, поиск и векторные представления. Они не должны вытеснить доказуемые основы. Отдельно оставить тему удаления персональных данных из журналов, производных представлений и резервных копий; утверждения о законах требуют своей актуальной проверки.

## Последовательность предпосылок

1. Байты, файлы, память, процесс, локальная сеть, запрос и ответ. Таймаут означает отсутствие ответа. Есть различие между остановкой процесса, потерей диска и потерей региона.
2. Требование и инвариант: для читального клуба можно менять расписание свободно, но нельзя выдать два подтверждённых права на одну кабинку лаборатории. Таблица операций и обещаний предшествует выбору БД.
3. Модели данных и запросы. Схема, ключи, связи, диапазоны; одна строка результата и её смысл; нормализация и стоимость производных копий.
4. Устройство хранения: страницы, B+tree, SSTable/LSM, Bloom filter, memtable, compaction; WAL и восстановление. Здесь объяснить, что `fsync` и commit значат в выбранной модели отказов.
5. Конкуренция на одном узле: атомарный update, транзакция, MVCC, снимок, уровни изоляции, write skew, retry всей транзакции. Предикатные инварианты шире одного row lock.
6. Кэш: TTL/eviction/invalidation, устаревшее заполнение, singleflight, negative caching, jitter; hit rate отдельно от свежести и нагрузки на origin.
7. Репликация: журнал и replay, lag, sync/async, read-your-writes; затем истории и линеаризуемость. Только после этого CAP и кворумы.
8. Координация: epochs/terms, журнал Raft, persisted vote, commit/apply, смена лидера, строгие чтения; fencing и leases на границе внешнего эффекта.
9. Разбиение: выбор ключа, hash/range, skew, scatter/gather, secondary indexes, переназначение владельца, snapshot+tail, дедупликация во время переноса.
10. Журналы и события: offset, ключ порядка, consumer group, crash windows, inbox/outbox, backpressure, DLQ, retention. Затем event-time, окна, joins и replay.
11. Распределённые транзакции: 2PC после локальных транзакций и durable decision; saga после неизвестного внешнего исхода. Консенсус и atomic commit решают разные задачи.
12. Мультирегион и эволюция: placement, RTT, RPO/RTO, fencing/failback, совместимость reader/writer, backfill и cutover. Повторно проверить исходные инварианты при каждом переходе.

MIT 6.5840 Spring 2026 полезен для последовательности RPC → репликация → Raft → линеаризуемость → транзакции → sharded KV и для дисциплины fault injection. CMU 15-445 Fall 2025 отдельно проводит ученика через хранение, buffer pool, индексы, планы, concurrency control, MVCC, logging/recovery. Наш курс не должен требовать выполнить университетские C++/Go-проекты целиком. [MIT](https://pdos.csail.mit.edu/6.824/schedule.html), [CMU, архивный проверенный выпуск](https://15445.courses.cs.cmu.edu/fall2025/schedule.html).

## Технические границы, которые нельзя потерять

**Хранение.** B+tree и LSM — организации хранения, SQL и документная модель — способы представлять и запрашивать данные. Это разные оси выбора. У LSM запись в memtable, flush и compaction выполняют разные работы; tombstone нельзя удалить до проверки старых копий. Сравнивать read/write/space amplification на конкретной нагрузке, не учить лозунг «LSM для записи, B-tree для чтения». Bloom filter допускает false positive и не заменяет источник данных. [RocksDB Overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview).

**WAL.** Сначала сохраняется достаточно журнала, затем изменённая страница может оказаться на носителе. Подтверждение durable commit опирается на настройки записи журнала и свойства хранилища. Checkpoint сокращает восстановление, но не заменяет backup. Crash процесса — более слабый опыт, чем потеря питания; учебный restart не доказывает долговечность при всех отказах. [PostgreSQL WAL](https://www.postgresql.org/docs/18/wal-intro.html).

**MVCC и изоляция.** Снимок отвечает, какие версии видны; он не превращает произвольный бизнес-инвариант в защищённый. В PostgreSQL Read Committed обычный SELECT видит снимок начала команды, Repeatable Read — более стабильный снимок, но допускает serialization anomaly. PostgreSQL Read Uncommitted ведёт себя как Read Committed; Repeatable Read запрещает phantom reads сильнее минимального требования SQL. Serializable может отменить транзакцию: повторяем всю транзакцию и отдельно защищаем внешний эффект. [Изоляция PostgreSQL 18](https://www.postgresql.org/docs/18/transaction-iso.html), [MVCC](https://www.postgresql.org/docs/18/mvcc-intro.html).

**CAP.** C в формальной задаче — atomic consistency/линеаризуемость; A — завершение каждого запроса к исправному узлу согласно спецификации объекта. В асинхронной модели, допускающей разделение сети, нельзя обещать оба свойства для всех исполнений. Ошибка «попробуйте позже» не удовлетворяет этой A. Теорема не задаёт p99, SLA и выбор двух красивых букв. Без partition координация всё равно имеет цену задержки. [Gilbert–Lynch, 2002](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf).

**Кворум.** При фиксированном наборе N реплик `R+W>N` доказывает пересечение множеств; не доказывает сразу линеаризуемость. Нужны правила версий, разрешения конкурентных/незавершённых записей, поведения чтения и восстановления. Sloppy quorum пишет на временные узлы за пределами обычного набора: стандартное рассуждение о пересечении может перестать работать. Hinted handoff и anti-entropy обеспечивают догон при своих условиях, а не мгновенный единый порядок. Для concurrent writes показать причинные версии и явно выбрать merge или потерю по LWW; timestamp не доказывает причинность. [Dynamo, 2007](https://www.amazon.science/publications/dynamo-amazons-highly-available-key-value-store).

**Консенсус.** Для Raft различать persisted log, committed prefix и applied state. Выборы требуют устойчивого голоса и проверки актуальности журнала. Копии записи прошлого срока не дают права объявить её committed простым подсчётом; правило текущего срока принципиально. Лидер может быть устаревшим: строгому чтению нужен соответствующий протокол, применение до безопасного индекса и подтверждение полномочий. Safety не зависит от удачного таймера; прогресс требует достаточной связности и своевременной работы. Это crash/recovery-модель, не византийская. [Raft extended, 2014](https://raft.github.io/raft.pdf).

**Fencing и часы.** Истёкший lease не останавливает paused worker и уже отправленный пакет. Получатель эффекта должен проверять epoch атомарно вместе с изменением. Wall clock, monotonic clock и logical counter имеют разные области смысла. Lease-read требует явных bounds и протокола прав. Spanner использует TrueTime с интервалом неопределённости и commit wait вместе с репликацией и транзакционным протоколом; простой NTP и timestamp этого результата не дают. [Spanner OSDI 2012, §§3–4](https://research.google.com/archive/spanner-osdi2012.pdf).

**Миграция шарда.** Нужны две версии: поколение владельца и версия объекта. Snapshot+tail должен иметь согласованную границу, переносить deletes и память о повторах. Старый маршрут не должен открывать второго писателя. До открытия нового владельца rollback и после его новых записей — разные процедуры. Сравнивать lag в байтах/времени и нагрузку на источник, проверять reconciliation, а не только количество строк.

**Поток.** Offset — позиция в разделе, не глобальный ID события и не timestamp. Kafka задаёт порядок внутри раздела; конкурентное применение может его нарушить. Commit offset раньше эффекта создаёт loss window, позже — duplicate window. Idempotent producer, Kafka transaction и idempotent SQL consumer имеют разные границы. Транзакция Kafka не делает HTTP/email частью общего commit. `read_committed`, стабильный transactional identity и корректное владение требуют явного контракта. [Kafka 4.1 Design, Semantics](https://kafka.apache.org/41/design/design/).

**Время, replay и схемы.** Event time отделить от ingestion/processing time. Политика опозданий задаёт возможность исправления окна и потребность хранить state; watermark выражает продвижение по выбранным правилам и не гарантирует отсутствие любого будущего опоздания. Replay зависит от retention, версий схем и детерминированности; пересчёт аналитики не должен повторно отправлять уведомления. Новое поле проверяют с прежними reader/writer; удалённые field numbers Protobuf резервируют. [Kafka Streams: Time](https://kafka.apache.org/41/streams/core-concepts/), [Protocol Buffers: Updating a Message Type](https://protobuf.dev/programming-guides/proto3/#updating).

## Бесплатные практики с наблюдаемым результатом

Все основные задания выполняются локально: Python 3 стандартной библиотеки или бесплатный PostgreSQL 18. Docker/Podman может быть вариантом установки, но не условием понимания. Kafka — дополнительный уровень; базовую модель журнала можно выполнить на SQLite/JSONL. Перед публикацией каждой лаборатории нужны готовые fixtures, reset, точный сценарий и проверенный transcript; ниже задания на разработку этих лабораторий.

| Практика | Инвариант и контролируемый сбой | Что ученик сдаёт |
| --- | --- | --- |
| Четыре модели одних данных | Один человек записан на несколько встреч; имя меняется один раз логически | Таблицы, документ, граф связей и KV-ключи; точные операции для списка участника, списка встречи, rename и отмены; число затронутых записей |
| Индекс и план PostgreSQL | Результат неизменен после индекса | `generate_series` создаёт 100 тысяч строк; `ANALYZE`, одинаковый запрос до/после составного индекса; `EXPLAIN (ANALYZE, BUFFERS)`; не обещать фиксированный speedup |
| Учебный LSM | Последняя версия и delete переживают compaction | Memtable → два отсортированных файла → merge; читаем ключ из новых файлов к старым; counters прочитанных/записанных байтов; удаление tombstone создаёт контрпример |
| WAL crash windows | Каждая подтверждённая команда восстановлена в модели остановки процесса | Файловый append-log с checksum/длиной, snapshot и replay; остановка после log-before-state и state-before-reply; последний оборванный record отбрасывается; отдельно описаны ограничения durability опыта |
| MVCC: два окна `psql` | Два SELECT объясняются правилами выбранного снимка | Команды BEGIN, READ COMMITTED/REPEATABLE READ, update в другой сессии; таблица значений; VACUUM и долгая транзакция как дополнительный опыт |
| Lost update и write skew | Минимум два дежурных после каждого успешного commit | Барьеры двух сессий; неверный результат; общая guard-row в Read Committed и отдельный Serializable-вариант; SQLSTATE 40001, повтор всей проверки, результат после retry |
| Устаревшее заполнение кэша | Заполнение старой версией не перекрывает новую | Детерминированный Python schedule: miss → read v7 → write v8 → invalidate → cache put v7; версия/epoch либо допустимое окно TTL; отдельно нагрузка при 100 одновременных miss |
| Регистр на трёх репликах | Строгое чтение после завершённой записи не возвращает старое | Python-модель с очередью сообщений и fault schedule: остановить writer после части ack, переставить доставки; сравнить read-max и read-back; лог calls/responses, контрпример |
| Raft на бумаге и в модели | На одном индексе не применяются разные committed команды | Fixtures journal/term/votedFor; проверка кандидатских голосов и commit rule; убрать сохранение vote или current-term restriction и предъявить нарушающую трассу; не выдавать игрушку за production Raft |
| Fencing paused worker | Старый владелец не пишет после новой эпохи | Worker A читает epoch 5, пауза; B получает 6 и пишет; A продолжает; ресурс атомарно проверяет epoch; таблица принятых/отклонённых изменений |
| Hot key и маршрутизация | Hash равномерно распределяет ключи, но не один ключ с 40% запросов | 10 тысяч ключей, синтетический skew и фиксированный seed; max/median requests per bucket; hash/range и виртуальные корзины; лимитный счётчик не заменять приблизительным striped sum |
| Перенос корзины | Нет двух активных писателей, повторы сохраняют ответ | JSON-модель snapshot → tail → fence old → switch → open new; задержанный старый router, late delete, retry старого ID; сверка содержимого и dedup history после каждого перехода |
| Outbox/inbox с restart | Один SQL-эффект на один стабильный event ID | PostgreSQL или SQLite, две таблицы плюс бизнес-изменение; остановка после publish до sent, после effect до ack; повторный запуск; число доставок больше одного, эффект ровно один |
| Offset с пробелом | Checkpoint не пропускает необработанный record | Обработчик завершает 45 раньше 44; crash; наивный checkpoint теряет 44; исправление хранит непрерывный префикс или отдельные ID; таблица после restart |
| Backpressure | Буфер ограничен и система не обещает лишние успешные приёмы | Producer 100/s, consumer 60/s, bounded queue 200; следить за occupancy и latency; пауза consumer; выбор reject/pause/persist и время выработки backlog |
| Event-time и replay | Повторный пересчёт даёт те же агрегаты без повторного email | Файл событий 12:00, 12:02, 11:59, duplicate; окна 1 минута, grace 3 минуты, late-policy; compare batch truth и streaming result; rebuild в новую таблицу и сверка |
| Схемы и backfill | Никакая поддерживаемая версия не меняет смысл факта | JSON V1/V2 reader-writer matrix; default против missing, rename через expand/migrate/contract; v8 из backfill приходит после delete v9; tombstone запрещает resurrection |
| Два региона без облака | Успех соответствует выбранным RPO и полномочиям | Два файла-реплики и третий свидетель в модели; split, async lag, failover, old writer resumes; вычислить потерянный suffix, RTO из шагов, правило failback |

Пример границы измерения backpressure: при указанных постоянных скоростях очередь растёт на 40 записей/с и заполняется примерно за 5 с от пустого состояния; паузы и burst меняют результат. После прекращения producer backlog 200 записей требует минимум около 3,33 с при 60/s без новых событий. Это расчёт модели, не результат измерения конкретного брокера.

## Минимальный стандарт новой главы

Глава вводит термины после наблюдаемой ситуации; задаёт модель отказов и устойчивое состояние; называет один проверяемый инвариант; проводит нормальную трассу и контрпример; показывает исправление и его цену; даёт локальный опыт с ожидаемым результатом и reset; завершает переносом принципа на другой пример. Ученик должен предъявлять историю или измерение, а не только перечислять технологии.

В заданиях по correctness таблица действий должна указывать client ID, operation ID, epoch/version, начало, ответ и unknown outcome. Проверки разделяют safety («не было двойной выдачи») и liveness («после восстановления допустимые команды завершаются»). Успешный fault test опровергает конкретную ошибку, но не считается доказательством для всех исполнений.

## Проверенные первичные источники и пределы проверки

Все ссылки проверялись через web 2026-09-30. Дата публикации статьи отличается от даты индексирования PDF. Kafka 4.1 и PostgreSQL 18 используются как явно выбранные версии; сайт Kafka помечает 4.1 как старую, а не актуальную последнюю.

| Источник | URL и статус | Назначение |
| --- | --- | --- |
| O’Reilly DDIA 2017 | [Официальное оглавление](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491903063/ch05.html), прочитан search preview | Издание, автор и тематическая карта |
| O’Reilly DDIA 2026 | [Карточка](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/), [chapter 7](https://www.oreilly.com/library/view/designing-data-intensive-applications/9781098119058/ch07.html); search preview, direct open ограничен | Проверка второго издания и новой нумерации; полный текст не использовался |
| MIT 6.5840 Spring 2026 | [Schedule](https://pdos.csail.mit.edu/6.824/schedule.html), direct open | RPC, Raft, consistency, distributed transactions, sharded KV |
| CMU 15-445 Fall 2025 | [Schedule](https://15445.courses.cs.cmu.edu/fall2025/schedule.html), direct open; архив | Хранение, индексы, MVCC, logging/recovery |
| Raft, Ongaro/Ousterhout 2014 | [Extended PDF](https://raft.github.io/raft.pdf), direct open | Terms, elections, log safety, commit current term, membership |
| Dynamo, DeCandia et al. 2007 | [Amazon Science](https://www.amazon.science/publications/dynamo-amazons-highly-available-key-value-store), [PDF](https://cdn.amazon.science/ac/1d/eb50c4064c538c8ac440ce6a1d91/dynamo-amazons-highly-available-key-value-store.pdf); search preview, direct PDF ограничен | Quorum-like replication, versions, conflicts, hinted handoff; не смешивать с DynamoDB 2022 |
| Spanner, Corbett et al. 2012 | [Страница Google](https://research.google/pubs/spanner-googles-globally-distributed-database/), [PDF](https://research.google.com/archive/spanner-osdi2012.pdf); direct open | Bounds времени, commit wait, Paxos groups и 2PC |
| Gilbert–Lynch 2002 | [PDF автора](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf), [библиография автора](https://www.comp.nus.edu.sg/~gilbert/biblio.html); search preview, direct PDF ограничен | Точная модель CAP; существующее утверждение курса проверено по первичному авторскому источнику |
| PostgreSQL 18 | [Isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [MVCC](https://www.postgresql.org/docs/18/mvcc-intro.html), [WAL](https://www.postgresql.org/docs/18/wal-intro.html), [Standby](https://www.postgresql.org/docs/18/warm-standby.html); direct open | Реальные особенности уровней, сохранение и async/sync replication |
| RocksDB maintainers | [Overview wiki](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview), direct open | LSM как отдельная организация storage, WAL/memtable/SST/compaction |
| Apache Kafka 4.1 | [Design](https://kafka.apache.org/41/design/design/), [Streams core concepts](https://kafka.apache.org/41/streams/core-concepts/); direct open | Delivery scope, partitioned log, time, stateful processing |
| Protocol Buffers | [Proto3 Language Guide](https://protobuf.dev/programming-guides/proto3/), direct open | Reader/writer compatibility, reserved numbers, unknown fields |

Не использовать как проверенные: `dataintensive.net` и предполагаемую `martin.kleppmann.com/books.html` — direct open не удался; поиск по авторскому блогу не дал достаточного свежего подтверждения издания. Непроверенные URL Avro/Flink и случайные зеркала книг не нужны для обязательного материала. Перед конкретным уроком о watermark следует отдельно открыть первичную документацию Beam/Flink, а перед runnable Kafka-лабораторией проверить quickstart и доступность выбранного образа.
