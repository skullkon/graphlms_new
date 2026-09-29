На этом этапе вы добавите `UNSUBSCRIBE` для отмены подписки на канал.

### Команда `UNSUBSCRIBE`

Эта команда удаляет подписку клиента на один или несколько каналов. Пример:

```bash
$ redis-cli
> SUBSCRIBE foo
1) "subscribe"
2) "foo"
3) (integer) 1
(subscribed mode)> SUBSCRIBE bar
1) "subscribe"
2) "bar"
3) (integer) 2
(subscribed mode)> UNSUBSCRIBE foo
1) "unsubscribe"
2) "foo"
3) (integer) 1
(subscribed mode)> UNSUBSCRIBE bar
1) "unsubscribe"
2) "bar"
3) (integer) 0
```

При отмене подписки сервер отвечает массивом RESP из 3 элементов:

1. "unsubscribe" как объёмную строку RESP.
1. Имя канала как объёмную строку RESP.
1. Количество оставшихся подписок клиента как целое число RESP.

Если подписки на канал не было, возвращается массив с прежним количеством оставшихся каналов. Например:

```bash
$ redis-cli
> subscribe foo
1) "subscribe"
2) "foo"
3) (integer) 1

(subscribed mode)> unsubscribe bar
1) "unsubscribe"
2) "bar"
3) (integer) 1
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст несколько клиентов, слушающих разные каналы:

```bash
# Client 1 subscribes to 'foo' and 'baz'
$ redis-cli
> SUBSCRIBE foo
> SUBSCRIBE baz

# Client 2 subscribes to 'foo' and 'bar'
$ redis-cli
> SUBSCRIBE foo
> SUBSCRIBE bar
```

После этого создаст отдельного клиента, публикующего сообщения в случайные каналы.

```bash
$ redis-cli
> PUBLISH foo "before-unsubscribe"
```

Тест проверит, что подписчики канала получают сообщение, а остальные клиенты — нет.

Затем подписанным клиентам будут отправлены случайные команды `UNSUBSCRIBE`:

```bash
# In client 1, which was subscribed to 'foo' and 'baz'
> UNSUBSCRIBE foo
# Expects ["unsubscribed", "foo", 1] as an RESP array
```

Наконец, тест снова опубликует сообщения в случайные каналы:

```bash
> PUBLISH foo "after-unsubscribe"
```

Он проверит, что подписчики канала получают сообщение, а остальные клиенты — нет.
