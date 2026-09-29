На этом этапе вы реализуете команду `git commit-tree`, создающую объект коммита.

### Коммиты

Последний тип объектов Git, с которым мы будем работать в этом задании, — [объект коммита](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects#_git_commit_objects).

Файл объекта коммита выглядит так (до сжатия Zlib):

```
commit <size>\0tree <tree_sha>
parent <parent_sha>
author <name> <<email>> <timestamp> <timezone>
committer <name> <<email>> <timestamp> <timezone>

<commit message>
```

- Файл начинается с `commit <size>\0` (тот же шаблон заголовка, что у blob-объектов и деревьев).
- После заголовка идёт обычный текст, а не двоичные данные.
- Каждая строка заканчивается символом перевода строки (`\n`).
- Хеши SHA дерева и родителя записаны в шестнадцатеричном формате (40 символов), в отличие от объектов-деревьев, где они занимают `20` байт.
- Между метаданными и сообщением коммита находится пустая строка.
- Формат времени: `<seconds_since_epoch> <timezone_offset>` (например, `1234567890 +0000`).

Пример объекта коммита:
```
commit 177\0tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904
parent 3b18e512dba79e4c8300dd08aeb37f8e728b8dad
author John Doe <john@example.com> 1234567890 +0000
committer John Doe <john@example.com> 1234567890 +0000

Initial commit
```

Подробнее о формате объекта коммита можно прочитать [здесь](https://stackoverflow.com/questions/22968856/what-is-the-file-format-of-a-git-commit-object-data-structure).

### Команда `git commit-tree`

Команда `git commit-tree` создаёт объект коммита.

Например:

```bash
$ mkdir test_dir && cd test_dir
$ git init
Initialized empty Git repository in /path/to/test_dir/.git/

# Create a tree, get its SHA
$ echo "hello world" > test.txt
$ git add test.txt
$ git write-tree
4b825dc642cb6eb9a060e54bf8d69288fbee4904

# Create the initial commit
$ git commit-tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904 -m "Initial commit"
3b18e512dba79e4c8300dd08aeb37f8e728b8dad

# Write some changes, get another tree SHA
$ echo "hello world 2" > test.txt
$ git add test.txt
$ git write-tree
5b825dc642cb6eb9a060e54bf8d69288fbee4904

# Create a new commit with the new tree SHA and parent
$ git commit-tree 5b825dc642cb6eb9a060e54bf8d69288fbee4904 -p 3b18e512dba79e4c8300dd08aeb37f8e728b8dad -m "Second commit"
6c18e512dba79e4c8300dd08aeb37f8e728b8dad
```

Команда `git commit-tree` выводит 40-символьный хеш SHA-1 объекта коммита, записанного в `.git/objects`.

### Тесты

Ваша программа будет запущена следующим образом:

```bash
$ ./your_program.sh commit-tree <tree_sha> -p <commit_sha> -m <message>
```

Программа должна создать объект коммита и вывести его 40-символьный хеш SHA-1 в stdout.

Для упрощения:
- Вы получите ровно один родительский коммит.
- Сообщение будет состоять ровно из одной строки.
- Можно жёстко задать любое допустимое имя и адрес электронной почты для полей автора и создателя коммита.
- Можно использовать любую допустимую временную метку, например текущее время или фиксированное значение.

Тестирующая система проверит результат, прочитав объект коммита из каталога `.git` командой `git show`.

### Примечания

- Для простых коммитов строки автора и создателя коммита обычно совпадают. Можно жёстко задать значения вроде `John Doe <john@example.com> 1234567890 +0000`.
