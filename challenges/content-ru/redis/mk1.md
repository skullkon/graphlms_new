На этом этапе вы добавите обработку `INCR`, когда ключ существует, но его значение не является числом.

### Напоминание

Реализация [`INCR`](https://redis.io/docs/latest/commands/incr/) разделена на три этапа:

- Ключ существует и содержит числовое значение (предыдущие этапы).
- Ключ отсутствует (предыдущие этапы).
- Ключ существует, но значение не является числом (**этот этап**).

Если существующий ключ содержит нечисловое значение, `INCR` возвращает ошибку. Пример:

```bash
$ redis-cli SET foo xyz
"OK"
$ redis-cli INCR foo
(error) ERR value is not an integer or out of range
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем подключится к серверу как клиент Redis и выполнит команды:

```bash
$ redis-cli
> SET foo xyz (expecting "+OK\r\n" as the response)
> INCR foo (expecting "-ERR value is not an integer or out of range\r\n" as the response)
```
