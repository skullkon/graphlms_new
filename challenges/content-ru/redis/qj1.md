На этом этапе вы добавите чтение бита из битовой карты командой `GETBIT`.

### Команда `GETBIT`

Команда [GETBIT](https://redis.io/docs/latest/commands/getbit/) возвращает бит по заданному смещению `offset` в битовой карте.

Если ключ не существует, Redis считает карту полностью нулевой и возвращает `0` для любого смещения.

Пример:

```bash
> SETBIT bit_key 2 1
(integer) 0

> GETBIT bit_key 2
(integer) 1
> GETBIT bit_key 3
(integer) 0
> GETBIT new_key 2
(integer) 0
```

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем создаст битовую карту командой `SETBIT`.

```bash
$ redis-cli SETBIT bit_key 2 1
```

Далее отправит команду `GETBIT` для установленного бита.

```bash
$ redis-cli GETBIT bit_key 2
```

Ожидаемый ответ — `:1\r\n`, то есть 1 в формате [целого числа RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers).

Также будет отправлена команда `GETBIT` для неустановленного бита того же ключа.

```bash
$ redis-cli GETBIT bit_key 3
```

Ожидаемый ответ — `:0\r\n`.

Тестирующая система также отправит `GETBIT` для несуществующего ключа.

```bash
$ redis-cli GETBIT new_key 2
```

В этом случае программа тоже должна ответить `:0\r\n`.

### Примечания

- Вызов `GETBIT` со смещением за пределами текущей строки должен возвращать `0`.
