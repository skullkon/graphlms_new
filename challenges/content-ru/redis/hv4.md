На этом этапе вы добавите объединение битовых карт через `BITOP AND`.

### Команда `BITOP`

Команда [BITOP](https://redis.io/docs/latest/commands/bitop/) выполняет побитовую операцию над одной или несколькими картами и сохраняет результат в целевой ключ.

`BITOP AND` устанавливает бит результата только тогда, когда он установлен во всех исходных картах.

В примере две карты созданы командами `SETBIT`: `key1` равна `10001000`, а `key2` — `10000010`.

```bash
> BITOP AND dest key1 key2
(integer) 1
> GETBIT dest 0
(integer) 1
> GETBIT dest 4
(integer) 0
> GETBIT dest 6
(integer) 0
```

После операции `BITOP AND` над `key1` и `key2` получаем карту `dest` со значением `10000000`: в обеих исходных картах установлен только бит `0`.

`BITOP` возвращает длину строки результата в байтах в формате [целого числа RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#integers). Здесь длина равна 1 байту, поэтому возвращается `1`.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем создаст две карты одинаковой длины командами `SETBIT`.

```bash
$ redis-cli SETBIT key1 0 1
$ redis-cli SETBIT key1 4 1
$ redis-cli SETBIT key2 0 1
$ redis-cli SETBIT key2 6 1
```

Она отправит `BITOP AND`, сохраняющую результат в новый ключ.

```bash
$ redis-cli BITOP AND dest key1 key2
```

Ожидаемый ответ — `:1\r\n`.

Далее будут отправлены команды `GETBIT` для целевого ключа.

```bash
$ redis-cli GETBIT dest 0
```

Ожидаемый ответ — `:1\r\n`.

```bash
$ redis-cli GETBIT dest 4
```

Ожидаемый ответ — `:0\r\n`.

### Примечания

- Здесь достаточно `BITOP AND` для двух исходных ключей одинаковой длины. Карты разной длины рассмотрим позже.
- `BITOP` поддерживает и другие [операции](https://redis.io/docs/latest/commands/bitop/): `OR`, `XOR` и `NOT`. Операция `BITOP OR` появится на следующих этапах, а `XOR` и `NOT` в этой задаче не рассматриваются.
