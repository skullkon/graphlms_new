На этом этапе вы реализуете создание blob-объекта командой [`git
hash-object`](https://git-scm.com/docs/git-hash-object).

### Команда `git hash-object`

<details>
  <summary>Нажмите, чтобы развернуть или свернуть</summary>

  Команда `git hash-object` вычисляет хеш SHA-1 объекта Git. С флагом `-w` она также записывает объект в каталог `.git/objects`.

  Пример использования `git hash-object`:

  ```bash
  # Create a file with some content
  $ echo -n "hello world" > test.txt

  # Compute the SHA-1 hash of the file + write it to .git/objects
  $ git hash-object -w test.txt
  95d09f2b10159347eece71399a7e2e907ea3df4f

  # Verify that the file was written to .git/objects
  $ file .git/objects/95/d09f2b10159347eece71399a7e2e907ea3df4f
  .git/objects/95/d09f2b10159347eece71399a7e2e907ea3df4f: zlib compressed data
  ```

</details>

### Хранение blob-объектов: повторение

<details>
  <summary>Нажмите, чтобы развернуть или свернуть</summary>

  Как упоминалось на предыдущем этапе, каждый blob-объект Git хранится отдельным файлом в каталоге `.git/objects`. Файл содержит заголовок и содержимое blob-объекта, сжатые с помощью Zlib.

  Формат файла blob-объекта выглядит так (после распаковки Zlib):

  ```
  blob <size>\0<content>
  ```

  - `<size>` — размер содержимого в байтах.
  - `\0` — нулевой байт.
  - `<content>` — само содержимое файла.

  Например, если файл содержит `hello world`, файл blob-объекта будет выглядеть так (после распаковки Zlib):

  ```
  blob 11\0hello world
  ```

</details>

### Тесты

Тестирующая система сначала инициализирует новый репозиторий Git вашей программой:

```bash
$ mkdir test_dir && cd test_dir
$ /path/to/your_program.sh init
```

Затем запишет в файл случайные данные:

```bash
$ echo "hello world" > test.txt
```

После этого запустит вашу программу следующим образом:

```bash
$ ./your_program.sh hash-object -w test.txt
3b18e512dba79e4c8300dd08aeb37f8e728b8dad
```

Тестирующая система проверит, что:

- Программа выводит 40-символьный хеш SHA-1 в stdout.
- Файл, записанный в `.git/objects`, совпадает с тем, который записала бы официальная реализация `git`.

### Примечания

- Хотя файл объекта хранится в сжатом формате zlib, хеш SHA-1 нужно вычислять по его несжатому содержимому, а не по сжатой версии.
- Входом для вычисления SHA-1 служат заголовок (`blob <size>\0`) и содержимое файла вместе, а не только содержимое.
