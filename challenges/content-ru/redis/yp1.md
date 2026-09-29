На этом этапе вы добавите поддержку запросов `XRANGE` с `-`.

### Использование `XRANGE` с `-`

В `XRANGE` аргумент `start` можно задать как `-`, чтобы читать записи с самого начала потока. Это позволяет получить диапазон с первой записи, не зная её идентификатора.

Пример:

```bash
$ redis-cli XADD some_key 1526985054069-0 temperature 36 humidity 95
"1526985054069-0"

$ redis-cli XADD some_key 1526985054079-0 temperature 37 humidity 94
"1526985054079-0"

$ redis-cli XRANGE some_key - 1526985054079
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

Здесь `XRANGE` получает все записи с начала потока до записи с идентификатором `1526985054079-0`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст несколько записей.

```bash
$ redis-cli XADD stream_key 0-1 foo bar
"0-1"
$ redis-cli XADD stream_key 0-2 bar baz
"0-2"
$ redis-cli XADD stream_key 0-3 baz foo
"0-3"
```

После этого отправит `XRANGE` с `-` в качестве `start`:

```bash
$ redis-cli XRANGE stream_key - 0-2
1) 1) 0-1
   2) 1) foo
      2) bar
2) 1) 0-2
   2) 1) bar
      2) baz
```

Сервер должен ответить массивом RESP с записями от начала потока до записи с указанным `end`.

Для примера выше ответ будет таким, в формате [массива RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#arrays):

```json
[
  [
    "0-1",
    [
      "foo",
      "bar"
    ]
  ],
  [
    "0-2",
    [
      "bar",
      "baz"
    ]
  ]
]
```
