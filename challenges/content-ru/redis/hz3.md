На этом этапе вы добавите поддержку команды `AUTH`.

### Команда `AUTH`

Команда [`AUTH`](https://redis.io/docs/latest/commands/auth/) аутентифицирует текущее соединение с указанными именем пользователя и паролем.

Формат команды:

```bash
AUTH <username> <password>
```

Например:

```bash
# Authentication failure
> AUTH default wrongpassword
(error) WRONGPASS invalid username-password pair or user is disabled.

# Authentication success
> AUTH default correctpassword
OK
```

Сервер отвечает `+OK\r\n`, если хеш переданного пароля совпадает с одним из хешей в списке паролей пользователя.

Если совпадения нет, сервер возвращает [простую ошибку RESP](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-errors): `WRONGPASS invalid username-password pair or user is disabled.`

На этом этапе достаточно правильно ответить на `AUTH`. Реально аутентифицировать соединение пока не нужно — это появится позже.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем отправит `ACL SETUSER` с пользователем `default` и паролем:

```bash
$ redis-cli ACL SETUSER default >mypassword
OK
```

Сервер должен ответить `OK` в формате простой строки (`+OK\r\n`).

Далее будут отправлены две команды `AUTH`: с неправильным и с правильным паролями.

```bash
# Expect error starting with: WRONGPASS
> AUTH default wrongpassword
(error) WRONGPASS invalid username-password pair or user is disabled.

# Expect: +OK\r\n
> AUTH default mypassword
OK
```

Она проверит, что:
- Неправильный пароль возвращает [простую ошибку](https://redis.io/docs/latest/develop/reference/protocol-spec/#simple-errors), начинающуюся с `WRONGPASS`.
- Правильный пароль возвращает `+OK\r\n`.

### Примечания

- Проверка текста ошибок допускает вариации. Подходит любая ошибка аутентификации, начинающаяся с `WRONGPASS`. Например:
    - `WRONGPASS wrong password`;
    - `WRONGPASS invalid authentication`.
