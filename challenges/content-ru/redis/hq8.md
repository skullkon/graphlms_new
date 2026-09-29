На этом этапе вы добавите проверку идентификаторов записей в `XADD`.

### Идентификаторы записей

Идентификаторы обеспечивают порядок записей в потоках Redis.

Каждый идентификатор состоит из двух целых чисел, разделённых дефисом: `<millisecondsTime>-<sequenceNumber>`.

Например:

```yaml
entries:
  - id: 1526985054069-0 # (ID of the first entry)
    temperature: 36
    humidity: 95

  - id: 1526985054079-0 # (ID of the second entry)
    temperature: 37
    humidity: 94

  # ... (and so on)
```

Идентификаторы уникальны в пределах потока и гарантированно возрастают: идентификатор новой записи всегда больше идентификаторов всех предыдущих.

### Задание идентификаторов в `XADD`

Идентификатор в `XADD` можно указать в трёх форматах:

- Явно (`1526919030474-0`).
- С автоматическим порядковым номером (`1526919030474-*`).
- С автоматическими временем и порядковым номером (`*`).

Пока вы будете обрабатывать только явные идентификаторы, например `1526919030474-0`. Два других варианта появятся позже.

Реализация `XADD` должна проверять идентификатор по правилам:

- Идентификатор строго больше идентификатора последней записи.
  - Часть `millisecondsTime` нового идентификатора больше либо равна `millisecondsTime` последней записи.
  - Если значения `millisecondsTime` равны, `sequenceNumber` новой записи должен быть больше `sequenceNumber` последней.
- Если поток пуст, идентификатор должен быть больше `0-0`. Минимальный допустимый идентификатор Redis — `0-1`.

Пример добавления записи с корректным, а затем некорректным идентификатором:

```bash
$ redis-cli XADD some_key 1-1 foo bar
"1-1"
$ redis-cli XADD some_key 1-1 bar baz
(error) ERR The ID specified in XADD is equal or smaller than the target stream top item
```

Вторая команда завершается ошибкой, поскольку `1-1` не больше последнего идентификатора.

Ещё один пример:

```bash
$ redis-cli XADD some_key 1-1 foo bar
"1-1"
$ redis-cli XADD some_key 0-2 bar baz
(error) ERR The ID specified in XADD is equal or smaller than the target stream top item
```

Идентификатор `0-2` некорректен: его `millisecondsTime` меньше `millisecondsTime` последнего идентификатора.

Наконец, `0-0` всегда недопустим: идентификаторы должны быть строго больше `0-0`:

```bash
$ redis-cli XADD some_key 0-0 bar baz
(error) ERR The ID specified in XADD must be greater than 0-0
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст несколько записей через `XADD`.

```bash
$ redis-cli XADD stream_key 1-1 foo bar
"1-1"
$ redis-cli XADD stream_key 1-2 bar baz
"1-2"
```

После этого отправит несколько команд `XADD` с некорректными идентификаторами, например `1-2` или `0-3`.

```bash
# The exact time and sequence number as the last entry
$ redis-cli XADD stream_key 1-2 baz foo
(error) ERR The ID specified in XADD is equal or smaller than the target stream top item

# A smaller value for the time and a larger value for the sequence number
$ redis-cli XADD stream_key 0-3 baz foo
(error) ERR The ID specified in XADD is equal or smaller than the target stream top item
```

В каждом случае сервер должен ответить `-ERR The ID specified in XADD is equal or smaller than the target stream top item\r\n\` в формате [простой ошибки](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-errors).

Затем тест отправит ещё одну `XADD` с идентификатором `0-0`.

```bash
$ redis-cli XADD stream_key 0-0 baz foo
(error) ERR The ID specified in XADD must be greater than 0-0
```

Сервер должен ответить `-ERR The ID specified in XADD must be greater than 0-0\r\n`: сообщением об ошибке выше в формате [простой ошибки](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-errors).
