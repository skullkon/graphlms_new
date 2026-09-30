# Финальная независимая проверка блока данных

Проверка 30 сентября 2026 года. Прочитаны новые `hard-parts/storage-engines`, `isolation`, `batch-stream`, изменения `book/03-data`, `06-cache`, `07-replication`, `08-partitioning`, `09-events`, `transactions.sql`, `stream_lab.py` и README. Проверяемые файлы не изменялись. PostgreSQL здесь отсутствует: SQL не выполнялся, его расписания проверены по тексту и официальному договору PostgreSQL 18.

## Конкретные замечания

### P2 — Обещание проверки конфликтующего payload не соответствует SQL inbox

Место: `tools/system-design-labs/README.md:54` и `stream_lab.py:47–50`.

README сообщает, что inbox отвергает конфликт одного ID с разным payload. Однако safe delivery выполняет INSERT OR IGNORE и при существующем ID не сравнивает сохранённый payload с входящим. Проверка конфликтов в `--test` относится к функции `windows`, не к SQL inbox.

Независимое воспроизведение: в новой временной базе сохранены inbox item-0 с value99 и соответствующий effect99. Затем `delivery(path, "safe")` обрабатывает свой item-0 с value1. Конфликт не вызывает ошибку; после остальных событий результат `effects=3, sum=104, next_offset=3`.

Исправление: сравнить существующий payload внутри той же SQL-транзакции и отвергать конфликт до продвижения offset; добавить отдельный regression test именно SQL inbox. Либо явно сузить README: SQL inbox показывает дедупликацию неизменных входов, а конфликт ID проверяется только event-time моделью. Первый вариант лучше соответствует формулировкам о договоре ID в уроке.

### P2 — Inline setup не обеспечивает заявленную остановку при совпадении схемы

Место: `site/content/system-design/hard-parts/isolation.mdx:12,26–43`.

Введение обещает, что совпадение имени остановит setup. Но SQL-блок содержит самостоятельные CREATE/INSERT без общей транзакции и без ON_ERROR_STOP. В обычном psql после ошибки CREATE SCHEMA обработка следующих команд продолжается: существующая схема может получить новые таблицы, а совпадающие таблицы — последующие INSERT. Это отличается от защищённого скачиваемого `transactions.sql`, где есть ON_ERROR_STOP и BEGIN/COMMIT.

