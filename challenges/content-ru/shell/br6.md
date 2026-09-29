На этом этапе вы реализуете поддержку простых конвейеров из двух внешних команд.

[Конвейер](https://www.gnu.org/software/bash/manual/bash.html#Pipelines) соединяет стандартный вывод одной команды со стандартным вводом следующей с помощью оператора `|`.

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
./your_program.sh
```

Затем система выполнит несколько конвейеров из двух команд. Примеры:

```bash
$ cat /tmp/foo/file | wc
       5      10      77
```

```bash
$ tail -f /tmp/foo/file-1 | head -n 5
raspberry strawberry
pear mango
pineapple apple
# (tester appends more lines to /tmp/foo/file-1)
# (And expects the running command to keep printing new lines)
This is line 4.
This is line 5.
$
```

Тестирующая система проверит, соответствует ли итоговый вывод ожидаемому результату выполнения конвейера.

Для команды `tail -f` тестирующая система будет добавлять содержимое во входной файл во время работы конвейера.

### Примечания

- Исполняемые файлы (`cat`, `wc`, `tail`, `head`) будут доступны в `PATH`.
- Для выполнения конвейера потребуется создать [канал](https://en.wikipedia.org/wiki/Anonymous_pipe), [породить](https://en.wikipedia.org/wiki/Fork_(system_call))
  процессы для каждой команды и настроить перенаправление стандартного ввода/вывода между ними.