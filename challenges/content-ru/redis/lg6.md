На этом этапе вы добавите получение ранга элемента упорядоченного множества командой `ZRANK`.

### Команда `ZRANK`

`ZRANK` запрашивает ранг элемента упорядоченного множества. Она возвращает целое число — индекс элемента с отсчётом от 0 при сортировке по возрастанию оценок. Если оценки двух элементов равны, они сортируются лексикографически.

Пример:

```bash
> ZADD zset_key 1.0 member_with_score_1
(integer) 1
> ZADD zset_key 2.0 member_with_score_2
(integer) 1
> ZADD zset_key 2.0 another_member_with_score_2
(integer) 1


> ZRANK zset_key member_with_score_1
(integer) 0
> ZRANK zset_key member_with_score_2
(integer) 2
> ZRANK zset_key another_member_with_score_2
(integer) 1
```

Ранг `another_member_with_score_2` равен 1, а `member_with_score_2` — 2. Хотя оценки равны, `another_member_with_score_2` предшествует `member_with_score_2` в лексикографическом порядке.

Если элемента или множества нет, возвращается нулевая объёмная строка (`$-1\r\n`).

```bash
# Missing sorted set and member
> ZRANK zset_key missing_member
(nil)
> ZRANK missing_key member
(nil)
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит `ZADD`, чтобы создать множество и добавить элементы.

```bash
$ redis-cli
> ZADD zset_key 100.0 foo (Expecting ":1\r\n")
> ZADD zset_key 100.0 bar (Expecting ":1\r\n")
> ZADD zset_key 20.0 baz (Expecting ":1\r\n")
> ZADD zset_key 30.1 caz (Expecting ":1\r\n")
> ZADD zset_key 40.2 paz (Expecting ":1\r\n")

# Expected Ranks
# baz -> 0
# caz -> 1
# paz -> 2
# bar -> 3
# foo -> 4
```

После этого отправит несколько `ZRANK` с именами элементов множества.

```bash
> ZRANK zset_key caz (Expecting ":1\r\n")
> ZRANK zset_key baz (Expecting ":0\r\n")
> ZRANK zset_key foo (Expecting ":4\r\n")
> ZRANK zset_key bar (Expecting ":3\r\n")
```

Тест также отправит `ZRANK` для отсутствующего элемента или ключа.

```bash
> ZRANK zset_key missing_member (Expecting RESP bulk string "$-1\r\n")
> ZRANK missing_key member (Expecting RESP bulk string "$-1\r\n")
```
