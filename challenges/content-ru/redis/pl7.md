На этом этапе вы добавите свойство `passwords` в ответ команды `ACL GETUSER`.

### Свойство `passwords`

Свойство `passwords` содержит список всех хешированных паролей пользователя.

У пользователя `default` нет паролей, пока их явно не настроят:

```bash
> ACL GETUSER default
 1) "flags"
 2) 1) "nopass"
 3) "passwords"
 4) (empty array)
```

Теперь ответ `ACL GETUSER` должен включать:

1. Строку `passwords` в формате bulk string.
2. Массив RESP со списком паролей. Поскольку у `default` их нет, пока жёстко возвращайте пустой массив.

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

Она проверит, что ответ — массив RESP из четырёх элементов:

1. Первый — строка `flags` в формате bulk string RESP.
2. Второй — массив RESP, содержащий флаг `nopass`.
3. Третий — строка `passwords` в формате bulk string.
4. Четвёртый — пустой массив.
