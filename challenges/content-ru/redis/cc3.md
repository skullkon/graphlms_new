На этом этапе вы добавите поддержку команды `TYPE`.

### Команда `TYPE`

Команда [TYPE](https://redis.io/commands/type/) возвращает тип значения по указанному ключу. Возможные типы: `string`, `list`, `set`, `zset`, `hash`, `stream` и `vectorset`.

Например:

```bash
# Set a key to a string value
$ redis-cli SET some_key "foo"
"OK"

# Check the type of value at the key
$ redis-cli TYPE some_key
"string"
```

Возвращаемое значение кодируется как [простая строка](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings).

Если ключа нет, возвращается `none`.

```bash
$ redis-cli TYPE missing_key
"none"
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит серверу `SET`, чтобы создать ключ со строковым значением.

```bash
$ redis-cli SET some_key "foo"
```

После этого отправит `TYPE` для этого ключа.

```bash
$ redis-cli TYPE some_key
```

Сервер должен ответить `+string\r\n`: значением `string` в формате [простой строки](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings).

Затем тест отправит `TYPE` для отсутствующего ключа.

```bash
$ redis-cli TYPE missing_key
```

Сервер должен ответить `+none\r\n`: значением `none` в формате [простой строки](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings).

### Примечания

- Пока достаточно обрабатывать типы `string` и `none`. Поддержка `stream` появится позже.
