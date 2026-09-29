На этом этапе вы добавите подсчёт элементов упорядоченного множества командой `ZCARD`.

### Команда `ZCARD`

`ZCARD` запрашивает мощность упорядоченного множества, то есть число элементов. Ответ — целое число. Если множества нет, возвращается 0.

```bash
> ZADD zset_key 1.2 "one"
(integer) 1
> ZADD zset_key 2.2 "two"
(integer) 1
> ZCARD zset_key
(integer) 2

> ZCARD missing_key
(integer) 0
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит `ZADD`, чтобы создать множество и добавить элементы.

```bash
$ redis-cli
> ZADD zset_key 20.0 zset_member1 (Expecting ":1\r\n")
> ZADD zset_key 30.1 zset_member2 (Expecting ":1\r\n")
> ZADD zset_key 40.2 zset_member3 (Expecting ":1\r\n")
> ZADD zset_key 50.3 zset_member4 (Expecting ":1\r\n")
```

Тест проверит число элементов через `ZCARD`.

```bash
$ redis-cli ZCARD zset_key (Expecting ":4\r\n")
```

Затем обновит оценку существующего элемента.

```bash
$ redis-cli ZADD zset_key 100.0 zset_member1 (Expecting ":0\r\n")
```

Снова проверит мощность множества через `ZCARD`.

```bash
$ redis-cli ZCARD zset_key (Expecting ":4\r\n")
```

Также тест проверит мощность отсутствующего упорядоченного множества.

```bash
$ redis-cli ZCARD missing_key (Expecting ":0\r\n")
```
