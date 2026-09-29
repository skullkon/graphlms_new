На этом этапе вы добавите ответ на команду `ACL WHOAMI`.

### Команда `ACL WHOAMI`

Команда [`ACL WHOAMI`](https://redis.io/docs/latest/commands/acl-whoami/) возвращает имя пользователя текущего соединения.

По умолчанию каждое новое соединение Redis автоматически аутентифицируется как пользователь `default`.

Например:

```bash
> ACL WHOAMI
"default"
```

Команда возвращает имя текущего аутентифицированного пользователя в формате [bulk string RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

Это поведение можно изменить, чтобы новые соединения начинали работу без аутентификации. Мы рассмотрим это позже.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем отправит команду `ACL WHOAMI`:

```bash
# Expect RESP bulk string: "default"
$ redis-cli ACL WHOAMI
"default"
```

Ожидаемый ответ — `$7\r\ndefault\r\n`, то есть строка `default` в формате [bulk string](https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings).

### Примечания

- На этом этапе ответ команды `ACL WHOAMI` можно жёстко задать как `default`. Обязательную аутентификацию реализуем позже.
