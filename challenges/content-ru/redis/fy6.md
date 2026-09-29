На этом этапе вы добавите выполнение транзакции с несколькими командами.

### Выполнение транзакции

При отправке [EXEC](https://redis.io/docs/latest/commands/exec/) внутри транзакции выполняются все команды её очереди.

Ответ на [EXEC](https://redis.io/docs/latest/commands/exec/) — массив ответов команд из очереди.

Пример:

```bash
$ redis-cli
> MULTI
OK
> SET foo 41
QUEUED
> INCR foo
QUEUED
> EXEC
1) OK
2) (integer) 42
```

В этом примере `OK` — ответ на `SET`, а `42` — ответ на `INCR`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем подключится как клиент Redis и отправит несколько команд через одно соединение:

```bash
$ redis-cli MULTI
> SET foo 6 (expecting "+QUEUED\r\n")
> INCR foo (expecting "+QUEUED\r\n")
> INCR bar (expecting "+QUEUED\r\n")
> GET bar (expecting "+QUEUED\r\n")
> EXEC (expecting an array of responses for the queued commands)
```

После выполнения транзакции ключ `foo` должен существовать и иметь значение `7`.

Тест проверит это командой GET:

```bash
$ redis-cli GET foo (expecting "7" encoded as a bulk string)
```
