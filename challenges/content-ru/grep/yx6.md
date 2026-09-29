На этом этапе вы добавите поиск по файлам во вложенных каталогах с флагом `-r`.

### Рекурсивный поиск

С флагом `-r` программа `grep` рекурсивно просматривает указанный каталог и его подкаталоги:

```bash
# This prints any lines that match search_pattern from multiple files
$ grep -r -E "search_pattern" directory/
directory/file1.txt:This is a line that matches search_pattern
directory/file2.txt:Another line that matches search_pattern
```

Поведение похоже на поиск в нескольких файлах:
- Все совпавшие строки выводятся в stdout, но с префиксом `<filepath>:` вместо `<filename>:`.
- Программа завершается с кодом `0`, если найдёт хотя бы одну совпавшую строку в любом файле.
- Программа завершается с кодом `1`, если ни в одном файле нет совпавших строк.

### Проверки

Тестирующая система создаст файлы во вложенных каталогах и выполнит поиск вашей программой:

```bash
# Create test files
$ mkdir -p dir/subdir
$ echo "pear" > dir/fruits.txt
$ echo "strawberry" >> dir/fruits.txt
$ echo "celery" > dir/subdir/vegetables.txt
$ echo "carrot" >> dir/subdir/vegetables.txt
$ echo "cucumber" > dir/vegetables.txt
$ echo "corn" >> dir/vegetables.txt

# This must print the matched lines to stdout and exit with code 0
$ ./your_program.sh -r -E ".*er" dir/
dir/fruits.txt:strawberry
dir/subdir/vegetables.txt:celery
dir/vegetables.txt:cucumber

# This must print the matched lines to stdout and exit with code 0
$ ./your_program.sh -r -E ".*ar" dir/
dir/fruits.txt:pear
dir/subdir/vegetables.txt:carrot

# This must print nothing to stdout and exit with code 1
$ ./your_program.sh -r -E "missing_fruit" dir/
```

Затем она проверит, что:

- Все совпавшие строки из всех файлов дерева каталогов выведены в stdout с путями к файлам в качестве префиксов.
- Код завершения равен `0`, если хотя бы в одном файле есть совпавшие строки.
- Код завершения равен `1`, если ни в одном файле нет совпавших строк.

### Примечания

- GNU grep не гарантирует порядок вывода: файлы обрабатываются в порядке, в котором их предоставляет файловая система. Ваш `grep` может выводить совпавшие строки в любом порядке.
- Префикс должен указывать путь относительно переданного каталога с включением этого каталога (например, `dir/subdir/file.txt`, а не просто `file.txt`).
