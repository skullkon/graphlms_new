На этом этапе вы реализуете обязательную аутентификацию с помощью команды `AUTH`.

### Аутентификация через `AUTH`

После успешной команды `AUTH` соединение аутентифицировано как указанный пользователь. Теперь оно может выполнять команды, которые раньше возвращали ошибки `NOAUTH`.

Например:

```bash
# Client 1
$ redis-cli
> ACL SETUSER default >newpassword
OK

> ACL WHOAMI
"default"

# Client 2 (new connection)
$ redis-cli
> ACL WHOAMI
(error) NOAUTH Authentication required.

> AUTH default newpassword
OK

# Client 2 is now authenticated as the 'default' user
> ACL WHOAMI
"default"
```

Аутентификация действует в течение всего соединения: клиенту не нужно повторять её для каждой команды.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем выполнит команды через два разных клиента:

```bash
# Client 1
$ redis-cli
> ACL SETUSER default >newpassword
OK

> ACL WHOAMI
"default"  # Still authenticated

# Client 2 (new connection)
$ redis-cli
> PING
(error) NOAUTH Authentication required.

> AUTH default newpassword
OK

> PING
PONG
```

Она проверит, что:

1. Новый клиент получает ошибку `NOAUTH`, если пытается выполнять команды до аутентификации.
2. При успешной аутентификации команда `AUTH` возвращает `OK` в формате простой строки.
3. После аутентификации клиент может успешно выполнять команды.

### Примечания

- Все команды, кроме `AUTH`, должны возвращать ошибки `NOAUTH` при вызове из неаутентифицированного соединения. Это относится ко всем реализованным командам, а не только к `ACL`.
