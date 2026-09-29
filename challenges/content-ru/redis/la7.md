На этом этапе вы добавите поддержку команд [SET](https://redis.io/commands/set) и [GET](https://redis.io/commands/get).

### Команда `SET`

Команда `SET` задаёт значение ключа. Например, клиент может присвоить ключу `foo` значение `bar` так:

```bash
$ redis-cli SET foo bar
OK
```

Сервер отвечает `OK` (в виде [простой строки RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings)), подтверждая успешное выполнение операции.

Команда `SET` поддерживает дополнительные параметры, например `EX` (срок действия в секундах), `PX` (срок действия в миллисекундах) и другие. На этом этапе они не рассматриваются; к ним мы перейдём позже.

### Команда `GET`

Команда `GET` получает значение ключа. Например, чтобы получить значение ключа `foo`:

```bash
$ redis-cli GET foo
bar
```

Сервер отвечает значением `bar`, закодированным как [объёмная строка RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings). Если ключа нет, сервер возвращает специальную [нулевую объёмную строку](https://redis.io/docs/latest/develop/reference/protocol-spec/#null-bulk-strings) (`$-1\r\n`).

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
./your_program.sh
```

Затем она отправит серверу команду `SET`:

```bash
$ redis-cli SET foo bar
```

Ожидается ответ `+OK\r\n`: строка `OK`, закодированная как [простая строка](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings).

Следом будет отправлена команда `GET`:

```bash
$ redis-cli GET foo
```

Ожидается ответ `$3\r\nbar\r\n`: строка `bar`, закодированная как [объёмная строка](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

### Примечания

- Если на предыдущих этапах вы реализовали полноценный парсер RESP, его можно использовать повторно.
- Как и раньше, ключи и значения будут случайными, поэтому фиксированный ответ не позволит пройти этап.
- Если ключа нет, команда `GET` должна вернуть [нулевую объёмную строку](https://redis.io/docs/latest/develop/reference/protocol-spec/#null-bulk-strings) (`$-1\r\n`). На этом этапе это не проверяется отдельно, но потребуется позже.
