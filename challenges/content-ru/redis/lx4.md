На этом этапе вы добавите поддержку нескольких элементов в одной команде `RPUSH`.

### `RPUSH` с несколькими элементами

Команда `RPUSH` позволяет добавить несколько элементов списка за раз.

```bash
# Creating a new list with multiple elements
> RPUSH another_list "bar" "baz"
(integer) 2

# Appending multiple elements to an existing list
> RPUSH another_list "foo" "bar" "baz"
(integer) 5
```

Ответ на каждую команду — новая длина списка в формате [целого числа RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Затем отправит несколько команд `RPUSH`, каждая из которых добавляет более одного элемента.

```bash
$ redis-cli RPUSH list_key "element1" "element2" "element3"
# Expect: (integer) 3 → encoded as :3\r\n

$ redis-cli RPUSH list_key "element4" "element5"
# Expect: (integer) 5 → encoded as :5\r\n
```

В каждом случае ожидается длина списка в формате целого числа RESP.

### Примечания

- `RPUSH` принимает несколько элементов и при создании нового списка, а не только при добавлении в существующий.
