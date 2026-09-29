На этом этапе вы добавите обработку `EXEC`, если `MULTI` не вызывалась.

### Команда EXEC

Команда [EXEC](https://redis.io/docs/latest/commands/exec/) выполняет все команды, поставленные в очередь транзакции.

Она возвращает массив ответов этих команд.

Пример использования:

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

### EXEC без MULTI

Если выполнить `EXEC` без предварительного `MULTI`, возвращается ошибка.

Пример:

```bash
$ redis-cli EXEC
(error) ERR EXEC without MULTI
```

Возвращаемое значение — [простая ошибка](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-errors) с точными байтами `-ERR EXEC without MULTI\r\n`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем подключится к серверу как клиент Redis и выполнит команды:

```bash
$ redis-cli EXEC
```

Ожидаемый ответ: "-ERR EXEC without MULTI\r\n".

### Примечания

- Пока нужно реализовать `EXEC` только для случая, когда `MULTI` не вызывалась.
- Обработка `EXEC` после `MULTI` будет проверяться позже.
