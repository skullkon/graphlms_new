На этом этапе вы добавите команду DISCARD.

### Команда DISCARD

[DISCARD](https://redis.io/docs/latest/commands/discard/) отменяет транзакцию. Она удаляет все команды из очереди транзакции и возвращает `+OK\r\n`.

Пример:

```bash
$ redis-cli
> MULTI
OK
> SET foo 41
QUEUED
> DISCARD
OK
> DISCARD
(error) ERR DISCARD without MULTI
```

Обратите внимание: первый `DISCARD` возвращает `OK`, а второй `DISCARD` — ошибку, поскольку транзакция уже отменена.

### DISCARD

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем подключится как клиент Redis и отправит несколько команд через одно соединение:

```bash
$ redis-cli
> MULTI
> SET foo 41 (expecting "+QUEUED\r\n")
> INCR foo (expecting "+QUEUED\r\n")
> DISCARD (expecting "+OK\r\n")
> GET foo (expecting "$-1\r\n" as the response)
> DISCARD (expecting "-ERR DISCARD without MULTI\r\n" as the response)
```
