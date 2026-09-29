На этом этапе вы добавите в `RPUSH` возможность добавить один элемент в существующий список.

### Добавление в существующий список

Когда клиент отправляет [`RPUSH`](https://redis.io/docs/latest/commands/rpush/) для существующего списка, новый элемент добавляется в его конец.

```bash
$ redis-cli RPUSH list_key "element1"
(integer) 1
$ redis-cli RPUSH list_key "element2"
(integer) 2
```

Сервер возвращает новую длину списка как [целое число RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh
```

Затем отправит несколько команд `RPUSH` для одного списка:

```bash
$ redis-cli RPUSH list_key "element1"
# Expect: (integer) 1 → encoded as :1\r\n

$ redis-cli RPUSH list_key "element2"
# Expect: (integer) 2 → encoded as :2\r\n
```

В каждом случае ожидается длина списка в формате целого числа RESP.

### Примечания

- Проверяйте, существует ли список по указанному ключу, и добавляйте элементы в него.
