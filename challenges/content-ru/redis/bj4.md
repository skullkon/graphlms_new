На этом этапе вы добавите отрицательные индексы для `ZRANGE`.

### `ZRANGE` с отрицательными индексами

Команда `ZRANGE` также принимает отрицательные индексы.

Пример:

```bash
> ZADD racer_scores 8.5 "Sam-Bodden"
(integer) 1
> ZADD racer_scores 10.2 "Royce"
(integer) 1
> ZADD racer_scores 6.1 "Ford"
(integer) 1
> ZADD racer_scores 14.9 "Prickett"
(integer) 1
> ZADD racer_scores 10.2 "Ben"
(integer) 1


# List last 2 elements
> ZRANGE racer_scores -2 -1
1) "Royce"
2) "Prickett"

# List all items except last 2
> ZRANGE racer_scores 0 -3
1) "Ford"
2) "Sam-Bodden"
3) "Ben"
```

Индекс -1 обозначает последний элемент, -2 — предпоследний и так далее. Если модуль отрицательного индекса выходит за границы, то есть >= мощности множества, индекс трактуется как 0 — начало множества.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит `ZADD`, чтобы создать упорядоченное множество и добавить элементы.

```bash
$ redis-cli
> ZADD zset_key 20.0 foo (Expecting ":1\r\n")
> ZADD zset_key 30.1 bar (Expecting ":1\r\n")
> ZADD zset_key 40.2 baz (Expecting ":1\r\n")
> ZADD zset_key 25.0 paz (Expecting ":1\r\n")
> ZADD zset_key 25.0 caz (Expecting ":1\r\n")
```

После этого отправит серию `ZRANGE` с одним или несколькими отрицательными индексами.

Например:

```bash
> ZRANGE zset_key 2 -1
1) "paz"
2) "bar"
3) "baz"
```

В этом случае ожидается массив `["paz", "bar", "baz"]`, закодированный в RESP так:

```
*3\r\n
$3\r\n
paz\r\n
$3\r\n
bar\r\n
$3\r\n
baz\r\n
```
