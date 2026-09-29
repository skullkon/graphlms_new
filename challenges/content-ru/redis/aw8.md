На этом этапе вы добавите перевод клиента в режим подписки.

### Режим подписки

После команды подписки клиент входит в «режим подписки». В нём разрешены только команды:

- `SUBSCRIBE`
- `UNSUBSCRIBE`
- `PSUBSCRIBE`
- `PUNSUBSCRIBE`
- `PING`
- `QUIT`

Остальные команды сервер отклоняет с ошибкой, например:

```
$ redis-cli
> SUBSCRIBE channel
1) "subscribe"
2) "channel"
3) (integer) 1

(subscribed mode)> ECHO hey
(error) ERR Can't execute 'echo': only (P|S)SUBSCRIBE / (P|S)UNSUBSCRIBE / PING / QUIT / RESET are allowed in this context
```

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем отправит серверу `SUBSCRIBE`, чтобы перейти в режим подписки:

```bash
$ redis-cli
> SUBSCRIBE foo
# Expecting ["subscribe", "foo", 1]
```

После этого тест отправит серию команд, как разрешённых, так и запрещённых в этом режиме.

Для запрещённых команд, например `SET`, `GET` и `ECHO`, тест проверит ответ с ошибкой:

```
> SET key value
- ERR Can't execute 'set': only (P|S)SUBSCRIBE / (P|S)UNSUBSCRIBE / PING / QUIT / RESET are allowed in this context 
```

Проверяется только начало сообщения "ERR Can't execute '<command_name>'", поэтому формулировка может отличаться от точного формата Redis.

Для `SUBSCRIBE` тест проверит обычный ответ.

```bash
> SUBSCRIBE bar
# Expecting ["subscribe", "bar", 2] as RESP-encoded array
```

### Примечания

- Для запрещённых команд проверка сообщения гибкая: точное соответствие формату Redis не требуется. Проверяется строка `ERR Can't execute '<command>'` без учёта регистра. Примеры сообщений, которые пройдут тест:
    - `ERR Can't execute 'set' in subscribed mode`
    - `ERR can't execute 'SET' when one or more subscriptions exist`
- В режиме подписки `PING` имеет другой ответ, не `+PONG\r\n`. Это появится позже.
