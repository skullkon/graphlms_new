На этом этапе вы добавите поддержку команды [ECHO](https://redis.io/commands/echo).

### Команда `ECHO`

Как и `PING`, команда `ECHO` используется для тестирования и отладки.

```bash
$ redis-cli PING # The command you implemented in the previous stages
PONG
$ redis-cli ECHO hey # The command you'll implement in this stage
hey
```

Она принимает один аргумент и возвращает его в виде [объёмной строки RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

Чтобы пройти этот этап, программа должна:
- Разобрать клиентский ввод и извлечь аргумент команды `ECHO`.
- Закодировать этот аргумент как объёмную строку для ответа.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем она отправит серверу команду `ECHO` с аргументом:

```bash
$ redis-cli ECHO hey
```

Полученные байты будут представлять собой [массив RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#arrays) примерно такого вида: `*2\r\n$4\r\nECHO\r\n$3\r\nhey\r\n`. Это представление `["ECHO", "hey"]` в RESP.

Ожидаемый ответ — `$3\r\nhey\r\n`: строка `hey`, закодированная как [объёмная строка](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

### Примечания

- Настоятельно рекомендуем реализовать полноценный парсер RESP уже сейчас. Он пригодится на следующих этапах.
- Имена команд Redis нечувствительны к регистру: `ECHO`, `echo` и `EcHo` — допустимые команды.
- Аргументом `ECHO` будет случайная строка, поэтому фиксированный ответ не позволит пройти этот этап.
