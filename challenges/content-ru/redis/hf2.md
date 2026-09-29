На этом этапе вы добавите команду `PUBLISH`.

### Команда `PUBLISH`

[Команда PUBLISH](https://redis.io/docs/latest/commands/publish/) доставляет сообщение всем клиентам, подписанным на канал.

```
> PUBLISH channel_name message_contents
(integer) 3
```

Ответ на команду — количество клиентов, подписанных на канал.

Пока вы реализуете только ответ на `PUBLISH`. Доставлять сообщение клиентам ещё не нужно: это появится позже.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст несколько клиентов, слушающих разные каналы.

```bash
# Client 1 subscribes to channel "foo"
$ redis-cli
> SUBSCRIBE foo

# Client 2 subscribes to channel "bar"
$ redis-cli
> SUBSCRIBE bar

# Client 3 subscribes to channel "bar"
$ redis-cli
> SUBSCRIBE bar
```

После этого опубликует сообщения в разные каналы через `PUBLISH` и проверит, что ответ совпадает с количеством подписчиков канала.

```
$ redis-cli PUBLISH bar "msg"
(integer) 2
```

В примере ожидается 2 в формате целого числа RESP, поскольку на канал bar подписаны 2 клиента.

Аналогично для канала `foo`:

```
$ redis-cli PUBLISH foo "msg"
(integer) 1
```

Ожидается 1 в формате целого числа RESP, поскольку на него подписан только 1 клиент.
