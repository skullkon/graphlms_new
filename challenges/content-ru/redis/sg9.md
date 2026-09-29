На этом этапе вы добавите обработку ошибок внутри транзакции.

### Ошибки внутри транзакций

Если при выполнении транзакции команда завершается ошибкой, ошибка сохраняется и включается в ответ `EXEC`. Остальные команды транзакции всё равно выполняются.

Подробнее об этом поведении — в [официальной документации Redis](https://redis.io/docs/latest/develop/interact/transactions/#errors-inside-a-transaction).

Пример:

```bash
$ redis-cli
> MULTI
OK
> SET foo xyz
QUEUED
> INCR foo
QUEUED
> SET bar 7
> EXEC
1) OK
2) (error) ERR value is not an integer or out of range
3) OK
```

Ошибка команды `INCR` возвращается вторым элементом массива. Третья команда (`SET bar 7`) всё равно успешно выполняется.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем подключится как клиент Redis и отправит несколько команд через одно соединение:

```bash
$ redis-cli
> SET foo abc
OK
> SET bar 41
OK
> MULTI
OK
> INCR foo
QUEUED
> INCR bar
QUEUED
> EXEC
1) (error) ERR value is not an integer or out of range
2) (integer) 42
```

Ожидаемый ответ `EXEC` — [массив RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#arrays) с ответами команд из очереди. Точные байты:

```bash
*2\r\n-ERR value is not an integer or out of range\r\n:42\r\n
```

Тест также проверит, что последняя команда успешно выполнена и ключ `bar` существует:

```bash
$ redis-cli
> GET foo (expecting "$3\r\nabc\r\n" as the response)
> GET bar (expecting "$2\r\n42\r\n" as the response)
```

### Примечания

- Некоторые ошибки команд, например синтаксические, приводят к полной отмене транзакции. В этом задании они не рассматриваются.