Исправление: привести inline setup к тому же протоколу, включая новую транзакцию и явную остановку клиента, либо направить ученика выполнять setup только из файла. Не использовать IF NOT EXISTS или DROP как замену: они изменят заявленную защиту чужих объектов. Правило продолжения psql сверено с [PostgreSQL 18: psql, ON_ERROR_STOP](https://www.postgresql.org/docs/18/app-psql.html). Это проверка текста и договора клиента, не заявление о выполненном SQL-опыте.

## Что выполнено

Из корня:

```bash
python3 tools/system-design-labs/stream_lab.py
python3 tools/system-design-labs/stream_lab.py --test
```

Обе команды завершились с кодом 0. Проверены JSON и after_crash/after_restart: early до restart имеет offset1 без effect, после — 2 effects/sum5/offset3; late имеет первый effect при offset0, после — 4 effects/sum7/offset3; safe имеет inbox+effect при offset0, после — 3 effects/sum6/offset3 при четырёх доставках.

Без изменения исходников отдельно вызваны функции модели: grace6 принимает позднее e и даёт окно0=13; consumer120 оставляет очередь0/rejected0, consumer0 — очередь200/rejected500 на седьмом такте. Для grace3 итоговые windows `{0:2,1:4,2:3,5:7}`, full batch окно0=13, duplicate a подавлен, late e отклонён. При producer-before-consumer исходного режима очередь140/rejected140 соответствует README.

Готовый `site/web/public/downloads/system-design-labs.zip` распакован в собственную временную папку. Из неё выполнены команды README `python3 stream_lab.py --test` и `python3 -m unittest -v test_cases`: PASS и 9/9 OK. Код Python использует только стандартную библиотеку; пользовательские базы не открывает. Успех тестов не устраняет два замечания выше.

## Проверенные границы и истории

- **WAL:** журнал до изменённой страницы; durable commit зависит от нужного flush и конфигурации; recovery после подтверждения до page flush; потерянный ответ отделён от потерянного commit. Checkpoint не объявлен backup; crash процесса не объявлен тестом потери питания. Проверено по [PostgreSQL WAL](https://www.postgresql.org/docs/18/wal-intro.html).
- **LSM:** WAL→memtable→flush→SSTables; compaction имеет I/O/CPU долг и write/read/space amplification. WAL не считается дважды в примере 20 MB/s ×8=160 MB/s. Удаление tombstone лишь из нового файла действительно возвращает старое значение; безопасный merge оговорён отсутствием нужных snapshots и других старых копий.
- **B+tree:** индекс не объявлен бесплатным или гарантированным index-only scan; видимость и table lookup обозначены. EXPLAIN ANALYZE верно описан как исполнение запроса.
- **MVCC/Read Committed:** обычные SELECT получают statement snapshots; чтение версии не отменяет конфликты UPDATE. Guard в Read Committed берётся до отдельного COUNT; исправление не переносится на прежний Repeatable Read snapshot.
- **Write skew/SSI:** три активных дежурных, две конкурентные проверки COUNT3, разные UPDATE дают active1 при Repeatable Read. Общая guard-row даёт следующему COUNT2; Serializable может отменить транзакцию с 40001, повторяется весь блок с новой проверкой. Точка отказа не зафиксирована как API-контракт; внешнее письмо вынесено из retry. Сверено с [PostgreSQL Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html).
- **SQL-файл:** setup создаёт новую схему в BEGIN/COMMIT при ON_ERROR_STOP; четыре эксперимента представлены комментариями с SESSION/BARRIER/reset; запуск файла не заявлен автоматическим исполнением конкурирующих историй. Guard-сценарий явно требует всех писателей. PostgreSQL/psql не запускались.
- **Поток:** atomic inbox+effect отделён от последующего offset commit; повтор кода не объявлен exactly-once исполнением. Незавершённый предыдущий offset запрещает продвижение непрерывного префикса; HTTP не включён в Kafka-транзакцию. Однопоточная симуляция не выдана за доказательство consumer concurrency или fsync hardware.
- **Late/replay:** max_seen — явная учебная политика, не универсальный watermark Kafka. Same sequence+policy replay совпадает; full batch и stream имеют разные принятые множества. As-of joins, schema/version/configuration и внешние уведомления отделены от произвольного повторного чтения журнала.
- **Core03/06/07/08/09:** денормализация не выдаётся за выбор движка; stale cache fill после invalidation объяснён; quorum intersection не объявлен линеаризуемостью; CAP не сводится к «два из трёх»; escrow требует переноса прав без двойного владения; snapshot+tail и fan-out имеют явную цену.

Арифметика проверена: 100000×200B=20MB; 10000×200B/s=2MB/s; средняя cache latency0,95×1+0,05×20=1,95ms не используется для p99; 32×500=16000 внутренних чтений/s; 10000×500B×3600=18GB и432GB/day; 10000×600×100B=600MB state до overhead.

Неверных гарантий или P1 в содержании хранения/изоляции/stream не обнаружено, кроме двух перечисленных расхождений. Необходимое действие — синхронизировать учебные формулировки с реально исполняемыми границами; добавлять новые темы для этого gate не требуется.

## Закрытие замечаний после исправлений

Оба P2 исправлены в финальной версии. SQL inbox сравнивает payload в той же транзакции; отдельный regression test подтверждает отказ без продвижения offset и без нового эффекта. Соединение закрывается при исключении. Inline setup заменён запуском защищённого transactions.sql. Повторно прошли stream_lab.py --test и команды из заново распакованного финального ZIP. SQL на PostgreSQL по-прежнему не выполнялся.

Последующая проверка интеграции: на отдельном PostgreSQL 18.6 выполнены setup/collision и двухсессионные истории lost update, write skew, guard и Serializable. Первоначальное ограничение SQL-исполнения закрыто; историческое описание выше относится к моменту независимого разбора.
