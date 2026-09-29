На этом этапе вы реализуете ответ `DescribeTopicPartitions` для одного топика.

### API `DescribeTopicPartitions`: повторение

Напомним: API [`DescribeTopicPartitions`](https://kafka.apache.org/42/design/protocol/#The_Messages_DescribeTopicPartitions) возвращает метаданные [топиков](https://kafka.apache.org/42/getting-started/introduction/#main-concepts-and-terminologys:~:text=topics) и их [разделов](https://kafka.apache.org/42/getting-started/introduction/#main-concepts-and-terminologys:~:text=partitioned). Ранее вы считали все топики неизвестными. Теперь прочитаете настоящие метаданные топика из журнала метаданных кластера и отправите корректный ответ для этого топика.

Мы создали интерактивный обозреватель формата метаданных кластера и структуры ответа `DescribeTopicPartitions`:

- 🔎 [Файл журнала метаданных кластера](https://binspec.org/kafka-cluster-metadata)
- 🔎 [Ответ DescribeTopicPartitions (v0)](https://binspec.org/kafka-describe-topic-partitions-response-v0)

### Устройство журнала метаданных кластера

Kafka хранит метаданные топиков в топике `__cluster_metadata`. Это внутренний топик с записями о создании топиков, назначении разделов и других настройках кластера. Чтобы проверить существование топика и получить его метаданные, нужно прочитать файл журнала метаданных кластера.

Файл находится по пути:

```
/tmp/kraft-combined-logs/__cluster_metadata-0/00000000000000000000.log
```

Нужно разобрать этот файл и извлечь:

- Имена топиков и их UUID.
- Идентификаторы разделов каждого топика.

Документация Kafka не описывает подробно внутреннюю структуру записей `__cluster_metadata`, но определения схем можно найти в [исходном коде Kafka](https://github.com/apache/kafka/tree/5b3027dfcbcb62d169d4b4421260226e620459af/metadata/src/main/resources/common/metadata).

### Формирование ответа для существующего топика

Если топик существует, ответ должен содержать полные метаданные. Основные отличия от ответа `"unknown topic"`:

- Установить `error_code` в `0` (нет ошибки).
- Использовать настоящий `topic_id` (UUID) из метаданных кластера вместо нулей.
- Включить сведения о разделах в массив `partitions`.

Каждая запись раздела в массиве `partitions` содержит:

| Поле | Тип данных | Описание |
| -------------------------- | --------------- | -------------------------------------------- |
| `error_code` | `INT16` | Код ошибки (0 для существующих разделов) |
| `partition_index` | `INT32` | Идентификатор раздела |
| `leader_id` | `INT32` | Идентификатор брокера, на котором расположен раздел |
| `leader_epoch` | `INT32` | Эпоха лидера |
| `replica_nodes` | `COMPACT_ARRAY` | Массив идентификаторов брокеров реплик |
| `isr_nodes` | `COMPACT_ARRAY` | Массив идентификаторов брокеров синхронизированных реплик |
| `eligible_leader_replicas` | `COMPACT_ARRAY` | Массив идентификаторов брокеров реплик, пригодных для избрания лидером |
| `last_known_elr` | `COMPACT_ARRAY` | Массив последних известных реплик, пригодных для избрания лидером |
| `offline_replicas` | `COMPACT_ARRAY` | Массив идентификаторов брокеров недоступных реплик |
| `TAG_BUFFER` | `TAGGED_FIELDS` | Поля с тегами |

На этом этапе тестирующая система запрашивает топики с одним разделом.

Пример ответа для топика `"foo"` с одним разделом:

```
00 00 00 4a  // message_size:                 74 bytes
ab cd ef 12  // correlation_id:               (matches request)
00           // TAG_BUFFER:                   empty (response header v1)
00 00 00 00  // throttle_time_ms:             0
02           // topics array:                 1 element
00 00        // error_code:                   0 (no error)
04           // name length:                  3 (compact string)
66 6f 6f     // name:                         "foo"
a1 b2 c3 d4  // topic_id:                     (actual UUID from metadata)
e5 f6 a7 b8  //                               (16 bytes total)
c9 d0 e1 f2  //
a3 b4 c5 d6  //
00           // is_internal:                  false
02           // partitions array:             1 element
00 00        // error_code:                   0 (no error)
00 00 00 00  // partition_index:              0
00 00 00 01  // leader_id:                    1
00 00 00 00  // leader_epoch:                 0
02           // replica_nodes:                1 element
00 00 00 01  //                               broker 1
02           // isr_nodes:                    1 element
00 00 00 01  //                               broker 1
01           // eligible_leader_replicas:     0 elements (empty)
01           // last_known_elr:               0 elements (empty)
01           // offline_replicas:             0 elements (empty)
00           // TAG_BUFFER:                   empty
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

Затем отправит запрос `DescribeTopicPartitions` (v0) для существующего топика с одним разделом.

Она проверит, что:

- Поле `message_size` правильно отражает размер заголовка и тела.
- Идентификатор корреляции в заголовке ответа совпадает с идентификатором в заголовке запроса.
- Поле `error_code` записи топика равно `0` (нет ошибки).
- Ответ является корректным ответом `DescribeTopicPartitions` (v0).
- Поле `topic_name` совпадает с именем топика из запроса.
- Поле `topic_id` совпадает с настоящим UUID из метаданных кластера.
- Массив `partitions` содержит одну запись раздела.
- Поле `error_code` раздела равно `0` (нет ошибки).
- Поле `partition_index` совпадает с идентификатором раздела из метаданных.
- Значение `next_cursor` равно `-1` (null).

### Примечания

- Чтобы получить сведения о топике и разделах, нужно разобрать файл журнала метаданных кластера.
- Официальная документация протокола Kafka не описывает структуру `__cluster_metadata` подробно. Определения схем см. в [исходном коде Kafka](https://github.com/apache/kafka/tree/5b3027dfcbcb62d169d4b4421260226e620459af/metadata/src/main/resources/common/metadata).
- Полная схема ответа приведена в [официальной документации `DescribeTopicPartitions`](https://kafka.apache.org/42/design/protocol/#The_Messages_DescribeTopicPartitions).
