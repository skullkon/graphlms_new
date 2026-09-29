На этом этапе вы добавите обязательную аутентификацию пользователя `default`.

### Обязательная аутентификация пользователя `default`

Для пользователя `default` новое соединение автоматически аутентифицируется как пользователь `default`, поскольку у него изначально установлен флаг `nopass`.

После установки пароля для `default` новые соединения больше не аутентифицируются автоматически. Однако уже аутентифицированные соединения остаются в системе.

Например:

```bash
# Client 1
$ redis-cli ACL SETUSER default >password
OK

# This connection remains authenticated as the default user
> ACL WHOAMI
"default"

# Client 2
# This connection is not authenticated
$ redis-cli ACL WHOAMI
(error) NOAUTH Authentication required.
```

Если неаутентифицированное соединение пытается выполнить команду, верните простую ошибку: `NOAUTH Authentication required.`

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем выполнит команды через два разных клиента:

```bash
# Client 1
$ redis-cli
# Expect: +OK\r\n
> ACL SETUSER default >newpassword
OK

# Expect RESP bulk string: "default"
> ACL WHOAMI
"default"

# Client 2 (new connection)
$ redis-cli
# Expect error starting with: "NOAUTH"
> ACL WHOAMI
(error) NOAUTH Authentication required.
```

Она проверит, что:
- Клиент 1 всё ещё может выполнять команды и остаётся аутентифицированным как `default`.
- Клиент 2 получает ошибку `NOAUTH` при попытке выполнить команды без аутентификации.
