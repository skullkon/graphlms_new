На этом этапе вы добавите поддержку чтения одного ключа из файла RDB.

### Формат файла RDB

<details>
  <summary>Нажмите, чтобы развернуть или свернуть</summary>

#### Обзор формата файла RDB

Разделы файла RDB идут в следующем порядке:

1. Раздел заголовка.
2. Раздел метаданных.
3. Раздел баз данных.
4. Раздел конца файла.

Файлы RDB используют специальные способы кодирования разных типов данных. Для этого этапа важны «кодирование размера» и «кодирование строк». Они описаны ближе к концу страницы.

Приведённое ниже описание формата RDB основано на статье [Redis RDB File Format](https://rdb.fnordig.de/file_format.html) Яна-Эрика Редигера. Мы включили только части, относящиеся к этому этапу.

#### Раздел заголовка

Файлы RDB начинаются с раздела заголовка примерно такого вида:

```
52 45 44 49 53 30 30 31 31  // Magic string + version number (ASCII): "REDIS0011".
```

Заголовок содержит сигнатуру `REDIS`, за которой следует четырёхсимвольный номер версии RDB. В этом задании все тестовые файлы RDB используют версию 11, поэтому заголовок всегда равен `REDIS0011`.

#### Раздел метаданных

Далее идёт раздел метаданных. Он содержит ноль или более подразделов метаданных, каждый из которых задаёт один атрибут. Вот пример подраздела, задающего `redis-ver`:

```
FA                             // Indicates the start of a metadata subsection.
09 72 65 64 69 73 2D 76 65 72  // The name of the metadata attribute (string encoded): "redis-ver".
06 36 2E 30 2E 31 36           // The value of the metadata attribute (string encoded): "6.0.16".
```

Имя и значение метаданных всегда кодируются как строки.

#### Раздел баз данных

Далее идёт раздел баз данных. Он содержит ноль или более подразделов, каждый из которых описывает одну базу данных. Пример такого подраздела:

```
FE                       // Indicates the start of a database subsection.
00                       /* The index of the database (size encoded).
                            Here, the index is 0. */

FB                       // Indicates that hash table size information follows.
03                       /* The size of the hash table that stores the keys and values (size encoded).
                            Here, the total key-value hash table size is 3. */
02                       /* The size of the hash table that stores the expires of the keys (size encoded).
                            Here, the number of keys with an expiry is 2. */
```

```
00                       /* The 1-byte flag that specifies the value’s type and encoding.
                            Here, the flag is 0, which means "string." */
06 66 6F 6F 62 61 72     // The name of the key (string encoded). Here, it's "foobar".
06 62 61 7A 71 75 78     // The value (string encoded). Here, it's "bazqux".
```

```
FC                       /* Indicates that this key ("foo") has an expire,
                            and that the expire timestamp is expressed in milliseconds. */
15 72 E7 07 8F 01 00 00  /* The expire timestamp, expressed in Unix time,
                            stored as an 8-byte unsigned long, in little-endian (read right-to-left).
                            Here, the expire timestamp is 1713824559637. */
00                       // Value type is string.
03 66 6F 6F              // Key name is "foo".
03 62 61 72              // Value is "bar".
```

```
FD                       /* Indicates that this key ("baz") has an expire,
                            and that the expire timestamp is expressed in seconds. */
52 ED 2A 66              /* The expire timestamp, expressed in Unix time,
                            stored as an 4-byte unsigned integer, in little-endian (read right-to-left).
                            Here, the expire timestamp is 1714089298. */
00                       // Value type is string.
03 62 61 7A              // Key name is "baz".
03 71 75 78              // Value is "qux".
```

Более формально каждая пара «ключ — значение» хранится так:

1. Необязательная информация о сроке действия (один из вариантов):
    * Временная метка в секундах:
          1. `FD`
          2. Момент истечения срока в секундах (4-байтовое целое без знака).
    * Временная метка в миллисекундах:
          1. `FC`
          2. Момент истечения срока в миллисекундах (8-байтовое длинное целое без знака).
2. Тип значения (1-байтовый флаг).
3. Ключ (закодирован как строка).
4. Значение (кодирование зависит от типа значения).

#### Раздел конца файла

Этот раздел отмечает конец файла и выглядит примерно так:

```
FF                       /* Indicates that the file is ending,
                            and that the checksum follows. */
89 3b b7 4e f8 0f 77 19  // An 8-byte CRC64 checksum of the entire file.
```

#### Кодирование длины

Значения с кодированием длины задают длину или размер чего-либо. Например:
- Индексы баз данных и размеры хеш-таблиц используют кодирование длины.
- Кодирование строки начинается со значения с кодированием длины, задающего число символов строки.
- Кодирование списка начинается со значения с кодированием длины, задающего число элементов списка.

Первые два старших бита значения с кодированием длины определяют, как его разбирать. Ниже приведено руководство (биты показаны в шестнадцатеричном и двоичном виде):

```
/* If the first two bits are 0b00:
   The length is the remaining 6 bits of the byte.
   In this example, the length is 10: */
0A
00001010

/* If the first two bits are 0b01:
   The length is the next 14 bits
   (remaining 6 bits in the first byte, combined with the next byte),
   in big-endian (read left-to-right).
   In this example, the length is 700: */
42 BC
01000010 10111100

/* If the first two bits are 0b10:
   Ignore the remaining 6 bits of the first byte.
   The length is the next 4 bytes, in big-endian (read left-to-right).
   In this example, the length is 17000: */
80 00 00 42 68
10000000 00000000 00000000 01000010 01101000

/* If the first two bits are 0b11:
   The remaining 6 bits specify a type of string encoding.
   See string encoding section. */
```

#### Кодирование строк

Значение, закодированное как строка, состоит из двух частей:
1. Размер строки (с кодированием размера).
2. Сама строка.

Например:

```
/* The 0x0D size specifies that the string is 13 characters long.
   The remaining characters spell out "Hello, World!". */
0D 48 65 6C 6C 6F 2C 20 57 6F 72 6C 64 21
```

Для размеров, начинающихся с `0b11`, оставшиеся 6 бит обозначают тип формата строки:

```
/* The 0xC0 size indicates the string is an 8-bit integer.
   In this example, the string is "123". */
C0 7B

/* The 0xC1 size indicates the string is a 16-bit integer.
   The remaining bytes are in little-endian (read right-to-left).
   In this example, the string is "12345". */
C1 39 30

/* The 0xC2 size indicates the string is a 32-bit integer.
   The remaining bytes are in little-endian (read right-to-left),
   In this example, the string is "1234567". */
C2 87 D6 12 00

/* The 0xC3 size indicates that the string is compressed with the LZF algorithm.
   You will not encounter LZF-compressed strings in this challenge. */
C3 ...
```
</details>

### Команда `KEYS`

<details>
  <summary>Нажмите, чтобы развернуть или свернуть</summary>

Команда [`KEYS command`](https://redis.io/docs/latest/commands/keys/) возвращает все ключи, соответствующие заданному шаблону, в виде массива RESP:

```
$ redis-cli SET foo bar
OK
$ redis-cli SET baz qux
OK
$ redis-cli KEYS "f*"
1) "foo"
```

Если шаблон равен `*`, команда возвращает все ключи базы данных:

```
$ redis-cli KEYS "*"
1) "baz"
2) "foo"
```

На этом этапе нужно добавить команду `KEYS`, но достаточно поддержать только шаблон `*`.
</details>

### Тесты

Тестирующая программа создаст файл RDB с одним ключом и запустит вашу программу так:

```
$ ./your_program.sh --dir <dir> --dbfilename <filename>
```

Затем она отправит серверу команду `KEYS "*"`.

```
$ redis-cli KEYS "*"
```

Сервер должен ответить массивом RESP, содержащим ключ из файла RDB:

```
*1\r\n$3\r\nfoo\r\n
```

### Примечания

- Файл RDB, заданный через `--dir` и `--dbfilename`, может отсутствовать. В этом случае программа должна считать базу данных пустой.
- Файлы RDB используют для хранения чисел как порядок байтов little-endian, так и big-endian. Подробнее — в [статье MDN о порядке байтов](https://developer.mozilla.org/en-US/docs/Glossary/Endianness).
- Чтобы создать файл RDB, используйте [команду `SAVE`](https://redis.io/docs/latest/commands/save/).
