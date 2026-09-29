На этом этапе вы добавите поддержку запросов `XRANGE` с `+`.

### Использование `XRANGE` с `+`

В `XRANGE` аргумент `end` можно задать как `+`, чтобы получить записи от указанного `start` до конца потока.

Пример:

```bash
$ redis-cli XADD some_key 1526985054069-0 temperature 36 humidity 95
"1526985054069-0"

$ redis-cli XADD some_key 1526985054079-0 temperature 37 humidity 94
"1526985054079-0"

$ redis-cli XRANGE some_key 1526985054069 +
1) 1) 1526985054069-0
   2) 1) temperature
      2) 36
      3) humidity
      4) 95
2) 1) 1526985054079-0
   2) 1) temperature
      2) 37
      3) humidity
      4) 94
```

Здесь `XRANGE` получает все записи из `some_key`, начиная с идентификатора `1526985054069-0` и до самого конца потока.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст несколько записей.

```bash
$ redis-cli XADD stream_key 0-1 foo bar
$ redis-cli XADD stream_key 0-2 bar baz
$ redis-cli XADD stream_key 0-3 baz foo
```

После этого отправит `XRANGE` с `+` в качестве `end`:

```bash
$ redis-cli XRANGE stream_key 0-2 +
```

Сервер должен ответить массивом RESP с записями от указанного `start` до конца потока.

Для примера выше ответ будет таким, в формате [массива RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#arrays):

```json
[
  [
    "0-2",
    [
      "bar",
      "baz"
    ]
  ],
  [
    "0-3",
    [
      "baz",
      "foo"
    ]
  ]
]
```

Сырое представление RESP выглядит так:

```text
*2\r\n
*2\r\n
$3\r\n0-2\r\n
*2\r\n
$3\r\nbar\r\n
$3\r\nbaz\r\n
*2\r\n
$3\r\n0-3\r\n
*2\r\n
$3\r\nbaz\r\n
$3\r\nfoo\r\n
```

### Примечания

- Элементы ответа показаны на отдельных строках для удобства чтения. Тест ожидает их в одной строке.
