На этом этапе вы добавите запись API `DescribeTopicPartitions` в ответ `ApiVersions`.

### API `ApiVersions`: повторение

Напомним: API [`ApiVersions`](https://kafka.apache.org/42/design/protocol/#The_Messages_ApiVersions) возвращает поддерживаемые брокером версии API. [Ответ](https://binspec.org/kafka-api-versions-Response-v4) содержит список API с минимальной и максимальной поддерживаемыми версиями каждого.

На предыдущих этапах вы реализовали ответ `ApiVersions` с единственной записью для самого API `ApiVersions`. Теперь добавите вторую запись — для API `DescribeTopicPartitions`.

### API `DescribeTopicPartitions`

API [`DescribeTopicPartitions`](https://kafka.apache.org/42/design/protocol/#The_Messages_DescribeTopicPartitions) возвращает метаданные [топиков](https://kafka.apache.org/42/getting-started/introduction/#main-concepts-and-terminologys:~:text=topics) и их [разделов](https://kafka.apache.org/42/getting-started/introduction/#main-concepts-and-terminologys:~:text=partitioned). На этом этапе достаточно объявить его поддержку в ответе `ApiVersions`. Саму обработку API вы реализуете позже.

Теперь массив `api_keys` ответа `ApiVersions` должен содержать две записи:

- `ApiVersions` (ключ API `18`): `min_version` `0`, `max_version` `4`.
- `DescribeTopicPartitions` (ключ API `75`): `min_version` `0`, `max_version` `0`.

Пример обновлённого ответа:

```bash
00 00 00 1d  // message_size:      29 bytes
ab cd ef 12  // correlation_id:    (matches request)
00 00        // error_code:        0 (no error)
03           // api_keys array:    2 elements (compact array encoding)
00 12        // api_key:           18 (ApiVersions)
00 00        // min_version:       0
00 04        // max_version:       4
00           // TAG_BUFFER:        empty
00 4b        // api_key:           75 (DescribeTopicPartitions)
00 00        // min_version:       0
00 00        // max_version:       0
00           // TAG_BUFFER:        empty
00 00 00 00  // throttle_time_ms:  0
00           // TAG_BUFFER:        empty
```

### Тесты

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh /tmp/server.properties
```

Затем подключится к серверу на порту `9092` и отправит корректный запрос `ApiVersions` (v4):

```
$ echo -n "0000001a0012000467890abc00096b61666b612d636c69000a6b61666b612d636c6904302e3100" | xxd -r -p | nc localhost 9092 | hexdump -C
```

Она проверит, что:

- Поле `message_size` правильно отражает размер заголовка и тела.
- Идентификатор корреляции в заголовке ответа совпадает с идентификатором в заголовке запроса.
- Поле `error_code` в теле ответа равно `0` (нет ошибки).
- Тело ответа содержит записи для ключей API 18 (`ApiVersions`) и 75 (`DescribeTopicPartitions`).
- Запись ключа API `18` (`ApiVersions`) содержит `min_version`, равное `0`, и `max_version` не меньше `4`.
- Запись ключа API `75` (`DescribeTopicPartitions`) содержит `min_version`, равное `0`, и `max_version` не меньше `0`.

### Примечания

- Чтобы проходить предыдущие этапы, ответ по-прежнему должен содержать запись `ApiVersions`.
- Обработку запроса `DescribeTopicPartitions` мы реализуем позже. Пока достаточно добавить запись в ответ ApiVersions.
