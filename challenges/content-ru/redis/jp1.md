На этом этапе вы добавите удаление нескольких элементов одной командой `LPOP`.

### `LPOP` с несколькими элементами

Команда `LPOP` принимает необязательный аргумент, задающий количество удаляемых элементов. Удалённые элементы возвращаются в [массиве RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#arrays).

Например:

```bash
> RPUSH list_key "a" "b" "c" "d"
(integer) 4
> LPOP list_key 2
1) "a"
2) "b"
> LRANGE list_key 0 -1
1) "c"
2) "d"
```

Здесь `LPOP` удаляет первые два элемента, `a` и `b`, оставляя в списке `c` и `d`.

Если запрошенное количество больше длины списка, команда должна удалить все элементы и вернуть их массивом RESP.

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Сначала создаст список с несколькими элементами.

```bash
$ redis-cli
> RPUSH list_key "one" "two" "three" "four" "five"
# Expect: 5 (RESP Encoded Integer)
```

Затем отправит `LPOP` с количеством элементов для удаления.

```bash
> LPOP list_key 2
# Expect RESP Encoded Array: ["one", "two"]
```

Тест проверит, что ответ — массив RESP из удалённых элементов.

Также он проверит оставшиеся элементы через `LRANGE`.

```bash
> LRANGE list_key 0 -1
# Expect RESP Encoded Array: ["three", "four", "five"]
```
