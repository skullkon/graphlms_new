На этом этапе вы проверите очистку отслеживаемых ключей после `EXEC`.

### Очистка отслеживаемых ключей при `EXEC`

`WATCH` защищает одну транзакцию. После `EXEC`, независимо от успеха или отмены, состояние наблюдения соединения нужно очистить. Иначе устаревшее состояние может перейти в будущие транзакции того же соединения и вызвать ошибки по не связанным с ними причинам.

```bash
$ redis-cli
# Client A
> WATCH foo
OK

# Client B
> SET foo 100
OK

# Client A
> MULTI
OK
> SET bar 200
QUEUED
> EXEC
*-1\r\n                # transaction aborted, foo was modified

# Client A starts a new transaction (no WATCH this time)
> MULTI
OK
> SET bar 200
QUEUED
> EXEC
1) OK                  # succeeds, previous EXEC cleared the watch state
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Тест создаст двух клиентов. Первый задаст два ключа, начнёт отслеживать один и откроет транзакцию:

```bash
# Client 1
> SET foo 100
OK
> SET bar 200
OK
> WATCH foo
OK
> MULTI
OK
> SET bar 300
QUEUED
```

Второй изменит отслеживаемый ключ:

```bash
# Client 2
> SET foo 200
OK
```

Первый выполнит транзакцию, ожидая отмены, затем сразу начнёт и выполнит вторую:

```bash
# Client 1
> EXEC
*-1\r\n                # first transaction aborted

# Client 1 starts a new transaction
> MULTI
OK
> SET bar 300
QUEUED
> EXEC
1) OK                  # second transaction succeeds

# Client 2
> GET bar
"300"                  # confirms the second transaction's write took effect
```

Будет проверено, что:

- Первый `EXEC` возвращает нулевой массив RESP (`*-1\r\n`), поскольку отслеживаемый ключ изменён.
- Второй `EXEC` успешен, поскольку первый `EXEC` очистил состояние наблюдения.
- Команды второй транзакции применены.

### Примечания

- Если вы уже очищаете состояние наблюдения после `EXEC`, как предлагалось ранее, этап должен пройти без изменений.
- Очистка отслеживаемых ключей при `DISCARD` появится позже.
