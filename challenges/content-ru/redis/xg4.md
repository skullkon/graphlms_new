На этом этапе вы добавите ответ на команду `GEOPOS`.

### Команда `GEOPOS`

Команда `GEOPOS` возвращает долготу и широту указанного местоположения.

Пример:

```bash
> GEOADD places -0.0884948 51.506479 "London"
> GEOADD places 11.5030378 48.164271 "Munich"

> GEOPOS places London
1) 1) "-0.08849412202835083"
   2) "51.50647814139934"

> GEOPOS places Munich
1) 1) "11.503036916255951"
   2) "48.16427086232978"
```

Возвращается массив с одной записью для каждого запрошенного местоположения.

- Если местоположение существует по указанному ключу, запись — массив из двух элементов:
  - Долгота в формате [bulk string RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).
  - Широта в формате [bulk string RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).
- Если местоположение или ключ отсутствует, соответствующая запись — [null-массив](https://redis.io/docs/latest/develop/reference/protocol-spec/#null-arrays) `(*-1\r\n)`.

Чтобы получить широту и долготу, Redis декодирует числовую оценку обратно в координаты. Этот процесс появится позже; пока можно жёстко возвращать 0 или любое другое число для обеих координат.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем добавит несколько местоположений командой `GEOADD`.

```bash
$ redis-cli
> GEOADD location_key -0.0884948 51.506479 "London"
# Expect: (integer) 1
> GEOADD location_key 11.5030378 48.164271 "Munich"
# Expect: (integer) 1
```

Далее отправит несколько команд `GEOPOS`:

```bash
> GEOPOS location_key London Munich
# Expecting: [["0", "0"], ["0", "0"]], encoded as "*2\r\n*2\r\n$1\r\n0\r\n$1\r\n0\r\n*2\r\n$1\r\n0\r\n$1\r\n0\r\n"

> GEOPOS location_key missing_location
# Expecting: [nil], encoded as "*1\r\n*-1\r\n"
```

Она проверит, что:

- Ответ — массив RESP с числом элементов, равным числу запрошенных местоположений.
- Для каждого запрошенного местоположения:
  - Если оно существует:
    - Соответствующий элемент — массив RESP из двух элементов: долготы и широты.
    - Оба элемента — "0" или любое другое допустимое число с плавающей точкой, закодированное как bulk string RESP.
  - Если оно отсутствует:
    - Соответствующий элемент — [null-массив](https://redis.io/docs/latest/develop/reference/protocol-spec/#null-arrays) `(*-1\r\n)`.

Тестирующая система также отправит `GEOPOS` для несуществующего ключа:

```bash
> GEOPOS missing_key London Munich
# Expecting [nil, nil], encoded as "*2\r\n*-1\r\n*-1\r\n"
```

Она проверит, что:

- Ответ — массив RESP с числом элементов, равным числу запрошенных местоположений.
- Каждый элемент — [null-массив](https://redis.io/docs/latest/develop/reference/protocol-spec/#null-arrays) `(*-1\r\n)`.

### Примечания

- Здесь возвращаемые координаты можно жёстко задать равными 0 или другому допустимому числу с плавающей точкой. Настоящие значения широты и долготы будут проверяться позже.
