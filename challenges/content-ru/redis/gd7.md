На этом этапе вы добавите получение оценки элемента упорядоченного множества командой `ZSCORE`.

### Команда `ZSCORE`

`ZSCORE` запрашивает оценку элемента упорядоченного множества. Если и множество, и элемент существуют, оценка возвращается как объёмная строка RESP.

```bash
> ZADD zset_key 24.34 "one"
(integer) 1
> ZADD zset_key 90.34 "two"
(integer) 1
> ZSCORE zset_key "one"
"24.34"
```

Если указанный элемент или множество отсутствует, возвращается нулевая объёмная строка RESP (`$-1\r\n`).

```bash
> ZSCORE zset_key "three"
(nil)
> ZSCORE missing_key "member"
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
> ZADD zset_key 20.0 zset_member1 (Expecting ":1\r\n")
> ZADD zset_key 30.1 zset_member2 (Expecting ":1\r\n")
> ZADD zset_key 40.2 zset_member3 (Expecting ":1\r\n")
> ZADD zset_key 50.3 zset_member4 (Expecting ":1\r\n")
```

После этого отправит `ZSCORE` с одним из элементов. Например:

```bash
> ZSCORE zset_key zset_member2 (Expecting RESP bulk string "30.1")
```

Ожидается ответ "30.1" — оценка `zset_member2`. Ответ кодируется как объёмная строка RESP:

```
$4\r\n
30.1\r\n
```

Затем тест обновит значение элемента.

```bash
> ZADD zset_key 100.99 zset_member2 (Expecting ":0\r\n")
```

После этого отправит `ZSCORE` для обновлённого элемента.

```bash
> ZSCORE zset_key zset_member2 (Expecting RESP bulk string "100.99")
```

Также тест отправит `ZSCORE` для отсутствующего элемента или ключа.

```bash
> ZSCORE zset_key zset_member100 (Expecting RESP bulk string "$-1\r\n")
> ZSCORE missing_key member (Expecting RESP bulk string "$-1\r\n")
```
