На этом этапе вы реализуете добавление стандартного потока ошибок команды в конец файла.

### Оператор `2>>`

Оператор `2>>` добавляет стандартный поток ошибок команды в конец файла. В отличие от `2>`, который перезаписывает файл, `2>>` дописывает сообщения об ошибках в конец, сохраняя существующее содержимое.

Если файл не существует, он создаётся. Если файл уже существует, новый вывод ошибок добавляется в его конец.

Например: 

```bash
$ cat nonexistent1 2>> errors.txt
$ cat nonexistent2 2>> errors.txt
$ cat errors.txt
cat: nonexistent1: No such file or directory
cat: nonexistent2: No such file or directory
```

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh
```

Затем система отправит оболочке последовательность команд и добавит их стандартный поток ошибок в файл:

```bash
$ ls nonexistent >> /tmp/foo/baz.md
ls: nonexistent: No such file or directory

$ ls nonexistent 2>> /tmp/foo/qux.md
$ cat /tmp/foo/qux.md
ls: nonexistent: No such file or directory

$ echo James says Error 2>> /tmp/foo/quz.md
James says Error

$ cat nonexistent 2>> /tmp/foo/quz.md
$ ls nonexistent 2>> /tmp/foo/quz.md
$ cat /tmp/foo/quz.md
cat: nonexistent: No such file or directory
ls: nonexistent: No such file or directory
```

Тестирующая система проверит, что:
- Команды с `2>>` добавляют стандартный поток ошибок в указанный файл.
- Существующее содержимое файла сохраняется (не перезаписывается).
- Стандартный вывод по-прежнему появляется в терминале (не перенаправляется).
- Если файлов нет, они создаются.
