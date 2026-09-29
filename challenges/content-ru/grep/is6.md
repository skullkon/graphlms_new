На этом этапе вы добавите поиск в нескольких файлах.

### Поиск в нескольких файлах

При поиске в нескольких файлах `grep` обрабатывает каждый файл отдельно:

```bash
# This prints any lines that match search_pattern from multiple files
$ grep -E "search_pattern" file1.txt file2.txt
file1.txt:This is a line that matches search_pattern
file2.txt:Another line that matches search_pattern
```

Поведение похоже на поиск в одном файле, но есть отличия:

- Все совпавшие строки выводятся в stdout с префиксом `<filename>:`.
- Программа завершается с кодом `0`, если хотя бы в одном из файлов найдена совпавшая строка.
- Программа завершается с кодом `1`, если ни в одном файле нет совпавших строк.

### Проверки

Тестирующая система создаст файлы и выполнит поиск вашей программой:

```bash
# Create test files
$ echo "banana" > fruits.txt
$ echo "blueberry" >> fruits.txt
$ echo "broccoli" > vegetables.txt
$ echo "carrot" >> vegetables.txt

# This must print the matched lines to stdout and exit with code 0
$ ./your_program.sh -E "b.*$" fruits.txt vegetables.txt
fruits.txt:banana
fruits.txt:blueberry
vegetables.txt:broccoli

# This must print nothing to stdout and exit with code 1
$ ./your_program.sh -E "missing_fruit" fruits.txt vegetables.txt
```

Затем она проверит, что:

- Все совпавшие строки выведены в stdout с именами файлов в качестве префиксов.
- Код завершения равен `0`, если хотя бы в одном файле есть совпавшие строки.
- Код завершения равен `1`, если ни в одном файле нет совпавших строк.
