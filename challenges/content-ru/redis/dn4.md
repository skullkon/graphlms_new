На этом этапе вы добавите доставку опубликованных сообщений подписанным клиентам.

### Доставка сообщений

Когда клиент выполняет `PUBLISH`, сообщение доставляется всем клиентам, которые сейчас подписаны на канал.

Например, клиент, подписанный на `channel_1`, при отправке сообщения `hello` увидит примерно следующее:

```bash
$ redis-cli
> SUBSCRIBE channel_1
1) "subscribe"
2) "channel_1"
3) (integer) 1

# (client is now in subscribed mode)

# When a message is published, it receives the following array: 
1) "message"
2) "channel_1"
3) "hello"
```

Каждый подписчик получает массив из 3 элементов:

1. "message" как объёмную строку RESP.
1. Имя канала как объёмную строку RESP.
1. Содержимое сообщения как объёмную строку RESP.

В этом случае каждый подписчик получает `["message", "channel_1", "hello"]`, закодированный так:

```
*3\r\n
$7\r\n
message\r\n
$9\r\n
channel_1\r\n
$5\r\n
hello\r\n
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст несколько клиентов, слушающих разные каналы.

```bash
# Client 1 subscribes to foo
$ redis-cli
> SUBSCRIBE foo

# Client 2 subscribes to foo
$ redis-cli
> SUBSCRIBE foo

# Client 3 subscribes to bar
$ redis-cli
> SUBSCRIBE bar
```

После этого создаст отдельного клиента и отправит `PUBLISH` для случайных каналов.

```bash
$ redis-cli
> PUBLISH foo "hello"
2
> PUBLISH bar "world"
1
```

Тест проверит, что `PUBLISH` возвращает число подписчиков канала.

Для каждого клиента также будет проверено получение сообщения при наличии подписки. Каждый подписчик должен получить массив вида `["message", "foo", "hello"]`. В RESP он выглядит так:

```
*3\r\n
$7\r\n
message\r\n
$3\r\n
foo\r\n
$5\r\n
hello\r\n
```

Если клиент не подписан на канал, тест проверит, что он не получает отправленные туда сообщения.
