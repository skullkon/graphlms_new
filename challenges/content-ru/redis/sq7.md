На этом этапе вы добавите удаление элемента упорядоченного множества командой `ZREM`.

## Команда `ZREM`

Команда [`ZREM`](https://redis.io/docs/latest/commands/zrem/) удаляет элемент упорядоченного множества по его имени.

Пример:

```bash
> ZADD racer_scores 8.3 "Sam-Bodden"
(integer) 1
> ZADD racer_scores 10.5 "Royce"
(integer) 1

# Remove "Royce" from the sorted set
> ZREM racer_scores "Royce"
(integer) 1

# List the remaining members
> ZRANGE racer_scores 0 -1
1) "Sam-Bodden"

# Remove a non-existing member
> ZREM racer_scores "missing_member"
(integer) 0
```

Она возвращает число удалённых элементов. Если указанного элемента нет, возвращается 0.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст упорядоченное множество с несколькими элементами.

```bash
$ redis-cli
> ZADD zset_key 80.5 foo (Expecting ":1\r\n")
> ZADD zset_key 50.3 baz (Expecting ":1\r\n")
> ZADD zset_key 80.5 bar (Expecting ":1\r\n")
```

После этого отправит `ZREM`, указав элемент для удаления.

Например:

```bash
> ZREM zset_key "baz"
# Expected: (integer) 1
```

Затем отправит `ZRANGE` и проверит оставшиеся элементы.

```bash
> ZRANGE zset_key 0 -1
# Expected RESP Encoded Array: ["bar", "foo"]
```

Тест также отправит `ZREM` для отсутствующего элемента.

```bash
> ZREM zset_key "missing_member"
# Expected: (integer) 0
```
