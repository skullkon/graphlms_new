На этом этапе вы добавите поддержку флага `-C` для регистрации дополнений и расширите `-p` для их отображения.

### Регистрация и отображение дополнений

Флаг `-C` указывает `complete` зарегистрировать скрипт дополнения для команды. После регистрации `complete -p <command>` должна выводить его в нормализованном формате.

```bash
$ complete -C /path/to/git/completer git
$ complete -p git
complete -C '/path/to/git/completer' git

$ complete -C /path/to/docker/completer docker
$ complete -p docker
complete -C '/path/to/docker/completer' docker
```

Две особенности формата вывода:

- Путь скрипта заключён в одинарные кавычки.
- Аргументы разделены ровно одним пробелом независимо от записи команды регистрации.

Поэтому даже если при регистрации пользователь добавляет лишние пробелы, вывод всегда остаётся аккуратным:

```bash
$ complete   -C    /path/to/git/completer   git
$ complete -p git
complete -C '/path/to/git/completer' git
```

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh
```

Система зарегистрирует дополнения с помощью `-C` (иногда с лишними пробелами), а затем запросит их с помощью `-p`:

```bash
$ complete  -C  /path/to/completer/script  git
$ complete -p git
complete -C '/path/to/completer/script' git

$ complete   -C /path/to/docker/completer    docker
$ complete -p docker
complete -C '/path/to/docker/completer' docker
```

Тестирующая система проверит, что:

- `complete -C <path> <command>` регистрирует дополнение и ничего не выводит.
- `complete -p <command>` выводит зарегистрированное дополнение в формате `complete -C '<path>' <command>`.
- Вывод использует одинарные кавычки вокруг пути и одиночные пробелы между аргументами.

### Примечания

- На предыдущих этапах `complete -p <command>` выводила `complete: <command>: no completion specification`. Эта ошибка по-прежнему является правильным ответом, если для указанной команды не зарегистрировано дополнение.
- Не повторяйте исходную команду `complete -C`. Разберите аргументы, сохраните их и восстановите вывод в нормализованном формате.
- Одинарные кавычки вокруг пути — буквальные символы в выводе.






