На этом этапе вы добавите отслеживание нескольких ключей.

### Отслеживание нескольких ключей

Ранее было достаточно обрабатывать `WATCH` для одного ключа. Однако команда `WATCH` принимает несколько ключей сразу:

```bash
$ redis-cli
> WATCH foo bar baz
OK
```

Изменения отслеживаются для всех ключей. Если другой клиент изменит хотя бы один до `EXEC`, транзакция отменяется:

```
Client A: WATCH foo bar          # Monitor both keys
Client B: SET bar 300            # Modifies one of the watched keys
Client A: MULTI
Client A: SET foo 400            # Queued
Client A: EXEC                   # Transaction aborted, bar was modified
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Тест создаст двух клиентов. Первый задаст два ключа, начнёт отслеживать оба и откроет транзакцию:

```bash
# Client 1
> SET foo 100        # → OK
> SET bar 200        # → OK
> WATCH foo bar      # → OK
> MULTI              # → OK
> SET bar 300        # → QUEUED
```

Второй изменит один из отслеживаемых ключей:

```bash
# Client 2
> SET foo 200        # → OK
```

Первый выполнит транзакцию, и тест проверит её отмену:

```bash
# Client 1
> EXEC               # → *-1\r\n (transaction aborted)

# Client 2
> GET bar            # → "200" (unchanged, transaction had no effect)
```

Будет проверено, что:

- `WATCH` с несколькими ключами возвращает `+OK\r\n`.
- `EXEC` возвращает нулевой массив RESP (`*-1\r\n`), если изменился любой отслеживаемый ключ.
- Команды отменённой транзакции не оказали эффекта.
