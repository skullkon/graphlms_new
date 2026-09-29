# Проверенные источники курса System Design

Дата проверки ссылок: **28 сентября 2026**. Это карта чтения, а не список обязательных книг. Все перечисленные страницы доступны для чтения бесплатно; облачные ресурсы для упражнений не требуются. Почти все оригиналы на английском: ученик сначала читает русское объяснение курса, затем выбранный фрагмент. «Документация» означает обновляемый источник, а не известную дату публикации. Версии следует закреплять в лабораторных; ссылки `current` со временем меняются.

Обозначения: **Б** — базовый уровень, **С** — средний, **П** — продвинутый. Время ниже — авторская оценка для выборочного чтения после объяснения преподавателя, не длительность полного материала. Подтверждение доступности не равно проверке каждого утверждения на всех страницах большого курса. Публикации компаний описывают состояние на дату публикации и не доказывают нынешнюю архитектуру.

## Первые опоры

| ID | Источник, автор / дата | Вход и чтение | Зачем читать → что сделать |
|---|---|---|---|
| S01 | [How does the Internet work? — MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work), обновлено 04.09.2026 | Б; без подготовки; 20 мин | Отличить сеть, IP и доменное имя → нарисовать путь запроса из дома в LMS. Это вводный учебный источник Mozilla, не стандарт протокола. |
| S02 | [Overview of HTTP — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview), документация | Б; S01; 25 мин | Запрос, ответ, клиент, сервер, посредник → разобрать GET курса и POST записи. |
| S03 | [Beej’s Guide to Network Programming — Brian Hall](https://beej.us/guide/bgnet/html/split/), авторский открытый учебник | С; функции и основы C для кода; 30 мин выбранных разделов | Сокет и клиент–сервер → объяснить, почему одно соединение не является одним бизнес-запросом. Реализацию на C сделать факультативной. |
| S04 | [Operating Systems: Three Easy Pieces — Remzi и Andrea Arpaci-Dusseau](https://pages.cs.wisc.edu/~remzi/OSTEP/), открытые главы | С; переменные, процессы; 40 мин выбранной главы | Виртуализация, конкурентность, сохранность → показать потерянное обновление счётчика на бумаге. Полный учебник не задавать новичку. |
| S05 | [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html), документация, при проверке v18 | Б; таблицы и простая программа; 40 мин | SQL и реляционная модель → создать students, courses, enrollments и уникальность пары student/course. |
| S06 | [C4 model — Simon Brown](https://c4model.com/), официальный сайт метода | Б; S02; 20 мин | Отделить контекст от внутренностей → две схемы LMS с подписями ответственности. Не требовать всех четырёх уровней на интервью. |

## Данные и доставка

| ID | Источник, автор / дата | Вход и чтение | Зачем читать → что сделать |
|---|---|---|---|
| S07 | [PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html), документация | С; S05; 30 мин | Индекс выбирают под запрос → подобрать составной индекс списка записей ученика; назвать цену записи и диска. |
| S08 | [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), документация | С; S07; 35 мин | Проверять план, а не верить названию индекса → сравнить планы до/после. `EXPLAIN ANALYZE` действительно исполняет запрос. |
| S09 | [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), документация | С; SQL и конкурентные запросы; 40 мин | Изоляция и аномалии → два одновременных бронирования последнего места, затем исправление и повтор теста. |
| S10 | [PostgreSQL 18: Backup and Restore](https://www.postgresql.org/docs/18/backup.html), документация | С; локальная БД; 25 мин | Разные способы копирования → восстановить учебную БД в новый экземпляр и сверить строки. |
| S11 | [PostgreSQL 18: Log-Shipping Standby Servers](https://www.postgresql.org/docs/18/warm-standby.html), документация | С; транзакции и журнал; 35 мин | Репликация и задержка → объяснить устаревший прогресс на read replica; сопоставить async/sync. |
| S12 | [HTTP caching — MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching), документация | С; S02; 30 мин | Свежесть и валидация → выбрать Cache-Control для публичной обложки и личного прогресса; разобрать ETag. |
| S13 | [Apache Kafka 4.1: Design](https://kafka.apache.org/41/design/design/), официальная документация | С/П; очередь, репликация; 45 мин выбранных разделов | Partition, offset, доставка и транзакции → проиграть падение consumer до/после фиксации результата. Не переносить гарантии Kafka автоматически на внешнюю БД. |
| S14 | [RabbitMQ: Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms), документация | С; producer/consumer; 30 мин | Различать publisher confirm и consumer ack → определить момент ack у обработчика уведомления; показать redelivery. |
| S15 | [Transactional outbox — AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html), документация | С; транзакции и очередь; 25 мин | Согласовать запись и событие → записать enrollment и outbox в одной транзакции, добавить дедупликацию consumer. |
| S16 | [Saga orchestration — AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html), документация | П; S15 и состояния; 30 мин | Долгий бизнес-процесс и компенсации → оплата/выдача доступа/возврат; назвать необратимые действия. |

## Отказы, эксплуатация и безопасность

| ID | Источник, автор / дата | Вход и чтение | Зачем читать → что сделать |
|---|---|---|---|
| S17 | [Timeouts, retries, and backoff with jitter — Marc Brooker, AWS, PDF](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf), 2019 | С; HTTP и вероятность; 30 мин | Retry может усилить перегрузку → задать общий deadline, лимит попыток и случайную задержку. [HTML](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) перенаправляется в AWS Builder Center. |
| S18 | [Making retries safe with idempotent APIs — AWS Builders’ Library](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/), инженерная статья | С; S17; 30 мин | Идентичный запрос и одинаковое намерение — разные вещи → спроектировать ключ операции и обработку несовпадения параметров. |
| S19 | [Service Level Objectives — Google SRE book](https://sre.google/sre-book/service-level-objectives/), 2016 | С; проценты, latency; 30 мин | SLI/SLO и пользовательский результат → определить долю успешных записей на курс и окно измерения. |
| S20 | [Alerting on SLOs — Google SRE Workbook](https://sre.google/workbook/alerting-on-slos/), 2018 | П; S19; 40 мин | Бюджет ошибок и burn rate → сравнить краткий всплеск и длительное ухудшение; предложить сигнал дежурному. |
| S21 | [Signals — OpenTelemetry](https://opentelemetry.io/docs/concepts/signals/), документация | С; сервисы и запросы; 25 мин | Метрики, логи, трассировки → проследить запись на курс через API и worker; убрать личные данные из примера. |
| S22 | [OWASP API Security Top 10 — 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/), проект OWASP | С; API и пользователи; 30 мин | Проверять объектные права и расход ресурсов → пользователь A не читает прогресс B, массовые запросы имеют лимиты. Это перечень рисков, не полная модель угроз. |
| S23 | [Site Reliability Engineering — Google, оглавление](https://sre.google/sre-book/table-of-contents/), 2016 | С/П; по теме; 30–45 мин за главу | Дополнительные главы про overload, cascading failures и postmortem → разбор отказа зависимости и режим деградации LMS. |

## Реальные системы и инциденты

| ID | Источник, автор / дата | Вход и чтение | Зачем читать → что сделать |
|---|---|---|---|
| S24 | [The Google File System — Ghemawat, Gobioff, Leung](https://research.google/pubs/the-google-file-system/), SOSP 2003 | П; файлы и репликация; 45 мин | Дизайн под конкретную нагрузку → объяснить, почему хранение больших файлов отличается от таблицы платежей. Открытый PDF связан со страницы. |
| S25 | [Bigtable — Chang et al., Google](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/), OSDI 2006 | П; ключи и partitioning; 45 мин | Модель данных и размещение → предложить row key для прогресса и найти горячий диапазон. |
| S26 | [Dynamo — DeCandia et al., Amazon](https://www.amazon.science/publications/dynamo-amazons-highly-available-key-value-store), 2007 | П; репликация и версии; 45 мин | Доступная запись и разрешение конфликтов → нарисовать две версии корзины и правило слияния. Не отождествлять бумагу Dynamo с современным DynamoDB. |
| S27 | [Spanner — Corbett et al., Google](https://research.google/pubs/spanner-googles-globally-distributed-database-2/), OSDI 2012 | П; транзакции, репликация, часы; 45 мин | Глобальная согласованность → объяснить роль неопределённости времени и цену межрегионального взаимодействия. Не выдавать abstract за доказательство алгоритма. |
| S28 | [Scaling Memcache at Facebook — Nishtala et al.](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala), NSDI 2013 | П; кэш и БД; 40 мин | Кэш как распределённая система → разобрать устаревшее заполнение и лавину cache miss. Полный paper и выступление доступны на странице. |
| S29 | [How Discord Stores Trillions of Messages — Discord Engineering](https://discord.com/blog/how-discord-stores-trillions-of-messages), 2023 | С/П; partitioning и миграции; 35 мин | Горячие разделы, промежуточный сервис, проверка миграции → схема migration + dual read comparison. Результаты относятся к нагрузке Discord. |
| S30 | [Designing robust and predictable APIs with idempotency — Brandur Leach, Stripe](https://stripe.com/blog/idempotency), 22.02.2017 | С; HTTP и ошибки; 25 мин | Неизвестный результат после обрыва связи → схема «операция завершена, ответ потерян, клиент повторил». |
| S31 | [Idempotent requests — Stripe API](https://docs.stripe.com/api/idempotent_requests), документация | С; S30; 15 мин | Проверить конкретный контракт API → таблица одинаковый ключ/другие параметры/истёкшее хранение ключа. Контракт провайдера не универсален. |
| S32 | [Details of the Cloudflare outage on July 2, 2019 — Cloudflare](https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/), 2019 | С; CPU и rollout; 30 мин | Ошибка правила и масштаб распространения → предложить этапы развёртывания и независимый путь отката. |
| S33 | [October 21 post-incident analysis — GitHub](https://github.blog/news-insights/company-news/oct21-post-incident-analysis/), инцидент 21.10.2018 | П; репликация и failover; 35 мин | Короткое сетевое нарушение, долгое восстановление → timeline состояния БД и критерии безопасного возврата трафика. |
| S34 | [Netflix Open Connect — официальный обзор и sample architectures](https://openconnect.netflix.com/en/), обновляемая страница | С; CDN и сети; 25 мин | Доставка видео ближе к зрителю → схема origin/edge/ISP и резервный маршрут. Это описание доставки, не всей архитектуры Netflix. |

## Теория и маршрут для углубления

| ID | Источник, автор / дата | Вход и чтение | Зачем читать → что сделать |
|---|---|---|---|
| S35 | [Time, Clocks, and the Ordering of Events in a Distributed System — Leslie Lamport](https://lamport.azurewebsites.net/pubs/time-clocks.pdf), 1978 | П; события и отношения; 45 мин | Причинность → проставить логические метки и найти события, порядок которых неизвестен. |
| S36 | [In Search of an Understandable Consensus Algorithm — Ongaro, Ousterhout](https://raft.github.io/raft.pdf), 2014, extended paper | П; majority, журнал, отказы; 60 мин выбранных разделов | Выбор лидера и согласованный журнал → три узла, падение лидера, незавершённая запись. Консенсус не решает все бизнес-инварианты автоматически. |
| S37 | [MIT 6.5840: Distributed Systems, schedule](https://pdos.csail.mit.edu/6.824/schedule.html), весна 2026 при проверке | П; программирование, OS, сети; самостоятельный трек | Связка papers/вопросы/labs → факультативная реализация репликации. Это продолжение курса, не старт для школьника. |
| S38 | [CMU Database Systems: syllabus](https://15445.courses.cs.cmu.edu/fall2024/syllabus.html), осень 2024 | П; системное программирование; самостоятельный трек | Устройство СУБД и строгие prerequisites → факультативное углубление в буферный пул, индексы, выполнение запросов. |

## Дополнения для продвинутых задач

| ID | Источник, автор / дата | Вход и чтение | Зачем читать → что сделать |
|---|---|---|---|
| S39 | [Brewer’s Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services — Gilbert, Lynch](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf), 2002, PDF на странице автора в NUS | П; репликация, история операций; 40 мин | Формальные определения CAP → после завершённой записи изолировать второй узел и запросить чтение; объяснить конфликт атомарной согласованности и доступности в модели статьи. |
| S40 | [RFC 6455: The WebSocket Protocol — Fette, Melnikov](https://www.rfc-editor.org/info/rfc6455/), декабрь 2011 | С/П; HTTP и соединения; 30 мин выбранных разделов | Handshake, frames, close → спроектировать чат с переподключением. Протокол транспорта не гарантирует сохранение истории сообщений. |
| S41 | [Near real-time search — Elastic](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search), документация | С; поисковый индекс; 20 мин | Refresh и видимость документа → новый курс записан в БД, но ещё не найден поиском; определить UX-контракт задержки. |
| S42 | [ST_DWithin — PostGIS](https://postgis.net/docs/ST_DWithin.html), документация | П; SQL, координаты, spatial index; 25 мин | Расстояние и пространственный запрос → найти учебные центры в радиусе; различить единицы geometry/geography и проверить план. |

## Граница проверки и оставшиеся пробелы

Библиотека покрывает сети, модель данных, API, индексы, транзакции, репликацию, кэш, очередь, согласование событий, отказоустойчивость, наблюдаемость, безопасность и исторические кейсы. Она **не является** полным курсом программирования, криптографии, сетевого администрирования, формальной верификации или финансового учёта.

CAP закрыт первичной публикацией S39: формальная доступность не тождественна процентному SLO, а согласованность здесь — atomic consistency. WebSocket, поиск и геозапросы имеют официальные вводные опоры S40–S42, но глубокие лабораторные по ним требуют дополнительного изучения доставки, переиндексации и пространственных моделей. Медиатранскодирование пока не покрыто специализированным источником. Не подменять этот пробел пересказом несуществующей «архитектуры YouTube».

Права: библиотека даёт ссылки и оригинальные русские задания. Бесплатное чтение не разрешает перепубликовывать главы, схемы или видео. В курсе использовать собственные схемы с пометкой «учебная модель по мотивам Sxx»; прямое воспроизведение проверять по лицензии конкретного источника.
