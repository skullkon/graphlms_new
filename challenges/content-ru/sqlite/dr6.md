На этом этапе вы реализуете вывод размера страницы файла базы SQLite с помощью [команды с точкой](https://www.sqlite.org/cli.html#special_commands_to_sqlite3_dot_commands_) `.dbinfo`.

### `.dbinfo`

`.dbinfo` — [команда с точкой](https://www.sqlite.org/cli.html#special_commands_to_sqlite3_dot_commands_), выводящая метаданные базы SQLite.

Команда `.dbinfo` запускается так:

```
$ sqlite3 sample.db .dbinfo
```

Она выводит метаданные файла базы:

```yaml
database page size:  4096
write format:        1
read format:         1
...
number of tables:    5
schema size:         330
data version:        1
```

На этом этапе вашей команде `.dbinfo` достаточно выводить только размер страницы базы — «database page size».

### Файл базы данных

Файл базы SQLite начинается с заголовка базы. Размер страницы хранится в заголовке сразу после сигнатуры. Это 2-байтовое значение с порядком байтов big-endian (читается слева направо).

```
// Start of file
53 51 4c 69 74 65 20 66 6f 72 6d 61 74 20 33 00  // Magic string: "SQLite format 3" + null terminator.
10 00                                            /* Database page size, in bytes.
                                                    Here, the page size is 4096 bytes. */
...
```

### Тесты

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh sample.db .dbinfo
```

Программа должна вывести размер страницы файла базы данных, например:

```
database page size: 4096
```

### Примечания

- Подробнее о формате файла базы SQLite см. в руководстве [Database File Format](https://www.sqlite.org/fileformat.html#the_database_header).
- В заголовках базы многобайтовые поля хранятся в формате big-endian. Подробнее об этом — в [статье MDN о порядке байтов](https://developer.mozilla.org/en-US/docs/Glossary/Endianness).
