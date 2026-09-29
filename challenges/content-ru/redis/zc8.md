На этом этапе вы добавите подписку на несколько каналов через `SUBSCRIBE`.

### Несколько команд SUBSCRIBE

Клиент может отправлять `SUBSCRIBE` несколько раз для подписки на разные каналы. Например:

```bash
$ redis-cli
> SUBSCRIBE channel_1
1) "subscribe"
2) "channel_1"
3) (integer) 1

(subscribed mode)> SUBSCRIBE channel_2
1) "subscribe"
2) "channel_2"
3) (integer) 2
```

Клиент может повторно подписаться на тот же канал, но общее количество подписок, возвращаемое третьим элементом массива ответа, не изменится.

Например:

```bash
$ redis-cli
> SUBSCRIBE channel_1
1) "subscribe"
2) "channel_1"
3) (integer) 1

# The count remains 1 since channel is same
(subscribed mode)> SUBSCRIBE channel_1
1) "subscribe"
2) "channel_1"
3) (integer) 1
```

Количество подписок хранится отдельно для каждого клиента: это число каналов, на которые подписан именно он.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh
```

Затем создаст клиента и отправит несколько `SUBSCRIBE`, каждый раз указывая новый канал.

```bash
$ redis-cli
> SUBSCRIBE foo
# Expect ["subscribe", "foo", 1]

> SUBSCRIBE bar
# Expect ["subscribe", "bar", 2]

> SUBSCRIBE bar
# Expect ["subscribe", "bar", 2]
```

Тест повторит это с другими клиентами и проверит, что количество подписок учитывается для каждого клиента отдельно.
