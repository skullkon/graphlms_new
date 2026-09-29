На этом этапе вы добавите создание [потоков Redis](https://redis.io/docs/latest/develop/data-types/streams/) командой `XADD`.

### Потоки и записи Redis

[Поток Redis](https://redis.io/docs/latest/develop/data-types/streams/) хранит по заданному ключу последовательность записей в хронологическом порядке. Каждая запись состоит из уникального идентификатора и одной или нескольких пар «ключ — значение».

Например, поток данных с датчика температуры и влажности в реальном времени мог бы выглядеть так:

```yaml
entries:
  - id: 1526985054069-0 # (ID of the first entry)
    temperature: 36 # (A key-value pair in the first entry)
    humidity: 95 # (Another key-value pair)

  - id: 1526985054079-0 # (ID of the second entry)
    temperature: 37 # (A key-value pair in the second entry)
    humidity: 94 # (Another key-value pair)

  # ... (and so on)
```

Структуру идентификаторов записей, таких как `1526985054069-0`, мы подробнее рассмотрим позже.

### Команда `XADD`

Команда [`XADD`](https://redis.io/commands/xadd/) добавляет запись в конец потока. Если потока ещё нет, он создаётся автоматически.

Аргументы `XADD`: ключ потока, идентификатор записи и одна или несколько пар «ключ — значение»:

```bash
$ redis-cli XADD stream_key 1526919030474-0 temperature 36 humidity 95
"1526919030474-0"
```

Возвращается идентификатор добавленной записи в виде [объёмной строки](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

`XADD` поддерживает и другие [необязательные аргументы](https://redis.io/docs/latest/commands/xadd/#optional-arguments), но в этом задании мы их не рассматриваем.

`XADD` также поддерживает автоматическую генерацию идентификаторов, но пока вы будете работать только с явными идентификаторами, например `1526919030474-0`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит серверу `XADD` и будет ожидать идентификатор в ответе. Например:

```bash
$ redis-cli XADD stream_key 0-1 foo bar
"0-1"
```

В этом случае сервер должен ответить `$3\r\n0-1\r\n`: идентификатором `0-1` в формате [объёмной строки](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

После этого тест отправит `TYPE`, чтобы проверить тип ключа.

```bash
$ redis-cli TYPE stream_key
"stream"
```

Сервер должен ответить `+stream\r\n`: значением `stream` в формате [простой строки](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings).

### Примечания

- Команда `TYPE` должна по-прежнему возвращать `string` и `none` в соответствующих случаях. `stream` возвращается только для ключей-потоков.
