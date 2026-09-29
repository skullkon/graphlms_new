На этом этапе вы добавите выполнение пустой транзакции.

### Пустые транзакции

Если выполнить [EXEC](https://redis.io/docs/latest/commands/exec/) сразу после [MULTI](https://redis.io/docs/latest/commands/multi/), возвращается пустой массив.

Он означает, что в очереди не было команд и транзакция успешно выполнена.

Пример:

```bash
$ redis-cli
> MULTI
OK
> EXEC
(empty array)
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем подключится к серверу как клиент Redis и выполнит команды:

```bash
$ redis-cli
> MULTI (expecting "+OK\r\n")
> EXEC (expecting "*0\r\n" as the response)
> EXEC (expecting "-ERR EXEC without MULTI\r\n" as the response)
```
