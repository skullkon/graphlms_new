На этом этапе вы добавите создание файла AOF при включённом сохранении в AOF.

### Создание файла AOF

Вместе с каталогом AOF сервер должен при запуске создавать в нём пустой файл AOF.

Имя файла имеет определённый формат: `<appendfilename>.1.incr.aof`. Суффикс `.1.incr` указывает, что это первый инкрементальный файл AOF. Redis записывает в такие файлы поступающие команды, чтобы затем воспроизвести их и восстановить состояние после перезапуска.

Например, при таком запуске:

```bash
$ ./your_program.sh --dir /tmp/redis-data --appendonly yes --appenddirname appendonlydir --appendfilename appendonly.aof
```

Сервер должен создать пустой файл `/tmp/redis-data/appendonlydir/appendonly.aof.1.incr.aof`.

### Тесты

Тестирующая программа запустит вашу программу так:

```bash
$ ./your_program.sh --dir <dir> --appendonly yes --appenddirname <append_dir_name> --appendfilename <append_file_name>
```

Затем проверит, что:

- Каталог `<dir>/<append_dir_name>` существует.
- Создан пустой файл `<dir>/<append_dir_name>/<append_file_name>.1.incr.aof`.

### Примечания

- Файл должен создаваться при запуске, а не при первой команде записи.
- Пока не нужно записывать в файл содержимое. Это появится позже.
