На этом этапе вы реализуете ответ `DescribeTopicPartitions` для неизвестного топика.

### API `DescribeTopicPartitions`: повторение

Напомним: API [`DescribeTopicPartitions`](https://kafka.apache.org/42/design/protocol/#The_Messages_DescribeTopicPartitions) возвращает метаданные [топиков](https://kafka.apache.org/42/getting-started/introduction/#main-concepts-and-terminologys:~:text=topics) и их [разделов](https://kafka.apache.org/42/getting-started/introduction/#main-concepts-and-terminologys:~:text=partitioned). На этом этапе вы обработаете случай запроса несуществующего топика.

Мы создали интерактивный обозреватель запроса и ответа `DescribeTopicPartitions`:

- 🔎 [Запрос DescribeTopicPartitions (v0)](https://binspec.org/kafka-describe-topic-partitions-request-v0)
- 🔎 [Ответ DescribeTopicPartitions (v0) — неизвестный топик](https://binspec.org/kafka-describe-topic-partitions-response-v0-unknown-topic)

### Разбор запроса

Чтобы ответить правильно, нужно разобрать запрос `DescribeTopicPartitions` и извлечь имя топика. [Запрос `DescribeTopicPartitions` (v0)](https://kafka.apache.org/42/design/protocol/#The_Messages_DescribeTopicPartitions) содержит:

| Поле | Тип данных | Описание |
| ------------ | --------------- | ----------------------------------- |
| `topics` | `COMPACT_ARRAY` | Массив топиков, для которых запрашиваются метаданные |
| `TAG_BUFFER` | `TAGGED_FIELDS` | Поля с тегами |

Каждый топик массива `topics` содержит:

| Поле | Тип данных | Описание |
| ------------ | ---------------- | -------------- |
| `topic_name` | `COMPACT_STRING` | Имя топика |
| `TAG_BUFFER` | `TAGGED_FIELDS` | Поля с тегами |

На этом этапе запрос содержит одно имя топика. Нужно извлечь его и повторить в ответе.

### Заголовок ответа v1

Ранее вы использовали заголовок ответа v0, содержавший только `correlation_id`. Теперь понадобится [заголовок ответа v1](https://kafka.apache.org/42/design/protocol/#the-messages) со следующей структурой:

| Поле | Тип данных | Описание |
| ---------------- | --------------- | ------------------------------------ |
| `correlation_id` | `INT32` | Совпадает с идентификатором корреляции запроса |
| `TAG_BUFFER` | `TAGGED_FIELDS` | Поля с тегами |

Главное отличие — добавление поля `TAG_BUFFER`. Можно оставить `TAG_BUFFER` пустым.

### Тело ответа `DescribeTopicPartitions`

Тело ответа `DescribeTopicPartitions` имеет следующую структуру:

| Поле | Тип данных | Описание |
| ------------------ | --------------- | --------------------------------------- |
| `throttle_time_ms` | `INT32` | Время ограничения скорости в миллисекундах (используйте `0`) |
| `topics` | `COMPACT_ARRAY` | Массив метаданных топиков |
| `next_cursor` | `NULLABLE_INT8` | Курсор постраничного просмотра (для null используйте `-1`) |
| `TAG_BUFFER` | `TAGGED_FIELDS` | Поля с тегами |

Каждый топик массива `topics` содержит:

| Поле | Тип данных | Описание |
| ----------------------------- | ---------------- | ----------------------------------------------- |
| `error_code` | `INT16` | Код ошибки |
| `topic_name` | `COMPACT_STRING` | Имя топика из запроса |
| `topic_id` | `UUID` | UUID топика |
| `is_internal` | `BOOLEAN` | Является ли топик внутренним |
| `partitions` | `COMPACT_ARRAY` | Массив метаданных разделов (пустой для неизвестного топика) |
| `topic_authorized_operations` | `INT32` | Битовое поле разрешённых операций (используйте `0`) |
| `TAG_BUFFER` | `TAGGED_FIELDS` | Поля с тегами |

На этом этапе считайте все топики неизвестными. Для неизвестного топика ответ должен:

- Устанавливать `error_code` в `3` (`UNKNOWN_TOPIC_OR_PARTITION`).
- Повторять `topic_name` из запроса.
- Устанавливать `topic_id` в `00000000-0000-0000-0000-000000000000` (все нули).
- Устанавливать `is_internal` в `false`.
- Оставлять массив `partitions` пустым.
- Устанавливать `next_cursor` в `-1` (null).

Пример ответа для топика `"foo"`:

```java
00 00 00 2f  // message_size:                 47 bytes
ab cd ef 12  // correlation_id:               (matches request)
00           // TAG_BUFFER:                   empty (response header v1)
00 00 00 00  // throttle_time_ms:             0
02           // topics array:                 1 element
00 03        // error_code:                   3 (UNKNOWN_TOPIC_OR_PARTITION)
04           // name length:                  3 (compact string)
66 6f 6f     // topic_name:                         "foo"
00 00 00 00  // topic_id:                     00000000-0000-0000-
00 00 00 00  //                               0000-000000000000
00 00 00 00  //                               (16 bytes total)
00 00 00 00  //
00           // is_internal:                  false
01           // partitions array:             0 elements (empty)
00 00 00 00  // topic_authorized_operations:  0
00           // TAG_BUFFER:                   empty
ff           // next_cursor:                  -1 (null)
00           // TAG_BUFFER:                   empty
```

### Тесты

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh /tmp/server.properties
```

Затем подключится к серверу на порту `9092` и отправит запрос `DescribeTopicPartitions` (v0) с одним именем топика.

```
echo -n "00000020004b00000000000700096b61666b612d636c69000204666f6f0000000064ff00" | xxd -r -p | nc localhost 9092 | hexdump -C
```

Она проверит, что:

- Поле `message_size` правильно отражает размер заголовка и тела.
- Идентификатор корреляции в заголовке ответа совпадает с идентификатором в заголовке запроса.
- Ответ использует заголовок ответа v1 (с `TAG_BUFFER`).
- Поле `error_code` в теле ответа равно `3` (`UNKNOWN_TOPIC_OR_PARTITION`).
- Тело является корректным ответом DescribeTopicPartitions (v0).
- Поле `topic_name` ответа равно имени топика из запроса.
- Поле `topic_id` ответа равно `00000000-0000-0000-0000-000000000000`.
- Поле `partitions` ответа пусто.
- Значение `next_cursor` равно `-1`, то есть курсор равен null.

### Примечания

- На этом этапе нужно разобрать запрос `DescribeTopicPartitions`, чтобы получить имя топика для ответа.
- Пока можно считать все топики неизвестными. Различать существующие и неизвестные топики мы научимся позже.
