На этом этапе вы реализуете [команду с точкой](https://www.sqlite.org/cli.html#special_commands_to_sqlite3_dot_commands_) `.tables`, которая выводит имена пользовательских таблиц базы SQLite.

### Столбец `sqlite_schema.tbl_name`

Имена таблиц базы SQLite хранятся в столбце `tbl_name` таблицы [`sqlite_schema`](https://www.sqlite.org/schematab.html). [Страница](https://www.sqlite.org/fileformat.html#b_tree_pages) `sqlite_schema` хранит строки таблицы `sqlite_schema` в блоках данных, называемых «ячейками». Каждая ячейка содержит одну строку. Нужно прочитать все ячейки и извлечь из каждой значение `sqlite_schema.tbl_name`.

### Массив указателей на ячейки

Чтобы определить расположение ячеек, прочитайте массив указателей на ячейки страницы `sqlite_schema`. В этом массиве указаны смещения всех ячеек страницы. Вот что нужно знать:

- Массив расположен сразу после заголовка страницы.
- Его элементы (смещения) — 2-байтовые значения в формате big-endian.
- Смещения отсчитываются от начала страницы.
- Размер массива равен количеству ячеек на странице (оно указано в заголовке страницы).

### Ячейка

Получив все смещения, можно прочитать ячейки. Тип ячеек страницы `sqlite_schema` называется «листовая ячейка табличного B-дерева». Такая ячейка состоит из трёх частей:

1. Размер записи в байтах (varint).
2. Идентификатор строки rowid (varint).
3. Запись (в формате записей).

Ячейки используют целые числа переменной длины, также называемые varint. Их устройство описано в [официальной документации](https://www.sqlite.org/fileformat.html#b_tree_pages).

Идентификатор rowid можно игнорировать — на этом этапе он не нужен.

Нас интересует запись. «Запись» — другое название строки. Именно эта часть содержит столбец `sqlite_schema.tbl_name`.

#### Формат записей

Записи хранятся в [формате записей](https://www.sqlite.org/fileformat.html#record_format):

1. Заголовок:
    1. Размер заголовка, включая само это значение (varint).
    2. Код типа сериализации для каждого столбца записи по порядку (varint).
2. Тело:
    1. Значение каждого столбца записи по порядку (формат зависит от кода типа сериализации).

«Код типа сериализации» задаёт тип данных и размер столбца. Таблица всех кодов приведена в [официальной документации](https://www.sqlite.org/fileformat.html#record_format).

#### Пример

Ниже показана ячейка со страницы 1 файла `sample.db`:
```
00000ec0           78 03 07 17 1b  1b 01 81 47 74 61 62 6c  |   x.......Gtabl|
00000ed0  65 6f 72 61 6e 67 65 73  6f 72 61 6e 67 65 73 04  |eorangesoranges.|
00000ee0  43 52 45 41 54 45 20 54  41 42 4c 45 20 6f 72 61  |CREATE TABLE ora|
00000ef0  6e 67 65 73 0a 28 0a 09  69 64 20 69 6e 74 65 67  |nges.(..id integ|
00000f00  65 72 20 70 72 69 6d 61  72 79 20 6b 65 79 20 61  |er primary key a|
00000f10  75 74 6f 69 6e 63 72 65  6d 65 6e 74 2c 0a 09 6e  |utoincrement,..n|
00000f20  61 6d 65 20 74 65 78 74  2c 0a 09 64 65 73 63 72  |ame text,..descr|
00000f30  69 70 74 69 6f 6e 20 74  65 78 74 0a 29           |iption text.)   |
```

Разбор этой ячейки:
```
// Size of the record (varint): 120
78

// The rowid (safe to ignore)
03

// Record header
07     // Size of record header (varint): 7

17     // Serial type for sqlite_schema.type (varint):     23
       // Size of sqlite_schema.type =                     (23-13)/2 = 5

1b     // Serial type for sqlite_schema.name (varint):     27
       // Size of sqlite_schema.name =                     (27-13)/2 = 7

1b     // Serial type for sqlite_schema.tbl_name (varint): 27
       // Size of sqlite_schema.tbl_name =                 (27-13)/2 = 7

01     // Serial type for sqlite_schema.rootpage (varint): 1
       // 8-bit twos-complement integer

81 47  // Serial type for sqlite_schema.sql (varint):      199
       // Size of sqlite_schema.sql =                      (199-13)/2 = 93

// Record body
74 61 62 6c 65        // Value of sqlite_schema.type:     "table"
6f 72 61 6e 67 65 73  // Value of sqlite_schema.name:     "oranges"
6f 72 61 6e 67 65 73  // Value of sqlite_schema.tbl_name: "oranges"  <---
...
```

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```
$ ./your_sqlite3.sh sample.db .tables
```

Программа должна вывести имена таблиц файла базы данных:
```
apples oranges
```

### Примечания

- Настоящая команда `.tables` принимает необязательный аргумент-шаблон и добавляет пробелы между именами таблиц для форматирования. Эти возможности в вашей команде `.tables` реализовывать не нужно.
- Если полезная нагрузка ячейки слишком велика для одной страницы, её остаток хранится на [страницах переполнения полезной нагрузки](https://www.sqlite.org/fileformat.html#cell_payload_overflow_pages). В этом задании обрабатывать переполнение не требуется.
- В официальной документации часть ячейки с записью называется «payload» — полезной нагрузкой.
