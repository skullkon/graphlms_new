Добро пожаловать в расширение «Сохранение в RDB»! В нём вы добавите поддержку чтения [файлов RDB](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) (файлов базы данных Redis).

На этом этапе вы добавите два параметра конфигурации, связанных с сохранением в RDB, и команду [CONFIG GET](https://redis.io/docs/latest/commands/config-get/).

### Файлы RDB

Файл RDB — это снимок набора данных Redis на определённый момент времени. Когда сохранение в RDB включено, сервер Redis синхронизирует состояние в памяти с файлом RDB следующим образом:

1. При запуске сервер Redis загружает данные из файла RDB.
2. Во время работы сервер Redis периодически создаёт новые снимки данных для обновления файла RDB.

### `dir` и `dbfilename`

Параметры конфигурации `dir` и `dbfilename` определяют расположение файла RDB:
- `dir` — путь к каталогу, где хранится файл RDB (пример: `/tmp/redis-data`).
- `dbfilename` — имя файла RDB (пример: `rdbfile`).

### Команда `CONFIG GET`

Команда [`CONFIG GET`](https://redis.io/docs/latest/commands/config-get/) возвращает значения параметров конфигурации.

Она принимает один или несколько параметров конфигурации и возвращает [массив RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#arrays) с парами «ключ — значение»:

```bash
$ redis-cli CONFIG GET dir
1) "dir"
2) "/tmp/redis-data"
```

Хотя `CONFIG GET` позволяет получить несколько параметров сразу, тестирующая программа будет запрашивать только один параметр за команду `CONFIG GET`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
./your_program.sh --dir /tmp/redis-files --dbfilename dump.rdb
```

Затем отправит следующие команды:

```bash
$ redis-cli CONFIG GET dir
$ redis-cli CONFIG GET dbfilename
```

На каждую команду `CONFIG GET` сервер должен ответить массивом RESP из двух элементов:

1. **Имя** параметра в виде [объёмной строки RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).
2. **Значение** параметра в виде объёмной строки RESP.

Например, если значение `dir` равно `/tmp/redis-files`, ожидаемый ответ на `CONFIG GET dir`:

```bash
*2\r\n$3\r\ndir\r\n$16\r\n/tmp/redis-files\r\n
```

### Примечания

- На этом этапе не нужно читать файл RDB: достаточно сохранить `dir` и `dbfilename`. Чтение файла появится позже.
- Если репозиторий создан до 5 октября 2023 года, скрипт `./your_program.sh` может не передавать аргументы программе. Чтобы исправить это, измените `./your_program.sh`. Подробности — в [PR с обновлением аргументов CLI](https://github.com/codecrafters-io/build-your-own-redis/pull/89/files).
