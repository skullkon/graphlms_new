На этом этапе вы добавите постановку команд в очередь транзакции.

### Постановка команд в очередь

После [MULTI](https://redis.io/docs/latest/commands/multi/) следующие команды соединения помещаются в очередь до выполнения [EXEC](https://redis.io/docs/latest/commands/exec/).

Ответ на каждую такую команду — `+QUEUED\r\n`: строка `QUEUED` в формате [простой строки](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-strings).

Пример:

```bash
$ redis-cli
> MULTI
OK
> SET foo 41
QUEUED
> INCR foo
QUEUED

... (and so on, until EXEC is executed)
```

Команды в очереди не должны выполняться или как-либо менять базу данных.

В примере выше ключ `foo` не существует до выполнения `EXEC`.

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
```

Поскольку команды только поставлены в очередь, ключа `foo` ещё не должно быть. Тест проверит это, открыв другое соединение и отправив команду:

```bash
$ redis-cli GET foo (expecting `$-1\r\n` as the response)
```
