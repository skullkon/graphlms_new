На этом этапе вы добавите вставку элементов в существующее упорядоченное множество.

### Добавление элементов через `ZADD`

`ZADD` может добавить новый элемент в существующее упорядоченное множество либо обновить оценку существующего. Она возвращает целое число — количество добавленных новых элементов.

Пример:

```bash
> ZADD zset_key 0.0043 foo
(integer) 1
> ZADD zset_key 8.0 bar
(integer) 1

# No new members were added
> ZADD zset_key 10.0 bar
(integer) 0
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит `ZADD` для создания нового множества.

```bash
$ redis-cli ZADD zset_key 20.0 zset_member1 (Expecting ":1\r\n")
```

После этого несколько раз отправит `ZADD`, добавляя новые элементы.

```bash
$ redis-cli
> ZADD zset_key 30.1 zset_member2 (Expecting ":1\r\n")
> ZADD zset_key 40.2 zset_member3 (Expecting ":1\r\n")
> ZADD zset_key 50.3 zset_member4 (Expecting ":1\r\n")
```

При добавлении нового элемента ожидается ответ `:1\r\n`.

Затем тест обновит оценку существующего элемента.

```bash
> ZADD zset_key 100.0 zset_member1 (Expecting ":0\r\n")
```

При обновлении существующего элемента ожидается ответ `:0\r\n`.
