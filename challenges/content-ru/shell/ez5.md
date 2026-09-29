На этом этапе вы реализуете встроенную команду `type` для своей оболочки.

### Встроенная команда `type`

Встроенная команда [`type`](https://pubs.opengroup.org/onlinepubs/9799919799/utilities/type.html) определяет, как интерпретировалась бы команда при её использовании. Она проверяет, является ли команда встроенной, исполняемым файлом или неизвестной.

Например:

```bash
$ type echo
echo is a shell builtin
$ type exit
exit is a shell builtin
$ type invalid_command
invalid_command: not found
```

На этом этапе нужно обработать два случая:
- Для встроенных команд (например, `echo`, `exit` и `type`) выводите `<command> is a shell builtin`.
- Для неизвестных команд, не совпадающих ни с одной встроенной, выводите `<command>: not found`.

Исполняемые файлы мы обработаем на следующих этапах.

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
./your_program.sh
```

Затем система отправит оболочке последовательность команд `type`:

```bash
$ type echo
echo is a shell builtin
$ type exit
exit is a shell builtin
$ type type
type is a shell builtin
$ type invalid_command
invalid_command: not found
$
```

Тестирующая система проверит, что:
- Для встроенных команд выводится: `<command> is a shell builtin`.
- Для неизвестных команд выводится: `<command>: not found`.

### Примечания

- На этом этапе тестирующая система проверяет только встроенные и неизвестные команды.
- Сама `type` — встроенная команда оболочки, поэтому `$ type type` должна вывести `type is a shell builtin`.
