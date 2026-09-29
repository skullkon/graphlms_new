На этом этапе вы добавите команду `SUBSCRIBE`.

### Команда `SUBSCRIBE`

[Команда `SUBSCRIBE`](https://redis.io/docs/latest/commands/subscribe/) регистрирует клиента как подписчика канала.

Пример использования:

```bash
$ redis-cli
> SUBSCRIBE mychan
1) "subscribe"
2) "mychan"
3) (integer) 1
Reading messages... (press Ctrl-C to quit or any key to type command)
```

Ответ — массив RESP из трёх элементов:

1. "subscribe" как объёмная строка RESP.
1. Имя канала как объёмная строка RESP.
1. Число каналов, на которые клиент подписан к этому моменту, как целое число RESP.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит `SUBSCRIBE` с именем канала.

```
$ redis-cli SUBSCRIBE foo
```

Ожидается ответ `["subscribe", "foo", 1]`, закодированный в RESP так:

```
*3\r\n
$9\r\n
subscribe\r\n
$3\r\n
foo\r\n
:1\r\n
```

### Примечания

- Пока достаточно обработать одну `SUBSCRIBE` от одного клиента. Несколько вызовов `SUBSCRIBE` появятся позже.
