Все данные репозитория Git — от истории коммитов до настроек — находятся в скрытом каталоге `.git`. Он создаётся при инициализации нового репозитория командой `git init`. На этом этапе вы реализуете эту команду самостоятельно.

<!--

### Команда `git init`

<details>
  <summary>Нажмите, чтобы развернуть или свернуть</summary>

  Команда `git init` инициализирует репозиторий Git, создавая каталог `.git` с некоторыми файлами и подкаталогами.

  Подробнее о содержимом `.git` можно прочитать [здесь](https://blog.meain.io/2023/what-is-in-dot-git/). Ниже описаны файлы и каталоги, с которыми мы будем работать на этом этапе.

</details>

### Каталог `.git`

<details>
  <summary>Нажмите, чтобы развернуть или свернуть</summary>

  Минимально каталог `.git` должен содержать следующие файлы и подкаталоги:

  ```
  - .git/
    - objects/
    - refs/
    - HEAD (should contain "ref: refs/heads/main\n" for a new repository)
  ```

  - `objects/`
    - В этом каталоге находятся [объекты Git](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects).
    - Подробнее об объектах Git мы узнаем на следующих этапах.
  - `refs/`
    - В этом каталоге находятся [ссылки Git](https://git-scm.com/book/en/v2/Git-Internals-Git-References).
    - С ними мы также будем работать на следующих этапах.
  - `HEAD`
    - Этот файл содержит ссылку на текущую выбранную ветку.
    - Для нового репозитория его содержимое — `ref: refs/heads/main\n`.

  Подробнее об этом можно прочитать [здесь](https://blog.meain.io/2023/what-is-in-dot-git/).
</details>

### Тесты

Тестирующая система запустит вашу программу в новом пустом каталоге следующим образом:

```bash
# Create a new directory and cd into it
$ mkdir test_dir && cd test_dir

# Run your program
$ /path/to/your_program.sh init
```

Затем проверит, правильно ли созданы каталог `.git` и его содержимое.

```bash
# Check if .git directory exists
$ test -d .git

# Check if .git/objects directory exists
$ test -d .git/objects

# Check if .git/refs directory exists
$ test -d .git/refs

# Check if .git/HEAD file exists
$ test -f .git/HEAD

# Check if .git/HEAD contains either "ref: refs/heads/main\n" or "ref: refs/heads/master\n"
$ cat .git/HEAD
```

### Примечания

- При выполнении `git init` Git создаёт больше файлов и каталогов, чем перечислено выше. Мы включили только те, без которых Git не может работать корректно.
- Файл `.git/HEAD` заканчивается переводом строки.
- Файл `.git/HEAD` может содержать `ref: refs/heads/main\n` или `ref: refs/heads/master\n`; тестирующая система поддерживает оба варианта.

-->
