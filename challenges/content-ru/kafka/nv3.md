На этом этапе вы отправите ответ с идентификатором корреляции.

### Сетевой протокол Kafka

Брокеры Kafka общаются с клиентами по [сетевому протоколу Kafka](https://kafka.apache.org/42/design/protocol/). Он использует модель «запрос — ответ»: клиент отправляет сообщение запроса, а брокер возвращает сообщение ответа.

Сообщение Kafka состоит из трёх частей:

1. `message_size`.
2. Заголовок.
3. Тело.

На этом этапе можно игнорировать тело и сосредоточиться на `message_size` и заголовке. Тела ответов мы рассмотрим позже.

### Поле `message_size`

Поле [`message_size`](https://kafka.apache.org/42/design/protocol/#common-request-and-response-structure) — 32-битное целое число со знаком, задающее размер заголовка и тела в байтах.

Все целые числа в протоколе Kafka используют порядок байтов [big-endian](https://developer.mozilla.org/en-US/docs/Glossary/Endianness). Например, `message_size`, равное `2`, выглядит так:

```
00 00 00 02  // message_size: 2
```

На этом этапе достаточно, чтобы поле `message_size` занимало 4 байта. Правильные значения `message_size` вы реализуете позже.

### Заголовок ответа v0

В Kafka есть несколько версий заголовка. На этом этапе вы используете [заголовок ответа v0](https://kafka.apache.org/42/design/protocol/#the-messages) — самую простую версию.

Заголовок ответа v0 содержит единственное поле: [`correlation_id`](https://developer.confluent.io/patterns/event/correlation-identifier/). Оно позволяет клиенту сопоставлять ответы с исходными запросами.

Поле `correlation_id` также является 32-битным целым числом со знаком. На этом этапе программа должна возвращать жёстко заданное значение `correlation_id`, равное `7`.

Таким образом, весь ответ должен занимать 8 байт: 4 байта для `message_size` и 4 байта для заголовка (`correlation_id`).

```
00 00 00 00  // message_size:   0 (any value works for this stage)
00 00 00 07  // correlation_id: 7
```

### Тесты

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh
```

Затем подключится к брокеру на порту `9092` и отправит запрос:

```
$ echo -n "Placeholder request" | nc -v localhost 9092 | hexdump -C
```

Брокер должен отправить ответ следующей структуры:

```
00 00 00 00  // message_size:   0 (any value works for this stage)
00 00 00 07  // correlation_id: 7
```

Тестирующая система проверит, что:

- Общая длина ответа — 8 байт: 4 для `message_size` и 4 для `correlation_id`.
- Поле `correlation_id` содержит `7`.

### Примечания

- На этом этапе разбирать запрос не нужно. Вы научитесь этому позже.
- Все целые числа используют порядок байтов [big-endian](https://developer.mozilla.org/en-US/docs/Glossary/Endianness).
