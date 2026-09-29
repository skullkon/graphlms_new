На этом этапе вы добавите `LPUSH`, которая вставляет элементы в начало списка.

### Команда `LPUSH`

`LPUSH` похожа на `RPUSH`, но вставляет элементы в начало списка, а не в конец. Если списка нет, он создаётся перед добавлением элементов.

Например:

```bash
> LPUSH list_key "a" "b" "c"
(integer) 3
```

Хотя элементы перечислены как "a", "b", "c", в списке они располагаются в обратном порядке: `["c", "b", "a"]`.

```bash
> LRANGE list_key 0 -1
1) "c"
2) "b"
3) "a"
```

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Затем отправит серию `LPUSH`. На каждую команду ожидается длина списка в формате [целого числа RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

```bash
$ redis-cli
> LPUSH list_key "c"
# Expect: (integer) 1

> LPUSH list_key "b" "a"
# Expect: (integer) 3
```

Тест также проверит порядок вставки элементов командой `LRANGE`.

```bash
> LRANGE list_key 0 -1
# Expect RESP Encoded Array: ["a", "b", "c"]
```
