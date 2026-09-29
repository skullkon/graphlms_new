На этом этапе вы добавите получение длины списка командой `LLEN`.

### Команда `LLEN`

Команда [`LLEN`](https://redis.io/docs/latest/commands/llen/) получает длину списка. Результат кодируется как [целое число RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

Например:

```bash
# Create a new list with 4 items
> RPUSH list_key "a" "b" "c" "d"
(integer) 4

# Get the length of the new list
> LLEN list_key
(integer) 4
```

Если списка нет, сервер возвращает `0` как целое число RESP.

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Затем создаст через `RPUSH` список со случайным количеством элементов.

```bash
$ redis-cli
> RPUSH list_key <random number of elements>
```

После этого отправит `LLEN` для созданного списка.

```bash
> LLEN list_key
# Expect: list_length (RESP Encoded Integer)
```

Ожидается длина списка в формате целого числа RESP.

Тест также проверит ответ для отсутствующего списка:

```bash
> LLEN missing_list_key
# Expect:  (integer) 0
```

В этом случае программа должна ответить `0`, закодированным как `:0\r\n`.
