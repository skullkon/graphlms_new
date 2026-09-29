На этом этапе вы добавите поддержку [history](https://www.gnu.org/software/bash/manual/html_node/Bash-History-Builtins.html#index-history) как встроенной команды оболочки.

### Встроенная команда history

[history](https://www.gnu.org/software/bash/manual/html_node/Bash-History-Builtins.html#index-history) — встроенная команда оболочки, которая выводит ранее выполненные команды. Пример использования: 
```bash
$ history
    1  previous_command_1
    2  previous_command_2
    3  history
```

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
./your_program.sh
```

Затем тестирующая система выполнит команду `type history`.

```bash
$ type history
history is a shell builtin
$
```

Затем тестирующая система выполнит команду `type history` и ожидает вывод `history is a shell builtin`.