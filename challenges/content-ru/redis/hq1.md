На этом этапе вы реализуете `DISCARD` и проверите, что она очищает отслеживаемые ключи.

### Команда `DISCARD`

Команда [`DISCARD`](https://redis.io/docs/latest/commands/discard/) отменяет транзакцию. Она удаляет все команды очереди и выходит из режима транзакции:

```bash
$ redis-cli
> MULTI
OK
> SET foo 100
QUEUED
> SET bar 200
QUEUED
> DISCARD
OK
```

Ответ всегда равен `+OK\r\n`.

### Очистка состояния наблюдения

Как и `EXEC`, команда `DISCARD` очищает отслеживаемые ключи соединения. Поэтому изменения, произошедшие до `DISCARD`, не влияют на следующую транзакцию того же соединения.

```bash
$ redis-cli
# Client A
> WATCH foo
OK

# Client B
> SET foo 999
OK

# Client A
> MULTI
OK
> SET bar 200
QUEUED
> DISCARD
OK                     # watch state cleared

# Client A starts a new transaction (no WATCH active)
> MULTI
OK
> SET bar 200
QUEUED
> EXEC
1) OK                  # succeeds, DISCARD cleared the watch state
```

Без очистки вторая транзакция ошибочно завершилась бы неудачей из-за изменения `foo` до `DISCARD`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Тест создаст двух клиентов. Первый задаст два ключа, начнёт их отслеживать и откроет транзакцию:

```bash
# Client 1
> SET foo 100
OK
> SET bar 200
OK
> WATCH foo bar
OK
> MULTI
OK
> SET bar 300
QUEUED
```

Второй изменит один из отслеживаемых ключей:

```bash
# Client 2
> SET foo 400
OK
```

Первый отменит транзакцию, затем сразу начнёт и выполнит новую:

```bash
# Client 1
> DISCARD
OK

# Client 1 starts a new transaction
> MULTI
OK
> SET bar 300
QUEUED
> EXEC
1) OK                  # succeeds, DISCARD cleared the watch state

# Client 2
> GET bar
"300"                  # confirms the second transaction's write took effect
```

Будет проверено, что:

- `DISCARD` возвращает `+OK\r\n`.
- `DISCARD` очищает состояние наблюдения соединения.
- Вторая транзакция успешна, поскольку `DISCARD` очистила отслеживаемые ключи.
- Команды второй транзакции применены.

### Примечания

- `DISCARD` должна очистить и очередь команд, и состояние наблюдения: отслеживаемые ключи и флаг dirty.
- Если очистка состояния наблюдения уже реализована в `EXEC`, для `DISCARD` используйте тот же подход.
