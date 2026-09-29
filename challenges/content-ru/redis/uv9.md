На этом этапе вы добавите установку пароля пользователя `default`.

### Команда `ACL SETUSER`

Команда [`ACL SETUSER`](https://redis.io/docs/latest/commands/acl-setuser/) изменяет свойства существующего пользователя.

Правило `>` добавляет пароль указанному пользователю:

```bash
> ACL SETUSER default >mypassword
OK
```

Сервер отвечает `OK` в формате простой строки RESP (`+OK\r\n`).

### Хранение паролей

Добавление пароля через `ACL SETUSER` имеет два эффекта:
- Пароль сохраняется как хеш SHA-256.
- Флаг `nopass` автоматически удаляется.

Например:

```bash
> ACL SETUSER default >mypassword
OK

> ACL GETUSER default
 1) "flags"
 2) (empty array)
 3) "passwords"
 4) 1) "89e01536ac207279409d4de1e5253e01f4a1769e696db0d6062ca9b8f56767c8"
```

Обратите внимание: флаг `nopass` исчез из массива `flags`. Хеш SHA-256 пароля `mypassword` хранится как bulk string в массиве `passwords`.

Redis хранит хеш SHA-256 вместо исходного пароля, чтобы не раскрывать пароль в открытом виде при компрометации базы данных.

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем отправит `ACL GETUSER` для пользователя `default`:

```bash
# Expect RESP array: ["flags", ["nopass"], "passwords", []]
$ redis-cli ACL GETUSER default
1) "flags"
2) 1) "nopass"
3) "passwords"
4) (empty array)
```

Она проверит, что:

- В массиве флагов присутствует `nopass`.
- Массив `passwords` пуст.

Далее она отправит `ACL SETUSER` с пользователем `default` и паролем:

```bash
# Expect: +OK\r\n
> ACL SETUSER default >mypassword
OK
```

Сервер должен ответить `+OK\r\n`.

Наконец, будет отправлена команда `ACL GETUSER` для пользователя `default`:

```bash
# Expect RESP array: ["flags", ["nopass"], "passwords", ["89e01536ac207279409d4de1e5253e01f4a1769e696db0d6062ca9b8f56767c8"]]
> ACL GETUSER default
1) "flags"
2) 1) "nopass"
3) "passwords"
4) 1) "89e01536ac207279409d4de1e5253e01f4a1769e696db0d6062ca9b8f56767c8"
```

Она проверит, что:

- Флаг `nopass` больше не присутствует.
- Массив `passwords` содержит хеш SHA-256 пароля `mypassword` в формате bulk string.

### Примечания

- Redis использует SHA-256 для хранения паролей. Вычислите и сохраните хеш SHA-256 переданного пароля.
- Хеш нужно хранить как шестнадцатеричную строку в нижнем регистре.
- В последнем примере исходного задания флаг nopass показан по ошибке. Ориентируйтесь на требования проверки выше: после добавления пароля этот флаг должен отсутствовать.
