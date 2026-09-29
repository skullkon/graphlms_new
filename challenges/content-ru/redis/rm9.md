На этом этапе вы добавите поиск местоположений в заданном радиусе командой `GEOSEARCH`.

### Команда GEOSEARCH

Команда `GEOSEARCH` позволяет искать местоположения в заданном радиусе.

Она поддерживает несколько режимов поиска. Мы реализуем только `FROMLONLAT`: режим `FROMLONLAT` задаёт центр поиска непосредственно долготой и широтой.

Пример:

```bash
> GEOSEARCH places FROMLONLAT 2 48 BYRADIUS 100 m
1) "Paris"
```

Эта команда ищет в ключе `places` местоположения в пределах 100 метров от точки с долготой 2 и широтой 48.

Ответ — массив RESP с именами местоположений, подходящих под критерии поиска. Каждое имя закодировано как [bulk string RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

В команду переданы два параметра:

- `FROMLONLAT <longitude> <latitude>` — задаёт центральную точку поиска.
- `BYRADIUS <radius> <unit>` — задаёт поиск внутри круга указанного радиуса в выбранных единицах: m, km, mi и т. д.

Redis поддерживает другие параметры, но в этой задаче используются только `FROMLONLAT` и `BYRADIUS`.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Она добавит несколько местоположений командой `GEOADD`.

```bash
$ redis-cli
> GEOADD places 11.5030378 48.164271 "Munich"
> GEOADD places 2.2944692 48.8584625 "Paris"
> GEOADD places -0.0884948 51.506479 "London"
```

Затем отправит несколько команд `GEOSEARCH`:

```bash
> GEOSEARCH places FROMLONLAT 2 48 BYRADIUS 100000 m
# Expecting ["Paris"]

> GEOSEARCH places FROMLONLAT 2 48 BYRADIUS 500000 m
# Expecting ["Paris, "London"] (Any order)

> GEOSEARCH places FROMLONLAT 11 50 BYRADIUS 300000 m
# Expecting ["Munich"]
```

Она проверит, что ответ — массив RESP, например:

```
*2\r\n
$5\r\n
Paris\r\n
$6\r\n
London\r\n
```

Местоположения можно возвращать в любом порядке.

### Примечания

- Тестирующая система всегда использует параметры `FROMLONLAT` и `BYRADIUS` при отправке `GEOSEARCH`.
