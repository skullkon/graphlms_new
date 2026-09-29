На этом этапе вы добавите поддержку дописывания истории из памяти в файл истории при выходе.

### Проверки

Тестирующая система запишет следующие команды в файл истории:

```txt
echo initial_command_1
echo initial_command_2
<|EMPTY LINE|>
```

Тестирующая система запустит вашу программу следующим образом:

```bash
HISTFILE=<path_to_history_file> ./your_program.sh
```

Затем система отправит оболочке следующие команды:

```bash
$ echo new_command
new_command
$ exit
```

После этого тестирующая система ожидает следующее содержимое файла истории:

```txt
echo initial_command_1
echo initial_command_2
echo new_command
exit
<|EMPTY LINE|>
```
