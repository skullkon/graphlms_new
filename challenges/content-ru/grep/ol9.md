На этом этапе вы добавите поиск в файле, содержащем несколько строк.

### Поиск в многострочном файле

При поиске в многострочном файле `grep` обрабатывает каждую строку отдельно:

```bash
# This prints any lines that match search_pattern
$ grep -E "search_pattern" multi_line_file.txt
This is a line that matches search_pattern
This is another line that matches search_pattern
```

Как и при поиске в однострочном файле, `grep`:

- Выводит все совпавшие строки в stdout.
- Завершается с кодом `0`, если найдена хотя бы одна совпавшая строка.
- Завершается с кодом `1`, если совпавших строк нет.

### Проверки

Тестирующая система создаст файлы и выполнит поиск вашей программой:

```bash
# Create test file
$ echo "banana" > fruits.txt
$ echo "grape" >> fruits.txt
$ echo "blackberry" >> fruits.txt
$ echo "blueberry" >> fruits.txt

# This must print the matched lines to stdout and exit with code 0
$ ./your_program.sh -E ".*berry" fruits.txt
blackberry
blueberry

# This must print nothing to stdout and exit with code 1
$ ./your_program.sh -E "carrot" fruits.txt
```

Затем она проверит, что:

- Все совпавшие строки выведены в stdout.
- Код завершения равен `0`, если совпавшие строки есть.
- Код завершения равен `1`, если совпавших строк нет.

### Примечания

- Нужно читать файл построчно и независимо проверять каждую строку на соответствие шаблону.
- На этом этапе гарантируется, что файл существует и содержит несколько строк.
