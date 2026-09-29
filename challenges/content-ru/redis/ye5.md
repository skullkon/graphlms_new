На этом этапе вы добавите ответы ведущего сервера на команду [INFO](https://redis.io/commands/info/).

### Команда `INFO`

Команда `INFO` возвращает информацию и статистику работающего сервера Redis. Например, клиент может запросить сведения о сервере так:

```bash
$ redis-cli INFO
# Server
redis_version:7.2.4
...
# Clients
connected_clients:1
...
# Memory
used_memory:859944
...
# Replication
role:master
...
```

Сервер отвечает [объёмной строкой](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings), каждая строка которой содержит пару «ключ — значение», разделённую двоеточием (`:`). В ней также могут быть заголовки разделов, начинающиеся с `#`, и пустые строки.

`INFO` принимает необязательный параметр, определяющий раздел сведений, например `server`, `memory` или `replication`. На этом этапе мы сосредоточимся на разделе `replication`.

### Раздел `replication`

При вызове `INFO` с аргументом `replication` сервер возвращает только сведения о настройках репликации:

```
$ redis-cli INFO replication
# Replication
role:master
connected_slaves:0
master_replid:8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb
master_repl_offset:0
second_repl_offset:-1
repl_backlog_active:0
repl_backlog_size:1048576
repl_backlog_first_byte_offset:0
repl_backlog_histlen:
```

Некоторые важные поля:

- `role`: роль сервера (`master` или `slave`).
- `connected_slaves`: количество подключённых реплик.
- `master_replid`: идентификатор репликации ведущего сервера.
- `master_repl_offset`: смещение репликации ведущего сервера.

Пока достаточно поддержать ключ `role`. Остальные ключи появятся на следующих этапах.

### Тесты

Тестирующая программа запустит вашу программу так:

```
./your_program.sh --port <PORT>
```

Затем отправит команду `INFO` с аргументом `replication`.

```bash
$ redis-cli -p <PORT> info replication
```

Сервер должен ответить [объёмной строкой](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings), каждая строка которой — пара «ключ — значение», разделённая двоеточием (`:`). Тест найдёт только ключ `role` и проверит, что его значение — `master`.

### Примечания

- На этом этапе в ответе `INFO` достаточно поддержать ключ `role`. Остальные появятся позже.
- Заголовок `# Replication` в ответе необязателен, его можно опустить.
- Ответ `INFO` должен кодироваться как объёмная строка.
  - Пример корректного ответа: `$11\r\nrole:master\r\n` (строка `role:master` в формате объёмной строки).
