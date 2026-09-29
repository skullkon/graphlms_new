На этом этапе вы добавите удаление первого элемента списка командой `LPOP`.

### Команда `LPOP`

Команда [`LPOP`](https://redis.io/docs/latest/commands/lpop/) удаляет и возвращает первый элемент списка.

Пример:

```bash
> RPUSH list_key "a" "b" "c" "d"
(integer) 4

> LPOP list_key
"a"
```

Если список пуст или отсутствует, возвращается [нулевая объёмная строка](https://redis.io/docs/latest/develop/reference/protocol-spec/#null-bulk-strings) (`$-1\r\n`).

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Затем создаст список с несколькими элементами.

```bash
$ redis-cli
> RPUSH list_key "one" "two" "three" "four" "five"
```

После этого отправит серверу `LPOP` с именем только что созданного списка:

```bash
> LPOP list_key
# Expecting: (Bulk string) "one"
```

Ожидается удалённый элемент в формате [объёмной строки RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings) (`$3\r\none\r\n`).

Тест также проверит оставшиеся элементы командой `LRANGE`.

```bash
> LRANGE list_key 0 -1
# Expect a RESP Encoded Array: ["two", "three", "four", "five"]
```
