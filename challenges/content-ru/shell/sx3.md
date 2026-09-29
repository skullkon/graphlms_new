На этом этапе вы добавите поддержку дописывания команд из памяти в файл истории с помощью команды `history -a <path_to_history_file>`.

### Проверки

Тестирующая система запишет следующие команды в файл истории:

```txt
echo initial_command_1
echo initial_command_2
<|EMPTY LINE|>
```

Тестирующая система запустит вашу программу следующим образом:

```bash
./your_program.sh
```

Затем система отправит оболочке следующие команды:

```bash
$ echo new_command
new_command
$ history -a <path_to_history_file>
$
```

Затем тестирующая система ожидает, что файл истории будет содержать новые команды:

```txt
echo initial_command_1
echo initial_command_2
echo new_command
history -a <path_to_history_file>
<|EMPTY LINE|>
```

### Примечания
- Тестирующая система ожидает, что команда `history -a` также присутствует в файле истории.
- Повторные вызовы `history -a` должны добавлять только команды, выполненные с момента предыдущего вызова `history -a`.