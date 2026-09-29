На этом этапе вы добавите создание нового списка командой `RPUSH`.

### Команда `RPUSH`

Команда [`RPUSH`](https://redis.io/docs/latest/commands/rpush/) добавляет элементы в конец списка. Если списка нет, сначала создаёт его.

Пример использования:

```bash
# Creating a new list with a single element
> RPUSH list_key "foo"
(integer) 1

# Appending a single element to an existing list
> RPUSH list_key "bar"
(integer) 2
```

Возвращается количество элементов списка после добавления, закодированное как [целое число RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Затем отправит ей команду:

```bash
$ redis-cli RPUSH list_key "element"
```

Тест проверит ответ `:1\r\n` — число 1, количество элементов списка, в формате [целого числа RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

### Примечания

- Пока нужно только создавать новый список с одним элементом. Обработка `RPUSH` для существующих списков и нескольких элементов появится позже.
